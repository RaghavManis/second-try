package com.cricket.tournament.service;

import com.cricket.tournament.dto.*;
import com.cricket.tournament.model.*;
import com.cricket.tournament.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class MatchScoringService {

    private static final Logger logger = LoggerFactory.getLogger(MatchScoringService.class);

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private BallEventRepository ballEventRepository;

    @Autowired
    private ScorecardBattingRepository scorecardBattingRepository;

    @Autowired
    private ScorecardBowlingRepository scorecardBowlingRepository;

    @Autowired
    private PlayerMatchStatsRepository playerMatchStatsRepository;

    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto startLiveScoring(Long matchId, LiveMatchSetupDto setup) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() == Match.MatchStatus.COMPLETED) throw new IllegalStateException("Cannot alter a completed match");
        match.setStatus(Match.MatchStatus.ONGOING);
        liveDetailsCache.invalidate(matchId);
        match.setTossWinner(teamRepository.findById(setup.getTossWinnerId()).orElseThrow(() -> new IllegalArgumentException("Invalid Toss Winner")));
        match.setTossDecision(setup.getTossDecision());
        
        if ("BATTING".equals(setup.getTossDecision())) {
            match.setBattingTeam(match.getTossWinner());
            match.setBowlingTeam(match.getTossWinner().getId().equals(match.getTeamA().getId()) ? match.getTeamB() : match.getTeamA());
        } else {
            match.setBowlingTeam(match.getTossWinner());
            match.setBattingTeam(match.getTossWinner().getId().equals(match.getTeamA().getId()) ? match.getTeamB() : match.getTeamA());
        }

        match.setCurrentInnings(1);
        match.setCurrentScore(0);
        match.setCurrentWickets(0);
        match.setCurrentBalls(0);
        match.setCurrentStriker(playerRepository.findById(setup.getStrikerId()).orElseThrow(() -> new IllegalArgumentException("Striker not found")));
        match.setCurrentNonStriker(playerRepository.findById(setup.getNonStrikerId()).orElseThrow(() -> new IllegalArgumentException("Non-striker not found")));
        match.setCurrentBowler(playerRepository.findById(setup.getOpeningBowlerId()).orElseThrow(() -> new IllegalArgumentException("Bowler not found")));
        
        if (setup.getPlayingXiTeamAIds() != null) {
            match.setPlayingXiTeamA(new HashSet<>(playerRepository.findAllById(setup.getPlayingXiTeamAIds())));
        }
        if (setup.getPlayingXiTeamBIds() != null) {
            match.setPlayingXiTeamB(new HashSet<>(playerRepository.findAllById(setup.getPlayingXiTeamBIds())));
        }
        
        Match savedMatch = matchRepository.save(match);
        
        logger.info("[AUDIT] Match {} scoring started. Toss won by {}, chose {}", matchId, savedMatch.getTossWinner().getTeamName(), setup.getTossDecision());
        
        // Ensure scorecards are mathematically idempotent to prevent UniqueConstraint crashes if setup is clicked twice (e.g. across two days).
        ScorecardBatting strikerCard = scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, 1, savedMatch.getCurrentStriker().getId())
            .orElseGet(() -> createBattingCard(savedMatch, savedMatch.getCurrentStriker()));
        scorecardBattingRepository.save(strikerCard);
        
        ScorecardBatting nonStrikerCard = scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, 1, savedMatch.getCurrentNonStriker().getId())
            .orElseGet(() -> createBattingCard(savedMatch, savedMatch.getCurrentNonStriker()));
        scorecardBattingRepository.save(nonStrikerCard);
        
        ScorecardBowling bowlerCard = scorecardBowlingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, 1, savedMatch.getCurrentBowler().getId())
            .orElseGet(() -> createBowlingCard(savedMatch, savedMatch.getCurrentBowler()));
        scorecardBowlingRepository.save(bowlerCard);
        
        liveDetailsCache.invalidate(matchId);
        return getLiveDetails(matchId, true);
    }

    private ScorecardBatting createBattingCard(Match match, Player player) {
        ScorecardBatting s = new ScorecardBatting();
        s.setMatch(match);
        s.setInnings(match.getCurrentInnings());
        s.setPlayer(player);
        Team team = match.getBattingTeam();
        s.setTeam(team);
        s.setRuns(0); s.setBalls(0); s.setFours(0); s.setSixes(0); s.setStrikeRate(0.0);
        return s;
    }

    private ScorecardBowling createBowlingCard(Match match, Player player) {
        ScorecardBowling s = new ScorecardBowling();
        s.setMatch(match);
        s.setInnings(match.getCurrentInnings());
        s.setPlayer(player);
        Team team = match.getBowlingTeam();
        s.setTeam(team);
        s.setRuns(0); s.setWickets(0); s.setOvers(0.0); s.setMaidens(0); s.setEconomyRate(0.0);
        return s;
    }

    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto recordBall(Long matchId, BallSubmissionDto ballDto) {
        if (ballDto.getRuns() != null && ballDto.getRuns() < 0) {
            throw new IllegalArgumentException("Runs cannot be negative");
        }
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() != Match.MatchStatus.ONGOING) throw new IllegalStateException("Match is not ongoing");
        
        logger.info("[AUDIT] Match {} - Delivery: runs={}, extra={}, wicket={}", matchId, ballDto.getRuns(), ballDto.getExtraType(), ballDto.getIsWicket());
        Match updatedMatch = processBallMath(matchId, match, ballDto, true);
        matchRepository.flush();
        ballEventRepository.flush();
        liveDetailsCache.invalidate(matchId);
        return getLiveDetails(matchId, true);
    }

    private Match processBallMath(Long matchId, Match match, BallSubmissionDto ballDto, boolean saveEvent) {
        String exType = ballDto.getExtraType();
        int batRuns = ballDto.getRuns() != null ? ballDto.getRuns() : 0;
        int extRuns = ballDto.getExtraRuns() != null ? ballDto.getExtraRuns() : 0;
        boolean isWicket = Boolean.TRUE.equals(ballDto.getIsWicket());

        boolean isLegal = (exType == null || "BYE".equals(exType) || "LEG_BYE".equals(exType));

        // Rule 3: Team score must always increase by: runs + extraRuns
        int selectedRuns = batRuns;
        int penaltyRuns = (ballDto.getExtraRuns() != null && ballDto.getExtraRuns() > 0) ? ballDto.getExtraRuns() : 0;
        
        // Default penalty of 1 for Wides/NoBalls if not explicitly provided
        if (penaltyRuns == 0 && ("WIDE".equals(exType) || "NO_BALL".equals(exType))) {
            penaltyRuns = 1;
        }
        
        int totalRuns = selectedRuns + penaltyRuns;

        // Rule 5: Batsman balls
        // A batsman faces a ball only if: Legal delivery OR NoBall
        boolean fitsBatsmanBalls = isLegal || "NO_BALL".equals(exType);

        // Rule 4: Batsman runs
        // Runs should be credited to batsman only when: Normal runs OR No Ball + runs
        int batsmanCreditRuns = (exType == null || "NO_BALL".equals(exType)) ? selectedRuns : 0;

        // Rule 11: Bowler balls
        boolean fitsBowlerBalls = isLegal;

        // Rule 10: Bowler runs
        int bowlerCreditRuns = ("WIDE".equals(exType) || "NO_BALL".equals(exType) || exType == null) ? totalRuns : 0;

        // Rule 6 & 7: Rotation runs
        // Strike rotation depends on runs taken (selectedRuns) AND explicit crossing (for Run Outs/Catches)
        boolean rotate = (selectedRuns % 2 != 0);
        if (Boolean.TRUE.equals(ballDto.getCrossed())) {
            rotate = !rotate;
        }

        // Update Match totals
        int currentScore = match.getCurrentScore() == null ? 0 : match.getCurrentScore();
        int currentBalls = match.getCurrentBalls() == null ? 0 : match.getCurrentBalls();
        int currentWickets = match.getCurrentWickets() == null ? 0 : match.getCurrentWickets();

        currentScore += totalRuns;
        if (isLegal) currentBalls++;
        
        // Rule 8: Wicket
        if (isWicket && currentWickets < 10) {
            String wType = ballDto.getWicketType();
            if (Arrays.asList("BOWLED", "CAUGHT", "LBW", "RUN_OUT", "STUMPED", "HIT_WICKET").contains(wType)) {
                currentWickets++;
            }
        }
        
        match.setCurrentScore(currentScore);
        match.setCurrentBalls(currentBalls);
        match.setCurrentWickets(currentWickets);

        // Save BallEvent
        if (saveEvent) {
            BallEvent event = new BallEvent();
            event.setMatch(match);
            event.setInnings(match.getCurrentInnings());
            int overNumber = currentBalls / 6;
            int ballNumber = currentBalls % 6;
            if (isLegal && ballNumber == 0 && currentBalls > 0) {
                overNumber--;
                ballNumber = 6;
            }
            event.setOverNumber(overNumber);
            event.setBallNumber(ballNumber);
            event.setBowler(match.getCurrentBowler());
            event.setStriker(match.getCurrentStriker());
            event.setNonStriker(match.getCurrentNonStriker());
            event.setRuns(batRuns);
            event.setExtraType(exType);
            event.setExtraRuns(penaltyRuns);
            event.setIsWicket(isWicket);
            
            if (isWicket) {
                event.setWicketType(ballDto.getWicketType());
                event.setPlayerOut(playerRepository.findById(ballDto.getPlayerOutId()).orElse(null));
                if (ballDto.getFielderId() != null) {
                    event.setFielder(playerRepository.findById(ballDto.getFielderId()).orElse(null));
                }
            }
    
            ballEventRepository.save(event);
        }

        // Update ScorecardBatting for Striker
        ScorecardBatting strikerCard = scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), match.getCurrentStriker().getId())
            .orElseGet(() -> createBattingCard(match, match.getCurrentStriker()));
        strikerCard.setRuns(strikerCard.getRuns() + batsmanCreditRuns);
        if (fitsBatsmanBalls) strikerCard.setBalls(strikerCard.getBalls() + 1);
        if (batsmanCreditRuns == 4) strikerCard.setFours(strikerCard.getFours() + 1);
        if (batsmanCreditRuns == 6) strikerCard.setSixes(strikerCard.getSixes() + 1);
        if (strikerCard.getBalls() > 0) strikerCard.setStrikeRate((strikerCard.getRuns() * 100.0) / strikerCard.getBalls());
        
        scorecardBattingRepository.save(strikerCard);

        // Update Wicket component for batting card
        if (isWicket && ballDto.getPlayerOutId() != null) {
            ScorecardBatting outCard;
            if (ballDto.getPlayerOutId().equals(strikerCard.getPlayer().getId())) {
                outCard = strikerCard;
            } else {
                outCard = scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), ballDto.getPlayerOutId())
                    .orElseGet(() -> createBattingCard(match, playerRepository.findById(ballDto.getPlayerOutId()).get()));
            }
            if (Arrays.asList("BOWLED", "LBW").contains(ballDto.getWicketType())) {
                outCard.setHowOut("b " + match.getCurrentBowler().getName());
            } else if ("CAUGHT".equals(ballDto.getWicketType())) {
                String fielderName = "Sub";
                if (ballDto.getFielderId() != null && ballDto.getFielderId() > 0) {
                    fielderName = playerRepository.findById(ballDto.getFielderId()).map(Player::getName).orElse("Sub");
                }
                outCard.setHowOut("c " + fielderName + " b " + match.getCurrentBowler().getName());
            } else if ("RUN_OUT".equals(ballDto.getWicketType())) {
                String fielderName = "Sub";
                if (ballDto.getFielderId() != null && ballDto.getFielderId() > 0) {
                    fielderName = playerRepository.findById(ballDto.getFielderId()).map(Player::getName).orElse("Sub");
                }
                outCard.setHowOut("run out (" + fielderName + ")");
            } else if ("STUMPED".equals(ballDto.getWicketType())) {
                String fielderName = "Sub";
                if (ballDto.getFielderId() != null && ballDto.getFielderId() > 0) {
                    fielderName = playerRepository.findById(ballDto.getFielderId()).map(Player::getName).orElse("Sub");
                }
                outCard.setHowOut("stumped (" + fielderName + ")");
            } else {
                outCard.setHowOut(ballDto.getWicketType().replace("_", " "));
            }
            scorecardBattingRepository.save(outCard);
        }

        // Update ScorecardBowling for Bowler
        ScorecardBowling bowlerCard = scorecardBowlingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), match.getCurrentBowler().getId())
            .orElseGet(() -> createBowlingCard(match, match.getCurrentBowler()));
        bowlerCard.setRuns(bowlerCard.getRuns() + bowlerCreditRuns);
        
        int bowlerBalls = (int) Math.floor(bowlerCard.getOvers() == null ? 0 : bowlerCard.getOvers()) * 6 + (int) Math.round(((bowlerCard.getOvers() == null ? 0 : bowlerCard.getOvers()) - Math.floor(bowlerCard.getOvers() == null ? 0 : bowlerCard.getOvers())) * 10);
        if (fitsBowlerBalls) bowlerBalls++;
        bowlerCard.setOvers((bowlerBalls / 6) + ((bowlerBalls % 6) / 10.0));
        if (bowlerBalls > 0) bowlerCard.setEconomyRate((bowlerCard.getRuns() * 6.0) / bowlerBalls);
        
        // Rule 9: Bowler wicket credit
        if (isWicket) {
             String wType = ballDto.getWicketType();
             if (Arrays.asList("BOWLED", "CAUGHT", "LBW", "STUMPED", "HIT_WICKET").contains(wType)) {
                 bowlerCard.setWickets((bowlerCard.getWickets() == null ? 0 : bowlerCard.getWickets()) + 1);
             }
        }
        scorecardBowlingRepository.save(bowlerCard);

        if (isWicket && ballDto.getNextBatsmanId() != null) {
            Player nextBat = playerRepository.findById(ballDto.getNextBatsmanId()).orElse(null);
            if (ballDto.getPlayerOutId().equals(match.getCurrentStriker().getId())) {
                match.setCurrentStriker(nextBat);
            } else {
                match.setCurrentNonStriker(nextBat);
            }
            // Ensure the new batsman also has an initialized card
            if (nextBat != null) {
                ScorecardBatting nextCard = scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), nextBat.getId())
                    .orElseGet(() -> createBattingCard(match, nextBat));
                scorecardBattingRepository.save(nextCard);
            }
        } else if (isWicket && currentWickets >= 10) {
            // Nullify striker/non-striker explicitly for the 10th wicket bypass
            if (ballDto.getPlayerOutId().equals(match.getCurrentStriker().getId())) {
                match.setCurrentStriker(null);
            } else {
                match.setCurrentNonStriker(null);
            }
        }

        boolean overComplete = isLegal && (currentBalls > 0) && (currentBalls % 6 == 0);
        if (overComplete) {
            rotate = !rotate; // Strike rotates at end of over
            if (ballDto.getNextBowlerId() != null) {
                match.setCurrentBowler(playerRepository.findById(ballDto.getNextBowlerId()).orElse(null));
            } else {
                match.setCurrentBowler(null);
            }
        }

        if (rotate) {
            Player temp = match.getCurrentStriker();
            match.setCurrentStriker(match.getCurrentNonStriker());
            match.setCurrentNonStriker(temp);
        }

        // Auto Innings / Match Completion Checks
        boolean isAllOut = match.getCurrentWickets() >= 10;
        boolean maxOversReached = match.getCurrentBalls() / 6 >= match.getOvers();
        boolean targetChased = match.getCurrentInnings() == 2 && match.getTargetScore() != null && match.getCurrentScore() >= match.getTargetScore();

        if (targetChased && saveEvent) {
            // Target chased -> Complete Match internally if needed, or leave to UI
            // Better to let admin officially complete match to select MOM
            // For now, we just auto end 2nd innings without marking Match COMPLETE (UI completes it).
            match.setCurrentStriker(null);
            match.setCurrentNonStriker(null);
            match.setCurrentBowler(null);
        } else if ((isAllOut || maxOversReached) && saveEvent) {
            if (match.getCurrentInnings() == 1) {
                // Auto End 1st Innings
                // The admin will select the new batsman/bowlers from the UI to resume, so we just set the target and swap teams here.
                match.setFirstInningsScore(match.getCurrentScore());
                match.setFirstInningsWickets(match.getCurrentWickets());
                match.setFirstInningsBalls(match.getCurrentBalls());
                
                match.setCurrentInnings(2);
                match.setTargetScore(match.getCurrentScore() + 1);
                match.setCurrentScore(0);
                match.setCurrentWickets(0);
                match.setCurrentBalls(0);
                
                Team tempTeam = match.getBattingTeam();
                match.setBattingTeam(match.getBowlingTeam());
                match.setBowlingTeam(tempTeam);
                
                match.setCurrentStriker(null);
                match.setCurrentNonStriker(null);
                match.setCurrentBowler(null);
            } else if (match.getCurrentInnings() == 2) {
                // 2nd innings out of resources but didn't chase target -> waiting for UI to complete match
                match.setCurrentStriker(null);
                match.setCurrentNonStriker(null);
                match.setCurrentBowler(null);
            }
        }

        if (saveEvent) {
            matchRepository.save(match);
        }

        return matchRepository.save(match);
    }

    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto updateBowler(Long matchId, Long newBowlerId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() == Match.MatchStatus.COMPLETED) throw new IllegalStateException("Cannot alter a completed match");
        match.setCurrentBowler(playerRepository.findById(newBowlerId).orElseThrow(() -> new RuntimeException("Player not found")));
        liveDetailsCache.invalidate(matchId);
        return getLiveDetails(matchId, true);
    }
    
    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto swapBatsmen(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() == Match.MatchStatus.COMPLETED) throw new IllegalStateException("Cannot alter a completed match");
        Player temp = match.getCurrentStriker();
        if (temp != null && match.getCurrentNonStriker() != null) {
            match.setCurrentStriker(match.getCurrentNonStriker());
            match.setCurrentNonStriker(temp);
        }
        liveDetailsCache.invalidate(matchId);
        return getLiveDetails(matchId, true);
    }
    
    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto undoLastBall(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() != Match.MatchStatus.ONGOING) throw new IllegalStateException("Match is not ongoing");
        
        logger.info("[AUDIT] Match {} - Last ball undone", matchId);

        List<BallEvent> events = ballEventRepository.findByMatchIdAndInningsOrderByOverNumberAscBallNumberAscIdAsc(matchId, match.getCurrentInnings());
        if (events.isEmpty()) {
            throw new RuntimeException("No balls recorded in this innings yet.");
        }

        BallEvent lastEvent = events.get(events.size() - 1);
        ballEventRepository.delete(lastEvent);
        ballEventRepository.flush();

        match.setCurrentScore(0);
        match.setCurrentWickets(0);
        match.setCurrentBalls(0);
        
        List<ScorecardBatting> battingCards = scorecardBattingRepository.findByMatchIdAndInnings(matchId, match.getCurrentInnings());
        for (ScorecardBatting card : battingCards) {
             card.setRuns(0);
             card.setBalls(0);
             card.setFours(0);
             card.setSixes(0);
             card.setStrikeRate(0.0);
             card.setHowOut("Not Out");
        }
        scorecardBattingRepository.saveAll(battingCards);

        List<ScorecardBowling> bowlingCards = scorecardBowlingRepository.findByMatchIdAndInnings(matchId, match.getCurrentInnings());
        for (ScorecardBowling card : bowlingCards) {
             card.setRuns(0);
             card.setOvers(0.0);
             card.setWickets(0);
             card.setEconomyRate(0.0);
             card.setMaidens(0);
        }
        scorecardBowlingRepository.saveAll(bowlingCards);

        events.remove(events.size() - 1);

        if (events.isEmpty()) {
            match.setCurrentStriker(lastEvent.getStriker());
            match.setCurrentNonStriker(lastEvent.getNonStriker());
            match.setCurrentBowler(lastEvent.getBowler());
        } else {
            BallEvent veryFirstBall = events.get(0);
            match.setCurrentStriker(veryFirstBall.getStriker());
            match.setCurrentNonStriker(veryFirstBall.getNonStriker());
            match.setCurrentBowler(veryFirstBall.getBowler());
        }
        
        matchRepository.saveAndFlush(match);
        
        for (int i = 0; i < events.size(); i++) {
             BallEvent ev = events.get(i);
             
             if (match.getCurrentBowler() == null || !match.getCurrentBowler().getId().equals(ev.getBowler().getId())) {
                 match.setCurrentBowler(ev.getBowler());
                 matchRepository.save(match);
             }
             
             BallSubmissionDto dto = new BallSubmissionDto();
             dto.setRuns(ev.getRuns());
             dto.setExtraType(ev.getExtraType());
             dto.setExtraRuns(ev.getExtraRuns());
             dto.setIsWicket(ev.getIsWicket());
             
             if (Boolean.TRUE.equals(ev.getIsWicket())) {
                 dto.setWicketType(ev.getWicketType());
                 dto.setPlayerOutId(ev.getPlayerOut() != null ? ev.getPlayerOut().getId() : null);
                 dto.setFielderId(ev.getFielder() != null ? ev.getFielder().getId() : null);
                 
                 BallEvent nextEv = (i + 1 < events.size()) ? events.get(i + 1) : lastEvent;
                 Player outPlayer = ev.getPlayerOut();
                 if (outPlayer != null) {
                     Player survivor = outPlayer.getId().equals(ev.getStriker().getId()) ? ev.getNonStriker() : ev.getStriker();
                     if (nextEv.getStriker().getId().equals(survivor.getId())) {
                         dto.setNextBatsmanId(nextEv.getNonStriker().getId());
                     } else if (nextEv.getNonStriker().getId().equals(survivor.getId())) {
                         dto.setNextBatsmanId(nextEv.getStriker().getId());
                     } else {
                         dto.setNextBatsmanId(nextEv.getStriker().getId());
                     }
                 }
             }
             
             this.processBallMath(matchId, match, dto, false);
        }

        matchRepository.flush();
        ballEventRepository.flush();
        liveDetailsCache.invalidate(matchId);
        return getLiveDetails(matchId, true);
    }

    
    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto endInnings(Long matchId, Long newStrikerId, Long newNonStrikerId, Long newBowlerId, Integer targetScore) {
        Match match = matchRepository.findById(matchId).orElseThrow();
        if (match.getStatus() == Match.MatchStatus.COMPLETED) throw new IllegalStateException("Cannot alter a completed match");
        logger.info("[AUDIT] Match {} - Innings {} Ended. Setting up next innings", matchId, match.getCurrentInnings());
        if (match.getCurrentInnings() == 1) {
            match.setFirstInningsScore(match.getCurrentScore());
            match.setFirstInningsWickets(match.getCurrentWickets());
            match.setFirstInningsBalls(match.getCurrentBalls());
            
            match.setCurrentInnings(2);
            match.setTargetScore(targetScore);
            match.setCurrentScore(0);
            match.setCurrentWickets(0);
            match.setCurrentBalls(0);
            
            Team temp = match.getBattingTeam();
            match.setBattingTeam(match.getBowlingTeam());
            match.setBowlingTeam(temp);
            
            match.setCurrentStriker(playerRepository.findById(newStrikerId).orElse(null));
            match.setCurrentNonStriker(playerRepository.findById(newNonStrikerId).orElse(null));
            match.setCurrentBowler(playerRepository.findById(newBowlerId).orElse(null));
            match = matchRepository.save(match);
            
            if (match.getCurrentStriker() != null) scorecardBattingRepository.save(createBattingCard(match, match.getCurrentStriker()));
            if (match.getCurrentNonStriker() != null) scorecardBattingRepository.save(createBattingCard(match, match.getCurrentNonStriker()));
            if (match.getCurrentBowler() != null) scorecardBowlingRepository.save(createBowlingCard(match, match.getCurrentBowler()));
            
            liveDetailsCache.invalidate(matchId);
            return getLiveDetails(matchId, true);
        } else if (match.getCurrentInnings() == 2 && match.getCurrentStriker() == null) {
            match.setCurrentStriker(playerRepository.findById(newStrikerId).orElse(null));
            match.setCurrentNonStriker(playerRepository.findById(newNonStrikerId).orElse(null));
            match.setCurrentBowler(playerRepository.findById(newBowlerId).orElse(null));
            match = matchRepository.save(match);
            
            if (match.getCurrentStriker() != null) scorecardBattingRepository.save(createBattingCard(match, match.getCurrentStriker()));
            if (match.getCurrentNonStriker() != null) scorecardBattingRepository.save(createBattingCard(match, match.getCurrentNonStriker()));
            if (match.getCurrentBowler() != null) scorecardBowlingRepository.save(createBowlingCard(match, match.getCurrentBowler()));
            
            liveDetailsCache.invalidate(matchId);
            return getLiveDetails(matchId, true);
        }
        return getLiveDetails(matchId, true);
    }

    private final com.github.benmanes.caffeine.cache.Cache<Long, LiveMatchDetailsDto> liveDetailsCache = 
        com.github.benmanes.caffeine.cache.Caffeine.newBuilder()
            .expireAfterWrite(1, java.util.concurrent.TimeUnit.SECONDS)
            .maximumSize(100)
            .build();

    public LiveMatchDetailsDto getLiveDetails(Long matchId, boolean force) {
        if (force) {
            return fetchLiveDetails(matchId);
        }
        return liveDetailsCache.get(matchId, k -> fetchLiveDetails(k));
    }

    @Transactional(readOnly = true)
    protected LiveMatchDetailsDto fetchLiveDetails(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow();
        
        // Force initialize lazy collections to prevent LazyInitializationException during JSON serialization
        if (match.getPlayingXiTeamA() != null) match.getPlayingXiTeamA().size();
        if (match.getPlayingXiTeamB() != null) match.getPlayingXiTeamB().size();
        
        LiveMatchDetailsDto dto = new LiveMatchDetailsDto();
        dto.setMatch(match);
        dto.setTargetScore(match.getTargetScore());
        dto.setCurrentStriker(match.getCurrentStriker());
        dto.setCurrentNonStriker(match.getCurrentNonStriker());
        dto.setCurrentBowler(match.getCurrentBowler());

        int runs = match.getCurrentScore() != null ? match.getCurrentScore() : 0;
        int wickets = match.getCurrentWickets() != null ? match.getCurrentWickets() : 0;
        int legalBalls = match.getCurrentBalls() != null ? match.getCurrentBalls() : 0;
        
        dto.setCurrentScore(runs);
        dto.setCurrentWickets(wickets);
        dto.setCurrentOvers((legalBalls / 6) + ((legalBalls % 6) / 10.0));
        
        if (legalBalls > 0) {
            dto.setCurrentRunRate((runs * 6.0) / legalBalls);
        } else {
            dto.setCurrentRunRate(0.0);
        }

        if (match.getCurrentInnings() != null && match.getCurrentInnings() == 2 && match.getTargetScore() != null) {
            int runsNeeded = Math.max(0, match.getTargetScore() - runs);
            int totalOvers = match.getOvers() != null ? match.getOvers() : 20; // Safe unboxing guard
            int ballsRemaining = (totalOvers * 6) - legalBalls;
            if (ballsRemaining > 0) {
                dto.setRequiredRunRate((runsNeeded * 6.0) / ballsRemaining);
            }
        }

        if (match.getCurrentStriker() != null) {
            scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), match.getCurrentStriker().getId()).ifPresent(s -> {
                dto.setStrikerRuns(s.getRuns());
                dto.setStrikerBalls(s.getBalls());
            });
        }
        if (match.getCurrentNonStriker() != null) {
            scorecardBattingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), match.getCurrentNonStriker().getId()).ifPresent(s -> {
                dto.setNonStrikerRuns(s.getRuns());
                dto.setNonStrikerBalls(s.getBalls());
            });
        }
        if (match.getCurrentBowler() != null) {
            scorecardBowlingRepository.findFirstByMatchIdAndInningsAndPlayerId(matchId, match.getCurrentInnings(), match.getCurrentBowler().getId()).ifPresent(s -> {
                dto.setBowlerRuns(s.getRuns());
                dto.setBowlerWickets(s.getWickets());
                dto.setBowlerOvers(s.getOvers());
                dto.setBowlerEconomy(s.getEconomyRate());
            });
        }
        
        dto.setStreamUrl(match.getStreamUrl());
        dto.setStreamDelaySeconds(match.getStreamDelaySeconds() != null ? match.getStreamDelaySeconds() : 0);

        if (match.getTeamA() != null && match.getTeamA().getPlayers() != null) {
            org.hibernate.Hibernate.initialize(match.getTeamA().getPlayers());
            dto.setTeamAPlayers(new ArrayList<>(match.getTeamA().getPlayers()));
        }
        if (match.getTeamB() != null && match.getTeamB().getPlayers() != null) {
            org.hibernate.Hibernate.initialize(match.getTeamB().getPlayers());
            dto.setTeamBPlayers(new ArrayList<>(match.getTeamB().getPlayers()));
        }
        
        // Rule 16 Fallbacks: if they haven't been fetched yet but they exist in match, default to zero
        if (match.getCurrentStriker() != null && dto.getStrikerRuns() == null) {
            dto.setStrikerRuns(0); dto.setStrikerBalls(0);
        }
        if (match.getCurrentNonStriker() != null && dto.getNonStrikerRuns() == null) {
            dto.setNonStrikerRuns(0); dto.setNonStrikerBalls(0);
        }
        if (match.getCurrentBowler() != null && dto.getBowlerRuns() == null) {
            dto.setBowlerRuns(0); dto.setBowlerWickets(0); dto.setBowlerOvers(0.0); dto.setBowlerEconomy(0.0);
        }
        
        // Current Partnership Calculation
        List<BallEvent> allInningsBalls = ballEventRepository.findByMatchIdAndInningsOrderByOverNumberAscBallNumberAscIdAsc(matchId, match.getCurrentInnings());
        int pRuns = 0;
        int pBalls = 0;
        Map<Long, Map<String, Integer>> pStats = new HashMap<>();
        
        for (BallEvent b : allInningsBalls) {
            int r = b.getRuns() != null ? b.getRuns() : 0;
            int extras = b.getExtraRuns() != null ? b.getExtraRuns() : 0;
            boolean isWide = "WIDE".equals(b.getExtraType());
            
            pRuns += (r + extras);
            if (!isWide) pBalls++;
            
            if (b.getStriker() != null) {
                pStats.putIfAbsent(b.getStriker().getId(), new HashMap<>(Map.of("runs", 0, "balls", 0)));
                Map<String, Integer> sStats = pStats.get(b.getStriker().getId());
                sStats.put("runs", sStats.get("runs") + r);
                if (!isWide) sStats.put("balls", sStats.get("balls") + 1);
            }
            if (b.getNonStriker() != null) {
                pStats.putIfAbsent(b.getNonStriker().getId(), new HashMap<>(Map.of("runs", 0, "balls", 0)));
            }
            
            if (Boolean.TRUE.equals(b.getIsWicket())) {
                pRuns = 0;
                pBalls = 0;
                pStats.clear();
            }
        }
        
        dto.setCurrentPartnershipRuns(pRuns);
        dto.setCurrentPartnershipBalls(pBalls);
        if (match.getCurrentStriker() != null && pStats.containsKey(match.getCurrentStriker().getId())) {
            dto.setCurrentPartnershipStrikerRuns(pStats.get(match.getCurrentStriker().getId()).get("runs"));
            dto.setCurrentPartnershipStrikerBalls(pStats.get(match.getCurrentStriker().getId()).get("balls"));
        } else {
            dto.setCurrentPartnershipStrikerRuns(0);
            dto.setCurrentPartnershipStrikerBalls(0);
        }
        if (match.getCurrentNonStriker() != null && pStats.containsKey(match.getCurrentNonStriker().getId())) {
            dto.setCurrentPartnershipNonStrikerRuns(pStats.get(match.getCurrentNonStriker().getId()).get("runs"));
            dto.setCurrentPartnershipNonStrikerBalls(pStats.get(match.getCurrentNonStriker().getId()).get("balls"));
        } else {
            dto.setCurrentPartnershipNonStrikerRuns(0);
            dto.setCurrentPartnershipNonStrikerBalls(0);
        }

        // Rule 16: Last six balls display
        List<BallEvent> eventsDb = ballEventRepository.findTop20ByMatchIdAndInningsOrderByOverNumberDescBallNumberDescIdDesc(matchId, match.getCurrentInnings());
        List<BallEvent> events = new ArrayList<>(eventsDb);
        Collections.reverse(events);
        
        if (!events.isEmpty() && events.get(events.size() - 1).getBowler() != null) { // Safe previous bowler guard
            dto.setPreviousBowlerId(events.get(events.size() - 1).getBowler().getId());
        }

        List<String> recentBalls = new ArrayList<>();
        List<String> thisOverBalls = new ArrayList<>();
        
        int activeOverNumber = legalBalls / 6;

        for (int i = 0; i < events.size(); i++) {
            BallEvent e = events.get(i);
            StringBuilder sb = new StringBuilder();
            
            // 1. Handle Extra Prefix
            if ("WIDE".equals(e.getExtraType())) sb.append("WD");
            else if ("NO_BALL".equals(e.getExtraType())) sb.append("NB");
            else if ("BYE".equals(e.getExtraType())) sb.append("B");
            else if ("LEG_BYE".equals(e.getExtraType())) sb.append("LB");

            // 2. Handle Wicket
            if (Boolean.TRUE.equals(e.getIsWicket())) {
                if (sb.length() > 0) sb.append("+");
                sb.append("W");
            }
            
            // 3. Handle Runs (Always show if runs > 0 OR if it's a legal dot ball)
            if (e.getRuns() != null && (e.getRuns() > 0 || sb.length() == 0)) {
                if (sb.length() > 0) sb.append("+");
                sb.append(e.getRuns());
            }
            
            String evStr = sb.toString();
            
            if (e.getOverNumber() != null && e.getOverNumber() == activeOverNumber) {
                thisOverBalls.add(evStr);
            } else {
                recentBalls.add(evStr);
            }
        }
        
        if (recentBalls.size() > 10) {
            recentBalls = recentBalls.subList(recentBalls.size() - 10, recentBalls.size());
        }
        
        dto.setRecentBalls(recentBalls);
        dto.setThisOverBalls(thisOverBalls);

        return dto;
    }

    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public Match updateStreamConfig(Long matchId, StreamConfigDto configDto) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        match.setStreamUrl(configDto.getStreamUrl());
        match.setStreamDelaySeconds(configDto.getStreamDelaySeconds());
        liveDetailsCache.invalidate(matchId);
        return matchRepository.save(match);
    }

    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public LiveMatchDetailsDto completeMatch(Long matchId, Long winnerTeamId, Long manOfTheMatchId) {
        Match match = matchRepository.findById(matchId).orElseThrow();
        if (match.getStatus() == Match.MatchStatus.COMPLETED) throw new IllegalStateException("Match is already completed");
        
        match.setStatus(Match.MatchStatus.COMPLETED);
        match.setMatchEndTime(java.time.LocalDateTime.now());

        if (winnerTeamId != null) {
            match.setWinnerTeam(teamRepository.findById(winnerTeamId).orElse(null));
            if (match.getWinnerTeam().getId().equals(match.getBattingTeam().getId())) {
                int wicketsRemaining = 10 - match.getCurrentWickets();
                match.setResult(match.getWinnerTeam().getTeamName() + " won by " + wicketsRemaining + " wickets");
            } else {
                if (match.getTargetScore() != null) {
                    int runDifference = match.getTargetScore() - 1 - match.getCurrentScore();
                    match.setResult(match.getWinnerTeam().getTeamName() + " won by " + runDifference + " runs");
                } else {
                    match.setResult(match.getWinnerTeam().getTeamName() + " won");
                }
            }
        } else {
            match.setResult("Match Tied");
        }
        
        if (manOfTheMatchId != null) {
            match.setManOfTheMatch(playerRepository.findById(manOfTheMatchId).orElse(null));
        }
        
        logger.info("[AUDIT] Match {} Officially Completed! Result: {}", matchId, match.getResult());
        
        this.updatePlayerMatchStatsFromScorecards(match);
        
        liveDetailsCache.invalidate(matchId);
        return getLiveDetails(matchId, true);
    }

    private void updatePlayerMatchStatsFromScorecards(Match match) {
        Long matchId = match.getId();
        List<ScorecardBatting> battingCards = scorecardBattingRepository.findByMatchId(matchId);
        List<ScorecardBowling> bowlingCards = scorecardBowlingRepository.findByMatchId(matchId);
        
        // Clear existing stats for this match first to avoid duplicates or orphaned data
        playerMatchStatsRepository.deleteByMatchId(matchId);
        
        Map<Long, PlayerMatchStats> statsMap = new HashMap<>();

        battingCards.forEach(b -> {
            Player p = b.getPlayer();
            PlayerMatchStats stats = statsMap.computeIfAbsent(p.getId(), k -> new PlayerMatchStats(p, match, match.getMatchType()));
            stats.setRunsScored(stats.getRunsScored() + (b.getRuns() == null ? 0 : b.getRuns()));
            stats.setBallsFaced(stats.getBallsFaced() + (b.getBalls() == null ? 0 : b.getBalls()));
            stats.setFours(stats.getFours() + (b.getFours() == null ? 0 : b.getFours()));
            stats.setSixes(stats.getSixes() + (b.getSixes() == null ? 0 : b.getSixes()));
            if (!"Not Out".equals(b.getHowOut()) && !"Yet to bat".equals(b.getHowOut()) && b.getHowOut() != null && !b.getHowOut().isEmpty()) {
                stats.setOut(true);
            }
        });

        bowlingCards.forEach(b -> {
            Player p = b.getPlayer();
            PlayerMatchStats stats = statsMap.computeIfAbsent(p.getId(), k -> new PlayerMatchStats(p, match, match.getMatchType()));
            
            Double overs = b.getOvers() == null ? 0.0 : b.getOvers();
            double existingOvers = stats.getOversBowled();
            
            int existingBalls = (int) Math.floor(existingOvers) * 6 + (int) Math.round((existingOvers - Math.floor(existingOvers)) * 10);
            int newBalls = (int) Math.floor(overs) * 6 + (int) Math.round((overs - Math.floor(overs)) * 10);
            int totalBalls = existingBalls + newBalls;
            
            stats.setOversBowled((totalBalls / 6) + ((totalBalls % 6) / 10.0));
            stats.setRunsConceded(stats.getRunsConceded() + (b.getRuns() == null ? 0 : b.getRuns()));
            stats.setWickets(stats.getWickets() + (b.getWickets() == null ? 0 : b.getWickets()));
            stats.setMaidens(stats.getMaidens() + (b.getMaidens() == null ? 0 : b.getMaidens()));
        });
        
        List<BallEvent> events = ballEventRepository.findByMatchIdAndIsWicketTrue(matchId);
        events.forEach(e -> {
            if (e.getFielder() != null) {
                Player p = e.getFielder();
                PlayerMatchStats stats = statsMap.computeIfAbsent(p.getId(), k -> new PlayerMatchStats(p, match, match.getMatchType()));
                if ("CAUGHT".equals(e.getWicketType())) {
                    stats.setCatches(stats.getCatches() + 1);
                } else if ("RUN_OUT".equals(e.getWicketType())) {
                    stats.setRunOuts(stats.getRunOuts() + 1);
                } else if ("STUMPED".equals(e.getWicketType())) {
                    stats.setStumpings(stats.getStumpings() + 1);
                }
            }
        });
        
        playerMatchStatsRepository.saveAll(statsMap.values());
    }
    
    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public Match updateManOfTheMatch(Long matchId, Long playerId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        match.setManOfTheMatch(playerRepository.findById(playerId).orElseThrow(() -> new RuntimeException("Player not found")));
        return matchRepository.save(match);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getCompleteScorecard(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow();
        Map<String, Object> response = new HashMap<>();
        response.put("match", match);
        response.put("batting", scorecardBattingRepository.findByMatchId(matchId));
        response.put("bowling", scorecardBowlingRepository.findByMatchId(matchId));
        
        if (match.getTeamA() != null && match.getTeamA().getPlayers() != null) {
            org.hibernate.Hibernate.initialize(match.getTeamA().getPlayers());
            response.put("teamAPlayers", new ArrayList<>(match.getTeamA().getPlayers()));
        }
        if (match.getTeamB() != null && match.getTeamB().getPlayers() != null) {
            org.hibernate.Hibernate.initialize(match.getTeamB().getPlayers());
            response.put("teamBPlayers", new ArrayList<>(match.getTeamB().getPlayers()));
        }
        
        List<BallEvent> balls1 = ballEventRepository.findByMatchIdAndInningsOrderByOverNumberAscBallNumberAscIdAsc(matchId, 1);
        List<BallEvent> balls2 = ballEventRepository.findByMatchIdAndInningsOrderByOverNumberAscBallNumberAscIdAsc(matchId, 2);
        
        response.put("innings1Overs", buildOversList(balls1));
        response.put("innings2Overs", buildOversList(balls2));
        
        response.put("innings1Extras", calculateExtras(balls1));
        response.put("innings2Extras", calculateExtras(balls2));
        
        Map<String, Object> fp1 = calculateFowAndPartnerships(balls1);
        response.put("innings1Fow", fp1.get("fow"));
        response.put("innings1Partnerships", fp1.get("partnerships"));
        
        Map<String, Object> fp2 = calculateFowAndPartnerships(balls2);
        response.put("innings2Fow", fp2.get("fow"));
        response.put("innings2Partnerships", fp2.get("partnerships"));
        
        return response;
    }

    private Map<String, Object> calculateFowAndPartnerships(List<BallEvent> balls) {
        List<Map<String, Object>> fowList = new ArrayList<>();
        List<Map<String, Object>> partnerships = new ArrayList<>();
        
        int totalRuns = 0;
        int wickets = 0;
        
        int currentPartnershipRuns = 0;
        int currentPartnershipBalls = 0;
        
        Map<Long, Map<String, Object>> batterStats = new HashMap<>();
        Player currentStriker = null;
        Player currentNonStriker = null;
        
        for (BallEvent b : balls) {
            int runs = b.getRuns() != null ? b.getRuns() : 0;
            int extras = b.getExtraRuns() != null ? b.getExtraRuns() : 0;
            boolean isWide = "WIDE".equals(b.getExtraType());
            
            totalRuns += (runs + extras);
            currentPartnershipRuns += (runs + extras);
            if (!isWide) {
                currentPartnershipBalls++;
            }
            
            if (b.getStriker() != null) {
                currentStriker = b.getStriker();
                batterStats.putIfAbsent(currentStriker.getId(), new HashMap<>(Map.of("name", currentStriker.getName(), "runs", 0, "balls", 0)));
                Map<String, Object> strikerStats = batterStats.get(currentStriker.getId());
                strikerStats.put("runs", (int)strikerStats.get("runs") + runs);
                if (!isWide) {
                    strikerStats.put("balls", (int)strikerStats.get("balls") + 1);
                }
            }
            if (b.getNonStriker() != null) {
                currentNonStriker = b.getNonStriker();
                batterStats.putIfAbsent(currentNonStriker.getId(), new HashMap<>(Map.of("name", currentNonStriker.getName(), "runs", 0, "balls", 0)));
            }
            
            if (Boolean.TRUE.equals(b.getIsWicket())) {
                wickets++;
                Player playerOut = b.getPlayerOut();
                String playerOutName = playerOut != null ? playerOut.getName() : "Unknown";
                
                Map<String, Object> fow = new HashMap<>();
                fow.put("runs", totalRuns);
                fow.put("wickets", wickets);
                fow.put("playerOutName", playerOutName);
                fow.put("overNumber", b.getOverNumber());
                fow.put("ballNumber", b.getBallNumber());
                fowList.add(fow);
                
                Map<String, Object> p = new HashMap<>();
                p.put("wicket", wickets);
                p.put("runs", currentPartnershipRuns);
                p.put("balls", currentPartnershipBalls);
                p.put("unbeaten", false);
                if (currentStriker != null && batterStats.containsKey(currentStriker.getId())) {
                    p.put("batter1", new HashMap<>(batterStats.get(currentStriker.getId())));
                }
                if (currentNonStriker != null && batterStats.containsKey(currentNonStriker.getId())) {
                    p.put("batter2", new HashMap<>(batterStats.get(currentNonStriker.getId())));
                }
                partnerships.add(p);
                
                currentPartnershipRuns = 0;
                currentPartnershipBalls = 0;
                batterStats.clear();
            }
        }
        
        if (currentPartnershipBalls > 0 || currentPartnershipRuns > 0) {
            Map<String, Object> p = new HashMap<>();
            p.put("wicket", wickets + 1);
            p.put("unbeaten", true);
            p.put("runs", currentPartnershipRuns);
            p.put("balls", currentPartnershipBalls);
            if (currentStriker != null && batterStats.containsKey(currentStriker.getId())) {
                p.put("batter1", new HashMap<>(batterStats.get(currentStriker.getId())));
            }
            if (currentNonStriker != null && batterStats.containsKey(currentNonStriker.getId())) {
                p.put("batter2", new HashMap<>(batterStats.get(currentNonStriker.getId())));
            }
            partnerships.add(p);
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("fow", fowList);
        result.put("partnerships", partnerships);
        return result;
    }

    private Map<String, Integer> calculateExtras(List<BallEvent> balls) {
        Map<String, Integer> extras = new HashMap<>();
        extras.put("WIDE", 0);
        extras.put("NO_BALL", 0);
        extras.put("BYE", 0);
        extras.put("LEG_BYE", 0);
        extras.put("total", 0);
        for (BallEvent b : balls) {
            if (b.getExtraType() != null && !b.getExtraType().isEmpty()) {
                int extRuns = b.getExtraRuns() != null ? b.getExtraRuns() : 0;
                if ("WIDE".equals(b.getExtraType()) || "BYE".equals(b.getExtraType()) || "LEG_BYE".equals(b.getExtraType())) {
                    extRuns += (b.getRuns() != null ? b.getRuns() : 0);
                }
                extras.put(b.getExtraType(), extras.getOrDefault(b.getExtraType(), 0) + extRuns);
                extras.put("total", extras.get("total") + extRuns);
            }
        }
        return extras;
    }

    private List<Map<String, Object>> buildOversList(List<BallEvent> events) {
        Map<Integer, List<BallEvent>> oversMap = new TreeMap<>();
        for (BallEvent e : events) {
            oversMap.computeIfAbsent(e.getOverNumber(), k -> new ArrayList<>()).add(e);
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map.Entry<Integer, List<BallEvent>> entry : oversMap.entrySet()) {
            Map<String, Object> overDetails = new HashMap<>();
            int overNum = entry.getKey() + 1;
            overDetails.put("overNumber", overNum);
            
            if (!entry.getValue().isEmpty() && entry.getValue().get(0).getBowler() != null) {
                overDetails.put("bowlerName", entry.getValue().get(0).getBowler().getName());
            } else {
                overDetails.put("bowlerName", "Unknown");
            }
            
            List<String> balls = new ArrayList<>();
            int runs = 0;
            int wickets = 0;
            
            for (BallEvent e : entry.getValue()) {
                StringBuilder sb = new StringBuilder();
                if ("WIDE".equals(e.getExtraType())) sb.append("WD");
                else if ("NO_BALL".equals(e.getExtraType())) sb.append("NB");
                else if ("BYE".equals(e.getExtraType())) sb.append("B");
                else if ("LEG_BYE".equals(e.getExtraType())) sb.append("LB");

                if (Boolean.TRUE.equals(e.getIsWicket())) {
                    if (sb.length() > 0) sb.append("+");
                    sb.append("W");
                    wickets++;
                }
                
                if (e.getRuns() != null && (e.getRuns() > 0 || sb.length() == 0)) {
                    if (sb.length() > 0) sb.append("+");
                    sb.append(e.getRuns());
                }
                
                String evStr = sb.toString();
                balls.add(evStr);
                
                int r = e.getRuns() != null ? e.getRuns() : 0;
                int ext = e.getExtraRuns() != null ? e.getExtraRuns() : 0;
                runs += (r + ext);
            }
            
            overDetails.put("balls", balls);
            overDetails.put("runs", runs);
            overDetails.put("wickets", wickets);
            result.add(overDetails);
        }
        return result;
    }
    @Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public void repairScorecard(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        
        // 1. Clear existing scorecard entries for this match
        scorecardBattingRepository.deleteByMatchId(matchId);
        scorecardBowlingRepository.deleteByMatchId(matchId);
        
        // 2. Fetch all ball events in chronological order
        List<BallEvent> allEvents = ballEventRepository.findByMatchIdOrderByOverNumberAscBallNumberAscIdAsc(matchId);
        if (allEvents.isEmpty()) return;

        // 3. Temporarily reset match live state for re-processing simulation
        // Note: We don't save the match at the end to avoid overwriting final results if we don't want to,
        // but processBallMath will update the match object in memory and save it.
        // So we record the final status and restore it if necessary.
        Match.MatchStatus finalStatus = match.getStatus();
        
        match.setCurrentScore(0);
        match.setCurrentWickets(0);
        match.setCurrentBalls(0);
        match.setCurrentInnings(1);
        
        // Reset to initial batting/bowling team based on toss
        if (match.getTossWinner() != null) {
            if ("BATTING".equals(match.getTossDecision())) {
                match.setBattingTeam(match.getTossWinner());
                match.setBowlingTeam(match.getTossWinner().getId().equals(match.getTeamA().getId()) ? match.getTeamB() : match.getTeamA());
            } else {
                match.setBowlingTeam(match.getTossWinner());
                match.setBattingTeam(match.getTossWinner().getId().equals(match.getTeamA().getId()) ? match.getTeamB() : match.getTeamA());
            }
        }

        // Initialize strikers from the first ball
        BallEvent firstBall = allEvents.get(0);
        match.setCurrentStriker(firstBall.getStriker());
        match.setCurrentNonStriker(firstBall.getNonStriker());
        match.setCurrentBowler(firstBall.getBowler());
        matchRepository.save(match);

        // 4. Re-process each ball
        for (int i = 0; i < allEvents.size(); i++) {
            BallEvent ev = allEvents.get(i);
            
            // Handle innings transition
            if (ev.getInnings() > match.getCurrentInnings()) {
                match.setCurrentInnings(ev.getInnings());
                match.setCurrentScore(0);
                match.setCurrentWickets(0);
                match.setCurrentBalls(0);
                
                // Swap teams
                Team temp = match.getBattingTeam();
                match.setBattingTeam(match.getBowlingTeam());
                match.setBowlingTeam(temp);
                
                // Reset strikers for new innings from the first ball of that innings
                match.setCurrentStriker(ev.getStriker());
                match.setCurrentNonStriker(ev.getNonStriker());
                match.setCurrentBowler(ev.getBowler());
                matchRepository.save(match);
            }

            // Sync match state with event's participants to handle mid-over changes or manual adjustments
            match.setCurrentStriker(ev.getStriker());
            match.setCurrentNonStriker(ev.getNonStriker());
            match.setCurrentBowler(ev.getBowler());

            BallSubmissionDto dto = new BallSubmissionDto();
            dto.setRuns(ev.getRuns());
            dto.setExtraType(ev.getExtraType());
            dto.setExtraRuns(ev.getExtraRuns());
            dto.setIsWicket(ev.getIsWicket());
            
            if (Boolean.TRUE.equals(ev.getIsWicket())) {
                dto.setWicketType(ev.getWicketType());
                dto.setPlayerOutId(ev.getPlayerOut() != null ? ev.getPlayerOut().getId() : null);
                dto.setFielderId(ev.getFielder() != null ? ev.getFielder().getId() : null);
                
                // To handle strike rotation correctly, we need to know who the next batsman was
                BallEvent nextEv = (i + 1 < allEvents.size()) ? allEvents.get(i + 1) : null;
                if (nextEv != null && nextEv.getInnings().equals(ev.getInnings())) {
                    Player outPlayer = ev.getPlayerOut();
                    if (outPlayer != null) {
                        Player survivor = outPlayer.getId().equals(ev.getStriker().getId()) ? ev.getNonStriker() : ev.getStriker();
                        if (nextEv.getStriker().getId().equals(survivor.getId())) {
                            dto.setNextBatsmanId(nextEv.getNonStriker().getId());
                        } else {
                            dto.setNextBatsmanId(nextEv.getStriker().getId());
                        }
                    }
                }
            }
            
            this.processBallMath(matchId, match, dto, false);
        }

        // 5. Restore final match metadata
        match.setStatus(finalStatus);
        
        // 6. Recalculate Player Match Stats from the newly repaired scorecard
        this.updatePlayerMatchStatsFromScorecards(match);
        
        matchRepository.save(match);
        liveDetailsCache.invalidate(matchId);
    }
}
