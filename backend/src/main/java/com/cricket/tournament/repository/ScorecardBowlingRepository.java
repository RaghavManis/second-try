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
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT p.name AS playerName, t.team_name AS teamName, CAST(SUM(s.wickets) AS SIGNED) AS totalWickets " +
           "FROM scorecard_bowling s " +
           "JOIN players p ON s.player_id = p.id " +
           "JOIN teams t ON s.team_id = t.id " +
           "GROUP BY s.player_id, p.name, t.team_name " +
           "ORDER BY totalWickets DESC " +
           "LIMIT 5", nativeQuery = true)
    List<java.util.Map<String, Object>> getTopWicketTakers();
}
