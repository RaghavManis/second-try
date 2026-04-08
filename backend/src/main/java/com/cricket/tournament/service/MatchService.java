package com.cricket.tournament.service;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.repository.MatchRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

@Service
public class MatchService {

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
        return matchRepository.findAll();
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
        return matchRepository.findByStatus(Match.MatchStatus.SCHEDULED);
    }

    @Cacheable(value = "completedMatches")
    public List<Match> getCompletedMatches() {
        return matchRepository.findByStatus(Match.MatchStatus.COMPLETED);
    }

    public Match getMatchById(Long id) {
        return matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));
    }

    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public Match saveMatch(Match match) {
        return matchRepository.save(match);
    }

    @org.springframework.transaction.annotation.Transactional
    @CacheEvict(value = {"matches", "upcomingMatches", "completedMatches"}, allEntries = true)
    public void deleteMatch(Long id) {
        // Explicitly clear dependencies to avoid FK violation and orphan records
        ballEventRepository.deleteByMatchId(id);
        scorecardBattingRepository.deleteByMatchId(id);
        scorecardBowlingRepository.deleteByMatchId(id);
        scoreRepository.deleteByMatchId(id);
        playerMatchStatsRepository.deleteByMatchId(id);

        Match match = getMatchById(id);
        if (match.getPlayingXiTeamA() != null) match.getPlayingXiTeamA().clear();
        if (match.getPlayingXiTeamB() != null) match.getPlayingXiTeamB().clear();
        matchRepository.save(match);

        matchRepository.delete(match);
    }
}
