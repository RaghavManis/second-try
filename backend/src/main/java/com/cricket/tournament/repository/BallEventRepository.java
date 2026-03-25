package com.cricket.tournament.repository;

import com.cricket.tournament.model.BallEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BallEventRepository extends JpaRepository<BallEvent, Long> {
    List<BallEvent> findByMatchIdOrderByOverNumberAscBallNumberAsc(Long matchId);
    List<BallEvent> findByMatchIdAndInningsOrderByOverNumberAscBallNumberAscIdAsc(Long matchId, Integer innings);
    List<BallEvent> findTop20ByMatchIdAndInningsOrderByOverNumberDescBallNumberDescIdDesc(Long matchId, Integer innings);
}
