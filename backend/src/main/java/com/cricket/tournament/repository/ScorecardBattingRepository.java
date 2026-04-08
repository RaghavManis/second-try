package com.cricket.tournament.repository;

import com.cricket.tournament.model.ScorecardBatting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScorecardBattingRepository extends JpaRepository<ScorecardBatting, Long> {
    List<ScorecardBatting> findByMatchId(Long matchId);
    Optional<ScorecardBatting> findFirstByMatchIdAndInningsAndPlayerId(Long matchId, Integer innings, Long playerId);
    List<ScorecardBatting> findByMatchIdAndInnings(Long matchId, Integer innings);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM ScorecardBatting s WHERE s.match.id = :matchId")
    void deleteByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT p.name AS playerName, t.team_name AS teamName, SUM(s.runs) AS totalRuns " +
           "FROM scorecard_batting s " +
           "JOIN players p ON s.player_id = p.id " +
           "JOIN teams t ON s.team_id = t.id " +
           "GROUP BY s.player_id, p.name, t.team_name " +
           "ORDER BY totalRuns DESC " +
           "LIMIT 5", nativeQuery = true)
    List<java.util.Map<String, Object>> getTopRunScorers();
}
