package com.cricket.tournament.service;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.model.Team;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class PointsService {

    @Autowired
    private TeamService teamService;

    @Autowired
    private MatchService matchService;

    @Autowired
    private com.cricket.tournament.repository.ScorecardBattingRepository battingRepository;

    @Autowired
    private com.cricket.tournament.repository.ScorecardBowlingRepository bowlingRepository;

    public Map<String, Object> getTopPerformers() {
        Map<String, Object> response = new HashMap<>();
        response.put("topRunScorers", battingRepository.getTopRunScorers());
        response.put("topWicketTakers", bowlingRepository.getTopWicketTakers());
        return response;
    }

    public List<Map<String, Object>> getPointsTable() {
        List<Team> allTeams = teamService.getAllTeams();
        List<Match> completedMatches = matchService.getCompletedMatches();

        Map<Long, Map<String, Object>> pointsMap = new HashMap<>();

        for (Team team : allTeams) {
            Map<String, Object> stats = new HashMap<>();
            stats.put("teamId", team.getId());
            stats.put("teamName", team.getTeamName());
            stats.put("matchesPlayed", 0);
            stats.put("wins", 0);
            stats.put("losses", 0);
            stats.put("ties", 0);
            stats.put("points", 0);
            pointsMap.put(team.getId(), stats);
        }

        for (Match match : completedMatches) {
            Long teamAId = match.getTeamA().getId();
            Long teamBId = match.getTeamB().getId();

            Map<String, Object> statsA = pointsMap.get(teamAId);
            Map<String, Object> statsB = pointsMap.get(teamBId);

            if (statsA == null || statsB == null) continue;

            statsA.put("matchesPlayed", (int) statsA.get("matchesPlayed") + 1);
            statsB.put("matchesPlayed", (int) statsB.get("matchesPlayed") + 1);

            if (match.getWinnerTeam() == null) {
                // Tie
                statsA.put("ties", (int) statsA.get("ties") + 1);
                statsA.put("points", (int) statsA.get("points") + 1);
                
                statsB.put("ties", (int) statsB.get("ties") + 1);
                statsB.put("points", (int) statsB.get("points") + 1);
            } else if (match.getWinnerTeam().getId().equals(teamAId)) {
                // Team A won
                statsA.put("wins", (int) statsA.get("wins") + 1);
                statsA.put("points", (int) statsA.get("points") + 2);
                
                statsB.put("losses", (int) statsB.get("losses") + 1);
            } else if (match.getWinnerTeam().getId().equals(teamBId)) {
                // Team B won
                statsB.put("wins", (int) statsB.get("wins") + 1);
                statsB.put("points", (int) statsB.get("points") + 2);
                
                statsA.put("losses", (int) statsA.get("losses") + 1);
            }
        }

        List<Map<String, Object>> pointsTable = new ArrayList<>(pointsMap.values());
        // Sort by points descending
        pointsTable.sort((a, b) -> Integer.compare((int) b.get("points"), (int) a.get("points")));

        return pointsTable;
    }
}
