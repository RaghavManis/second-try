package com.cricket.tournament.repository;

import com.cricket.tournament.model.ScorecardBatting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScorecardBattingRepository extends JpaRepository<ScorecardBatting, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT s FROM ScorecardBatting s WHERE s.match.id = :matchId ORDER BY s.id ASC")
    List<ScorecardBatting> findByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);
    
    Optional<ScorecardBatting> findFirstByMatchIdAndInningsAndPlayerId(Long matchId, Integer innings, Long playerId);
    
    @org.springframework.data.jpa.repository.Query("SELECT s FROM ScorecardBatting s WHERE s.match.id = :matchId AND s.innings = :innings ORDER BY s.id ASC")
    List<ScorecardBatting> findByMatchIdAndInnings(@org.springframework.data.repository.query.Param("matchId") Long matchId, @org.springframework.data.repository.query.Param("innings") Integer innings);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ScorecardBatting s WHERE s.match.id = :matchId")
    void deleteByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);
    
    @org.springframework.data.jpa.repository.Query("SELECT new map(s.player as player, SUM(s.runs) as totalRuns) " +
           "FROM ScorecardBatting s " +
           "WHERE s.match.matchType = :matchType " +
           "GROUP BY s.player " +
           "ORDER BY SUM(s.runs) DESC")
    List<java.util.Map<String, Object>> getTopRunScorersByMatchType(@org.springframework.data.repository.query.Param("matchType") com.cricket.tournament.model.Match.MatchType matchType);

    @org.springframework.data.jpa.repository.Query("SELECT new map(s.player as player, SUM(s.sixes) as totalSixes) " +
           "FROM ScorecardBatting s " +
           "WHERE s.match.matchType = :matchType " +
           "GROUP BY s.player " +
           "ORDER BY SUM(s.sixes) DESC")
    List<java.util.Map<String, Object>> getTopSixHittersByMatchType(@org.springframework.data.repository.query.Param("matchType") com.cricket.tournament.model.Match.MatchType matchType);

    @org.springframework.data.jpa.repository.Query("SELECT new map(s.player as player, SUM(s.fours) as totalFours) " +
           "FROM ScorecardBatting s " +
           "WHERE s.match.matchType = :matchType " +
           "GROUP BY s.player " +
           "ORDER BY SUM(s.fours) DESC")
    List<java.util.Map<String, Object>> getTopFourHittersByMatchType(@org.springframework.data.repository.query.Param("matchType") com.cricket.tournament.model.Match.MatchType matchType);
}
