package com.cricket.tournament.repository;

import com.cricket.tournament.model.Match;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
    @EntityGraph(attributePaths = {"playingXiTeamA", "playingXiTeamB"})
    List<Match> findAll();

    @EntityGraph(attributePaths = {"playingXiTeamA", "playingXiTeamB"})
    List<Match> findByStatus(Match.MatchStatus status);
    boolean existsByTeamAIdOrTeamBId(Long teamAId, Long teamBId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM Match m WHERE m.id = :matchId")
    void deleteByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM match_playing_xi_a WHERE match_id = :matchId", nativeQuery = true)
    void deleteXiAByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(value = "DELETE FROM match_playing_xi_b WHERE match_id = :matchId", nativeQuery = true)
    void deleteXiBByMatchId(@org.springframework.data.repository.query.Param("matchId") Long matchId);
}
