package com.cricket.tournament.repository;

import com.cricket.tournament.model.ScorecardBowling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScorecardBowlingRepository extends JpaRepository<ScorecardBowling, Long> {
    List<ScorecardBowling> findByMatchId(Long matchId);
    Optional<ScorecardBowling> findFirstByMatchIdAndInningsAndPlayerId(Long matchId, Integer innings, Long playerId);
    List<ScorecardBowling> findByMatchIdAndInnings(Long matchId, Integer innings);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ScorecardBowling s WHERE s.match.id = :matchId")
    void deleteByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);
    
    @org.springframework.data.jpa.repository.Query("SELECT new map(s.player as player, SUM(s.wickets) as totalWickets) " +
           "FROM ScorecardBowling s " +
           "WHERE s.match.matchType = :matchType " +
           "GROUP BY s.player " +
           "ORDER BY SUM(s.wickets) DESC")
    List<java.util.Map<String, Object>> getTopWicketTakersByMatchType(@org.springframework.data.repository.query.Param("matchType") com.cricket.tournament.model.Match.MatchType matchType);
}
