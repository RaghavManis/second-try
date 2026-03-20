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

    public void deleteTeam(Long id) {
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
