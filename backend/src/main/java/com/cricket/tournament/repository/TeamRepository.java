package com.cricket.tournament.repository;

import com.cricket.tournament.model.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"players"})
    java.util.List<Team> findAll();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"players"})
    java.util.Optional<Team> findById(Long id);
}
