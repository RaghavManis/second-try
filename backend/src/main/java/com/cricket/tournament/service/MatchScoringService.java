package com.cricket.tournament.service;

import com.cricket.tournament.dto.*;
import com.cricket.tournament.model.*;
import com.cricket.tournament.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class MatchScoringService {

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

    @Transactional
    public Match startLiveScoring(Long matchId, LiveMatchSetupDto setup) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        match.setStatus(Match.MatchStatus.ONGOING);
        match.setTossWinner(teamRepository.findById(setup.getTossWinnerId()).orElse(null));
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
        match.setCurrentStriker(playerRepository.findById(setup.getStrikerId()).orElseThrow());
        match.setCurrentNonStriker(playerRepository.findById(setup.getNonStrikerId()).orElseThrow());
        match.setCurrentBowler(playerRepository.findById(setup.getOpeningBowlerId()).orElseThrow());
        
        if (setup.getPlayingXiTeamAIds() != null) {
            match.setPlayingXiTeamA(new HashSet<>(playerRepository.findAllById(setup.getPlayingXiTeamAIds())));
        }
        if (setup.getPlayingXiTeamBIds() != null) {
            match.setPlayingXiTeamB(new HashSet<>(playerRepository.findAllById(setup.getPlayingXiTeamBIds())));
        }
        
        match = matchRepository.save(match);
        
        // Ensure scorecards are generated immediately for the openers so they appear on the frontend.
        ScorecardBatting strikerCard = createBattingCard(match, match.getCurrentStriker());
        scorecardBattingRepository.save(strikerCard);
        
        ScorecardBatting nonStrikerCard = createBattingCard(match, match.getCurrentNonStriker());
        scorecardBattingRepository.save(nonStrikerCard);
        
        ScorecardBowling bowlerCard = createBowlingCard(match, match.getCurrentBowler());
        scorecardBowlingRepository.save(bowlerCard);
        
        return match;
    }

    private ScorecardBatting createBattingCard(Match match, Player player) {
        ScorecardBatting s = new ScorecardBatting();
        s.setMatch(match);
        s.setInnings(match.getCurrentInnings());
        s.setPlayer(player);
        Team team = match.getCurrentInnings() == 1 ? match.getBattingTeam() : match.getBattingTeam(); 
        s.setTeam(team);
        s.setRuns(0); s.setBalls(0); s.setFours(0); s.setSixes(0); s.setStrikeRate(0.0);
        return s;
    }

    private ScorecardBowling createBowlingCard(Match match, Player player) {
        ScorecardBowling s = new ScorecardBowling();
        s.setMatch(match);
        s.setInnings(match.getCurrentInnings());
        s.setPlayer(player);
        Team team = match.getCurrentInnings() == 1 ? match.getBowlingTeam() : match.getBowlingTeam();
        s.setTeam(team);
        s.setRuns(0); s.setWickets(0); s.setOvers(0.0); s.setMaidens(0); s.setEconomyRate(0.0);
        return s;
    }

    @Transactional
    public Match recordBall(Long matchId, BallSubmissionDto ballDto) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() != Match.MatchStatus.ONGOING) throw new RuntimeException("Match is not ongoing");
        return processBallMath(matchId, match, ballDto, true);
    }

    private Match processBallMath(Long matchId, Match match, BallSubmissionDto ballDto, boolean saveEvent) {
        String exType = ballDto.getExtraType();
        int batRuns = ballDto.getRuns() != null ? ballDto.getRuns() : 0;
        int extRuns = ballDto.getExtraRuns() != null ? ballDto.getExtraRuns() : 0;
        boolean isWicket = Boolean.TRUE.equals(ballDto.getIsWicket());

        boolean isLegal = (exType == null || "BYE".equals(exType) || "LEG_BYE".equals(exType));

        // Rule 3: Team score must always increase by: runs + extraRuns
        // Under new logic: extraRuns is 1 for WIDES and NO_BALLS, 0 for others. batRuns is simply the "selectedRuns"
        int selectedRuns = batRuns;
        int penaltyRuns = 0;
        
        if ("WIDE".equals(exType) || "NO_BALL".equals(exType)) penaltyRuns = 1;
        
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
        // Strike rotation must depend ONLY on runs taken by running (selectedRuns)
        boolean rotate = (selectedRuns % 2 != 0);

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
            event.setExtraRuns(extRuns);
            event.setIsWicket(isWicket);
            
            if (isWicket) {
                event.setWicketType(ballDto.getWicketType());
                event.setPlayerOut(playerRepository.findById(ballDto.getPlayerOutId()).orElse(null));
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
                if (ballDto.getFielderId() != null) {
                    fielderName = playerRepository.findById(ballDto.getFielderId()).map(Player::getName).orElse("Sub");
                }
                outCard.setHowOut("c " + fielderName + " b " + match.getCurrentBowler().getName());
            } else if ("RUN_OUT".equals(ballDto.getWicketType())) {
                String fielderName = "Sub";
                if (ballDto.getFielderId() != null) {
                    fielderName = playerRepository.findById(ballDto.getFielderId()).map(Player::getName).orElse("Sub");
                }
                outCard.setHowOut("run out (" + fielderName + ")");
            } else if ("STUMPED".equals(ballDto.getWicketType())) {
                String fielderName = "Sub";
                if (ballDto.getFielderId() != null) {
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
    public Match updateBowler(Long matchId, Long newBowlerId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        match.setCurrentBowler(playerRepository.findById(newBowlerId).orElseThrow(() -> new RuntimeException("Player not found")));
        return matchRepository.save(match);
    }
    
    @Transactional
    public Match swapBatsmen(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        Player temp = match.getCurrentStriker();
        if (temp != null && match.getCurrentNonStriker() != null) {
            match.setCurrentStriker(match.getCurrentNonStriker());
            match.setCurrentNonStriker(temp);
        }
        return matchRepository.save(match);
    }
    
    @Transactional
    public Match undoLastBall(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow(() -> new RuntimeException("Match not found"));
        if (match.getStatus() != Match.MatchStatus.ONGOING) throw new RuntimeException("Match is not ongoing");

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

        return matchRepository.findById(matchId).orElseThrow();
    }

    
    @Transactional
    public Match endInnings(Long matchId, Long newStrikerId, Long newNonStrikerId, Long newBowlerId, Integer targetScore) {
        Match match = matchRepository.findById(matchId).orElseThrow();
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
            
            return match;
        } else if (match.getCurrentInnings() == 2 && match.getCurrentStriker() == null) {
            match.setCurrentStriker(playerRepository.findById(newStrikerId).orElse(null));
            match.setCurrentNonStriker(playerRepository.findById(newNonStrikerId).orElse(null));
            match.setCurrentBowler(playerRepository.findById(newBowlerId).orElse(null));
            match = matchRepository.save(match);
            
            if (match.getCurrentStriker() != null) scorecardBattingRepository.save(createBattingCard(match, match.getCurrentStriker()));
            if (match.getCurrentNonStriker() != null) scorecardBattingRepository.save(createBattingCard(match, match.getCurrentNonStriker()));
            if (match.getCurrentBowler() != null) scorecardBowlingRepository.save(createBowlingCard(match, match.getCurrentBowler()));
            
            return match;
        }
        return match;
    }

    @Transactional(readOnly = true)
    public LiveMatchDetailsDto getLiveDetails(Long matchId) {
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
            });
        }
        
        // Rule 16 Fallbacks: if they haven't been fetched yet but they exist in match, default to zero
        if (match.getCurrentStriker() != null && dto.getStrikerRuns() == null) {
            dto.setStrikerRuns(0); dto.setStrikerBalls(0);
        }
        if (match.getCurrentNonStriker() != null && dto.getNonStrikerRuns() == null) {
            dto.setNonStrikerRuns(0); dto.setNonStrikerBalls(0);
        }
        if (match.getCurrentBowler() != null && dto.getBowlerRuns() == null) {
            dto.setBowlerRuns(0); dto.setBowlerWickets(0); dto.setBowlerOvers(0.0);
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
            String evStr;
            if (Boolean.TRUE.equals(e.getIsWicket())) {
                evStr = "W";
            } else if ("WIDE".equals(e.getExtraType())) {
                evStr = "WD+" + e.getRuns();
            } else if ("NO_BALL".equals(e.getExtraType())) {
                evStr = "NB+" + e.getRuns();
            } else if ("BYE".equals(e.getExtraType())) {
                evStr = "B+" + e.getRuns();
            } else if ("LEG_BYE".equals(e.getExtraType())) {
                evStr = "LB+" + e.getRuns();
            } else {
                evStr = String.valueOf(e.getRuns());
            }
            
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
    public Match completeMatch(Long matchId, Long winnerTeamId, Long manOfTheMatchId) {
        Match match = matchRepository.findById(matchId).orElseThrow();
        match.setStatus(Match.MatchStatus.COMPLETED);
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
        
        // Apply to Global Player Lifetime Stats
        List<ScorecardBatting> battingCards = scorecardBattingRepository.findByMatchId(matchId);
        List<ScorecardBowling> bowlingCards = scorecardBowlingRepository.findByMatchId(matchId);
        
        Set<Long> playersCreditedMatch = new HashSet<>();

        battingCards.forEach(b -> {
            Player p = b.getPlayer();
            if (playersCreditedMatch.add(p.getId())) {
                p.setMatchesPlayed((p.getMatchesPlayed() == null ? 0 : p.getMatchesPlayed()) + 1);
            }
            // Update batting stats
            p.setInningsPlayed((p.getInningsPlayed() == null ? 0 : p.getInningsPlayed()) + 1);
            p.setRunsScored((p.getRunsScored() == null ? 0 : p.getRunsScored()) + b.getRuns());
            p.setBallsFaced((p.getBallsFaced() == null ? 0 : p.getBallsFaced()) + b.getBalls());
            
            p.setHighestScore(Math.max(p.getHighestScore() == null ? 0 : p.getHighestScore(), b.getRuns()));
            if (b.getRuns() >= 100) p.setHundreds((p.getHundreds() == null ? 0 : p.getHundreds()) + 1);
            else if (b.getRuns() >= 50) p.setFifties((p.getFifties() == null ? 0 : p.getFifties()) + 1);
            
            if (p.getBallsFaced() > 0) p.setStrikeRate((p.getRunsScored() * 100.0) / p.getBallsFaced());
            if (p.getInningsPlayed() > 0) p.setBattingAverage((double) p.getRunsScored() / p.getInningsPlayed());
            
            playerRepository.save(p);
        });

        bowlingCards.forEach(b -> {
            Player p = b.getPlayer();
            if (playersCreditedMatch.add(p.getId())) {
                p.setMatchesPlayed((p.getMatchesPlayed() == null ? 0 : p.getMatchesPlayed()) + 1);
            }
            // Update bowling stats
            int ballsBowled = (int) Math.floor(b.getOvers() == null ? 0 : b.getOvers()) * 6 + (int) Math.round(((b.getOvers() == null ? 0 : b.getOvers()) - Math.floor(b.getOvers() == null ? 0 : b.getOvers())) * 10);
            
            int currentBalls = (int) (Math.floor(p.getOversBowled() == null ? 0 : p.getOversBowled()) * 6) + (int) Math.round(((p.getOversBowled() == null ? 0 : p.getOversBowled()) - Math.floor(p.getOversBowled() == null ? 0 : p.getOversBowled())) * 10);
            int totalBalls = currentBalls + ballsBowled;
            p.setOversBowled((totalBalls / 6) + ((totalBalls % 6) / 10.0));
            
            p.setRunsConceded((p.getRunsConceded() == null ? 0 : p.getRunsConceded()) + b.getRuns());
            p.setWickets((p.getWickets() == null ? 0 : p.getWickets()) + b.getWickets());
            
            if (totalBalls > 0) {
                p.setEconomyRate((p.getRunsConceded() * 6.0) / totalBalls);
            }
            
            playerRepository.save(p);
        });

        return matchRepository.save(match);
    }
    
    @Transactional(readOnly = true)
    public Map<String, Object> getCompleteScorecard(Long matchId) {
        Match match = matchRepository.findById(matchId).orElseThrow();
        Map<String, Object> response = new HashMap<>();
        response.put("match", match);
        response.put("batting", scorecardBattingRepository.findByMatchId(matchId));
        response.put("bowling", scorecardBowlingRepository.findByMatchId(matchId));
        return response;
    }
}
