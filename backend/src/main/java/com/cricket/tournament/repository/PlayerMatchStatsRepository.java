package com.cricket.tournament.repository;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.model.PlayerMatchStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Map;

public interface PlayerMatchStatsRepository extends JpaRepository<PlayerMatchStats, Long> {

    List<PlayerMatchStats> findByPlayerId(Long playerId);

    List<PlayerMatchStats> findByMatchId(Long matchId);
    void deleteByMatchId(Long matchId);

    @Query("SELECT new map(" +
           "pms.matchType as matchType, " +
           "COUNT(pms.id) as matchesPlayed, " +
           "SUM(CASE WHEN pms.runsScored > 0 OR pms.ballsFaced > 0 OR pms.isOut = true THEN 1 ELSE 0 END) as inningsPlayed, " +
           "SUM(pms.runsScored) as runsScored, " +
           "SUM(pms.ballsFaced) as ballsFaced, " +
           "MAX(pms.runsScored) as highestScore, " +
           "SUM(CASE WHEN pms.runsScored >= 50 AND pms.runsScored < 100 THEN 1 ELSE 0 END) as fifties, " +
           "SUM(CASE WHEN pms.runsScored >= 100 THEN 1 ELSE 0 END) as hundreds, " +
           "SUM(pms.oversBowled) as oversBowled, " +
           "SUM(pms.runsConceded) as runsConceded, " +
           "SUM(pms.wickets) as wickets " +
           ") FROM PlayerMatchStats pms WHERE pms.player.id = :playerId GROUP BY pms.matchType")
    List<Map<String, Object>> getAggregatedStatsByPlayer(@Param("playerId") Long playerId);

    @Query("SELECT new map(" +
           "COUNT(pms.id) as matchesPlayed, " +
           "SUM(CASE WHEN pms.runsScored > 0 OR pms.ballsFaced > 0 OR pms.isOut = true THEN 1 ELSE 0 END) as inningsPlayed, " +
           "SUM(pms.runsScored) as runsScored, " +
           "SUM(pms.ballsFaced) as ballsFaced, " +
           "MAX(pms.runsScored) as highestScore, " +
           "SUM(CASE WHEN pms.runsScored >= 50 AND pms.runsScored < 100 THEN 1 ELSE 0 END) as fifties, " +
           "SUM(CASE WHEN pms.runsScored >= 100 THEN 1 ELSE 0 END) as hundreds, " +
           "SUM(pms.oversBowled) as oversBowled, " +
           "SUM(pms.runsConceded) as runsConceded, " +
           "SUM(pms.wickets) as wickets " +
           ") FROM PlayerMatchStats pms WHERE pms.player.id = :playerId")
    Map<String, Object> getOverallAggregatedStatsByPlayer(@Param("playerId") Long playerId);

    @Query("SELECT new map(pms.player as player, SUM(pms.runsScored) as totalRuns) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType = :matchType " +
           "GROUP BY pms.player " +
           "ORDER BY SUM(pms.runsScored) DESC LIMIT 5")
    List<Map<String, Object>> getTopRunScorersByMatchType(@Param("matchType") Match.MatchType matchType);

    @Query("SELECT new map(pms.player as player, SUM(pms.wickets) as totalWickets) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType = :matchType " +
           "GROUP BY pms.player " +
           "ORDER BY SUM(pms.wickets) DESC LIMIT 5")
    List<Map<String, Object>> getTopWicketTakersByMatchType(@Param("matchType") Match.MatchType matchType);
}
