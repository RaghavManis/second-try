package com.cricket.tournament.service;

import com.cricket.tournament.model.Team;
import com.cricket.tournament.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public Team createTeam(Team team) {
        return teamRepository.save(team);
    }

    @Autowired
    private com.cricket.tournament.repository.MatchRepository matchRepository;

    @org.springframework.transaction.annotation.Transactional
    public void deleteTeam(Long id) {
        if (matchRepository.existsByTeamAIdOrTeamBId(id, id)) {
            throw new RuntimeException("This team is used in matches. Please delete those matches first.");
        }
        teamRepository.deleteById(id);
    }

    public Team getTeamById(Long id) {
        return teamRepository.findById(id).orElseThrow(() -> new RuntimeException("Team not found"));
    }

    public Team updateTeam(Long id, Team updatedTeam) {
        Team existingTeam = getTeamById(id);
        
        if (updatedTeam.getTeamName() != null) existingTeam.setTeamName(updatedTeam.getTeamName());
        if (updatedTeam.getCoachName() != null) existingTeam.setCoachName(updatedTeam.getCoachName());
        if (updatedTeam.getTeamLogo() != null) existingTeam.setTeamLogo(updatedTeam.getTeamLogo());
        
        return teamRepository.save(existingTeam);
    }
}
