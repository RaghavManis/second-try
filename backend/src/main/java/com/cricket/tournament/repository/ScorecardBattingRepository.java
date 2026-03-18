package com.cricket.tournament.repository;

import com.cricket.tournament.model.ScorecardBatting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ScorecardBattingRepository extends JpaRepository<ScorecardBatting, Long> {
    List<ScorecardBatting> findByMatchId(Long matchId);
    Optional<ScorecardBatting> findByMatchIdAndInningsAndPlayerId(Long matchId, Integer innings, Long playerId);
    List<ScorecardBatting> findByMatchIdAndInnings(Long matchId, Integer innings);
}
