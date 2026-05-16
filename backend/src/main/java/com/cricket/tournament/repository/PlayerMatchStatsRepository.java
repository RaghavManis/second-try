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
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM PlayerMatchStats p WHERE p.match.id = :matchId")
    void deleteByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);

    @Query("SELECT new map(" +
           "pms.matchType as matchType, " +
           "COUNT(pms.id) as matchesPlayed, " +
           "SUM(CASE WHEN pms.runsScored > 0 OR pms.ballsFaced > 0 OR pms.isOut = true THEN 1 ELSE 0 END) as inningsPlayed, " +
           "SUM(pms.runsScored) as runsScored, " +
           "SUM(pms.ballsFaced) as ballsFaced, " +
           "MAX(pms.runsScored) as highestScore, " +
           "SUM(CASE WHEN pms.runsScored >= 50 AND pms.runsScored < 100 THEN 1 ELSE 0 END) as fifties, " +
           "SUM(CASE WHEN pms.runsScored >= 100 THEN 1 ELSE 0 END) as hundreds, " +
           "SUM(pms.fours) as fours, " +
           "SUM(pms.sixes) as sixes, " +
           "SUM(pms.oversBowled) as oversBowled, " +
           "SUM(pms.runsConceded) as runsConceded, " +
           "SUM(pms.wickets) as wickets, " +
           "SUM(pms.maidens) as maidens, " +
           "SUM(pms.catches) as catches, " +
           "SUM(pms.runOuts) as runOuts, " +
           "SUM(pms.stumpings) as stumpings " +
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
           "SUM(pms.fours) as fours, " +
           "SUM(pms.sixes) as sixes, " +
           "SUM(pms.oversBowled) as oversBowled, " +
           "SUM(pms.runsConceded) as runsConceded, " +
           "SUM(pms.wickets) as wickets, " +
           "SUM(pms.maidens) as maidens, " +
           "SUM(pms.catches) as catches, " +
           "SUM(pms.runOuts) as runOuts, " +
           "SUM(pms.stumpings) as stumpings " +
           ") FROM PlayerMatchStats pms WHERE pms.player.id = :playerId AND pms.matchType IN :matchTypes")
    Map<String, Object> getAggregatedStatsByPlayerAndMatchTypes(@Param("playerId") Long playerId, @Param("matchTypes") List<Match.MatchType> matchTypes);

    @Query("SELECT new map(" +
           "COUNT(pms.id) as matchesPlayed, " +
           "SUM(CASE WHEN pms.runsScored > 0 OR pms.ballsFaced > 0 OR pms.isOut = true THEN 1 ELSE 0 END) as inningsPlayed, " +
           "SUM(pms.runsScored) as runsScored, " +
           "SUM(pms.ballsFaced) as ballsFaced, " +
           "MAX(pms.runsScored) as highestScore, " +
           "SUM(CASE WHEN pms.runsScored >= 50 AND pms.runsScored < 100 THEN 1 ELSE 0 END) as fifties, " +
           "SUM(CASE WHEN pms.runsScored >= 100 THEN 1 ELSE 0 END) as hundreds, " +
           "SUM(pms.fours) as fours, " +
           "SUM(pms.sixes) as sixes, " +
           "SUM(pms.oversBowled) as oversBowled, " +
           "SUM(pms.runsConceded) as runsConceded, " +
           "SUM(pms.wickets) as wickets, " +
           "SUM(pms.maidens) as maidens, " +
           "SUM(pms.catches) as catches, " +
           "SUM(pms.runOuts) as runOuts, " +
           "SUM(pms.stumpings) as stumpings " +
           ") FROM PlayerMatchStats pms WHERE pms.player.id = :playerId")
    Map<String, Object> getOverallAggregatedStatsByPlayer(@Param("playerId") Long playerId);

    @Query("SELECT new map(pms.player as player, SUM(pms.runsScored) as totalRuns) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType IN :matchTypes " +
           "GROUP BY pms.player " +
           "ORDER BY SUM(pms.runsScored) DESC")
    List<Map<String, Object>> getTopRunScorersByMatchTypes(@Param("matchTypes") List<Match.MatchType> matchTypes);

    @Query("SELECT new map(pms.player as player, SUM(pms.wickets) as totalWickets) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType IN :matchTypes " +
           "GROUP BY pms.player " +
           "ORDER BY SUM(pms.wickets) DESC")
    List<Map<String, Object>> getTopWicketTakersByMatchTypes(@Param("matchTypes") List<Match.MatchType> matchTypes);

    @Query("SELECT new map(pms.player as player, SUM(pms.sixes) as totalSixes) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType IN :matchTypes " +
           "GROUP BY pms.player " +
           "ORDER BY SUM(pms.sixes) DESC")
    List<Map<String, Object>> getTopSixHittersByMatchTypes(@Param("matchTypes") List<Match.MatchType> matchTypes);

    @Query("SELECT new map(pms.player as player, SUM(pms.fours) as totalFours) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType IN :matchTypes " +
           "GROUP BY pms.player " +
           "ORDER BY SUM(pms.fours) DESC")
    List<Map<String, Object>> getTopFourHittersByMatchTypes(@Param("matchTypes") List<Match.MatchType> matchTypes);

    @Query("SELECT new map(pms.player as player, SUM(pms.catches) as totalCatches) " +
           "FROM PlayerMatchStats pms " +
           "WHERE pms.matchType IN :matchTypes " +
           "GROUP BY pms.player " +
           "HAVING SUM(pms.catches) > 0 " +
           "ORDER BY SUM(pms.catches) DESC")
    List<Map<String, Object>> getTopCatchTakersByMatchTypes(@Param("matchTypes") List<Match.MatchType> matchTypes);
}
