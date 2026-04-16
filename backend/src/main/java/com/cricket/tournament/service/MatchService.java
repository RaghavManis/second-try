package com.cricket.tournament.service;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class MatchService {

    private static final Logger logger = LoggerFactory.getLogger(MatchService.class);

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private com.cricket.tournament.repository.BallEventRepository ballEventRepository;

    @Autowired
    private com.cricket.tournament.repository.ScorecardBattingRepository scorecardBattingRepository;

    @Autowired
    private com.cricket.tournament.repository.ScorecardBowlingRepository scorecardBowlingRepository;

    @Autowired
    private com.cricket.tournament.repository.ScoreRepository scoreRepository;
    
    @Autowired
    private com.cricket.tournament.repository.PlayerMatchStatsRepository playerMatchStatsRepository;

    @Cacheable(value = "matches")
    public List<Match> getAllMatches() {
        return matchRepository.findAllByOrderByMatchDateTimeAsc();
    }

    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public Match createMatch(Match match) {
        if (match.getTeamA().getId().equals(match.getTeamB().getId())) {
            throw new IllegalArgumentException("Team A and Team B cannot be the same");
        }
        match.setStatus(Match.MatchStatus.SCHEDULED);
        return matchRepository.save(match);
    }

    @Cacheable(value = "upcomingMatches")
    public List<Match> getUpcomingMatches() {
        return matchRepository.findByStatusOrderByMatchDateTimeAsc(Match.MatchStatus.SCHEDULED);
    }

    @Cacheable(value = "completedMatches")
    public List<Match> getCompletedMatches() {
        return matchRepository.findByStatusOrderByMatchEndTimeDescMatchDateTimeDesc(Match.MatchStatus.COMPLETED);
    }

    public Match getMatchById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));
    }

    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public Match saveMatch(Match match) {
        return matchRepository.save(match);
    }

    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public Match updateMatch(Long id, Match updatedMatch) {
        Match existingMatch = getMatchById(id);
        
        if (existingMatch.getStatus() != Match.MatchStatus.SCHEDULED) {
            throw new IllegalStateException("Only scheduled matches can be updated");
        }

        if (updatedMatch.getTeamA().getId().equals(updatedMatch.getTeamB().getId())) {
            throw new IllegalArgumentException("Team A and Team B cannot be the same");
        }

        existingMatch.setTeamA(updatedMatch.getTeamA());
        existingMatch.setTeamB(updatedMatch.getTeamB());
        existingMatch.setMatchDateTime(updatedMatch.getMatchDateTime());
        existingMatch.setOvers(updatedMatch.getOvers());

        existingMatch.setMatchType(updatedMatch.getMatchType());
        
        return matchRepository.save(existingMatch);
    }

    @org.springframework.transaction.annotation.Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public void deleteMatch(Long id) {
        if (id == null) return;
        
        logger.info("[AUDIT] Initiating robust bulk deletion for match ID: {}", id);

        // 1. Delete dependent records from child tables using bulk JPQL/Native queries
        ballEventRepository.deleteByMatchId(id);
        scorecardBattingRepository.deleteByMatchId(id);
        scorecardBowlingRepository.deleteByMatchId(id);
        scoreRepository.deleteByMatchId(id);
        playerMatchStatsRepository.deleteByMatchId(id);

        // 2. Clear join tables (ManyToMany) using native queries
        matchRepository.deleteXiAByMatchId(id);
        matchRepository.deleteXiBByMatchId(id);

        // 3. Delete the match record itself using bulk JPQL
        matchRepository.deleteByMatchId(id);
        
        logger.info("[AUDIT] Robust bulk deletion completed for match ID: {}", id);
    }
}
