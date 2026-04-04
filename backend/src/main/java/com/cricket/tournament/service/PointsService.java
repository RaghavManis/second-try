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
            stats.put("nrrRunsScored", 0);
            stats.put("nrrBallsFaced", 0);
            stats.put("nrrRunsConceded", 0);
            stats.put("nrrBallsBowled", 0);
            stats.put("netRunRate", 0.0);
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

            // NRR Calculation accumulation
            int runs1 = match.getFirstInningsScore() != null ? match.getFirstInningsScore() : 0;
            int wickets1 = match.getFirstInningsWickets() != null ? match.getFirstInningsWickets() : 0;
            int balls1 = match.getFirstInningsBalls() != null ? match.getFirstInningsBalls() : (wickets1 >= 10 ? match.getOvers() * 6 : 0);
            if (wickets1 >= 10 && match.getOvers() != null) {
                balls1 = match.getOvers() * 6; // All out -> full quota
            }

            int runs2 = match.getCurrentScore() != null ? match.getCurrentScore() : 0;
            int wickets2 = match.getCurrentWickets() != null ? match.getCurrentWickets() : 0;
            int balls2 = match.getCurrentBalls() != null ? match.getCurrentBalls() : (wickets2 >= 10 ? match.getOvers() * 6 : 0);
            if (wickets2 >= 10 && match.getOvers() != null) {
                balls2 = match.getOvers() * 6; // All out -> full quota
            }

            boolean aBattedSecond = match.getBattingTeam().getId().equals(teamAId);
            if (!aBattedSecond) {
                // Team A batted 1st, Team B batted 2nd
                addNRRStats(statsA, runs1, balls1, runs2, balls2);
                addNRRStats(statsB, runs2, balls2, runs1, balls1);
            } else {
                // Team B batted 1st, Team A batted 2nd
                addNRRStats(statsA, runs2, balls2, runs1, balls1);
                addNRRStats(statsB, runs1, balls1, runs2, balls2);
            }
        }

        List<Map<String, Object>> pointsTable = new ArrayList<>(pointsMap.values());
        
        // Finalize NRR
        for (Map<String, Object> stat : pointsTable) {
            double rs = (int) stat.get("nrrRunsScored");
            double of = ((int) stat.get("nrrBallsFaced")) / 6.0;
            double rc = (int) stat.get("nrrRunsConceded");
            double ob = ((int) stat.get("nrrBallsBowled")) / 6.0;
            
            double nrr = 0.0;
            if (of > 0 && ob > 0) {
                nrr = (rs / of) - (rc / ob);
            } else if (of > 0) {
                nrr = rs / of;
            } else if (ob > 0) {
                nrr = -(rc / ob);
            }
            stat.put("netRunRate", nrr);
        }

        // Sort by points descending, then by NRR descending
        pointsTable.sort((a, b) -> {
            int ptsCmp = Integer.compare((int) b.get("points"), (int) a.get("points"));
            if (ptsCmp == 0) {
                return Double.compare((double) b.get("netRunRate"), (double) a.get("netRunRate"));
            }
            return ptsCmp;
        });

        return pointsTable;
    }

    private void addNRRStats(Map<String, Object> stats, int runsScored, int ballsFaced, int runsConceded, int ballsBowled) {
        stats.put("nrrRunsScored", (int) stats.get("nrrRunsScored") + runsScored);
        stats.put("nrrBallsFaced", (int) stats.get("nrrBallsFaced") + ballsFaced);
        stats.put("nrrRunsConceded", (int) stats.get("nrrRunsConceded") + runsConceded);
        stats.put("nrrBallsBowled", (int) stats.get("nrrBallsBowled") + ballsBowled);
    }
}
