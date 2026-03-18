package com.cricket.tournament.repository;

import com.cricket.tournament.model.ScorecardBowling;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScorecardBowlingRepository extends JpaRepository<ScorecardBowling, Long> {
    List<ScorecardBowling> findByMatchId(Long matchId);
    Optional<ScorecardBowling> findByMatchIdAndInningsAndPlayerId(Long matchId, Integer innings, Long playerId);
    List<ScorecardBowling> findByMatchIdAndInnings(Long matchId, Integer innings);
}
