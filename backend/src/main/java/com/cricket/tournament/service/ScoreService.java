package com.cricket.tournament.service;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.model.Score;
import com.cricket.tournament.repository.ScoreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class ScoreService {

    @Autowired
    private ScoreRepository scoreRepository;

    @Autowired
    private MatchService matchService;

    @Transactional
    public Score createScore(Score score) {
        Match match = matchService.getMatchById(score.getMatch().getId());
        
        if (match.getStatus() == Match.MatchStatus.COMPLETED) {
            throw new IllegalStateException("Match is already completed");
        }

        if (score.getOversPlayed() > match.getOvers()) {
            throw new IllegalArgumentException("Overs played cannot exceed match overs");
        }

        // Determine winner
        if (score.getTeamARuns() > score.getTeamBRuns()) {
            match.setWinnerTeam(match.getTeamA());
        } else if (score.getTeamBRuns() > score.getTeamARuns()) {
            match.setWinnerTeam(match.getTeamB());
        } else {
            // It's a tie
            match.setWinnerTeam(null);
        }

        match.setStatus(Match.MatchStatus.COMPLETED);
        matchService.saveMatch(match);
        
        score.setMatch(match);
        return scoreRepository.save(score);
    }

    public Optional<Score> getScoreByMatchId(Long matchId) {
        return scoreRepository.findByMatchId(matchId);
    }
}
