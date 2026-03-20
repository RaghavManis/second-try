package com.cricket.tournament.service;

import com.cricket.tournament.model.Player;
import com.cricket.tournament.model.Team;
import com.cricket.tournament.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlayerService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private TeamService teamService;

    public Player addPlayer(Player player) {
        if (player.getTeam() == null || player.getTeam().getId() == null) {
            throw new IllegalArgumentException("Player must belong to a team");
        }
        
        // Verify team exists
        Team team = teamService.getTeamById(player.getTeam().getId());
        player.setTeam(team);
        
        return playerRepository.save(player);
    }

    public List<Player> getPlayersByTeam(Long teamId) {
        // Verify team exists before fetching players
        teamService.getTeamById(teamId);
        return playerRepository.findByTeamId(teamId);
    }

    public void removePlayer(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new RuntimeException("Player not found");
        }
        playerRepository.deleteById(id);
    }

    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public Player getPlayerById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id " + id));
    }

    public Player updatePlayerBasicInfo(Long id, Player updatedPlayer) {
        Player existingPlayer = getPlayerById(id);
        
        if (updatedPlayer.getName() != null) existingPlayer.setName(updatedPlayer.getName());
        if (updatedPlayer.getRole() != null) existingPlayer.setRole(updatedPlayer.getRole());
        if (updatedPlayer.getJerseyNumber() != null) existingPlayer.setJerseyNumber(updatedPlayer.getJerseyNumber());
        if (updatedPlayer.getBattingStyle() != null) existingPlayer.setBattingStyle(updatedPlayer.getBattingStyle());
        if (updatedPlayer.getBowlingStyle() != null) existingPlayer.setBowlingStyle(updatedPlayer.getBowlingStyle());
        if (updatedPlayer.getPlayerImage() != null) existingPlayer.setPlayerImage(updatedPlayer.getPlayerImage());
        if (updatedPlayer.getIsCaptain() != null) existingPlayer.setIsCaptain(updatedPlayer.getIsCaptain());
        if (updatedPlayer.getIsViceCaptain() != null) existingPlayer.setIsViceCaptain(updatedPlayer.getIsViceCaptain());
        
        return playerRepository.save(existingPlayer);
    }

    public Player updatePlayerStats(Long id, Player statsUpdate) {
        Player existingPlayer = getPlayerById(id);

        if (statsUpdate.getBattingStyle() != null) existingPlayer.setBattingStyle(statsUpdate.getBattingStyle());
        if (statsUpdate.getBowlingStyle() != null) existingPlayer.setBowlingStyle(statsUpdate.getBowlingStyle());

        if (statsUpdate.getMatchesPlayed() != null) existingPlayer.setMatchesPlayed(statsUpdate.getMatchesPlayed());
        if (statsUpdate.getInningsPlayed() != null) existingPlayer.setInningsPlayed(statsUpdate.getInningsPlayed());
        if (statsUpdate.getRunsScored() != null) existingPlayer.setRunsScored(statsUpdate.getRunsScored());
        if (statsUpdate.getBallsFaced() != null) existingPlayer.setBallsFaced(statsUpdate.getBallsFaced());
        if (statsUpdate.getHighestScore() != null) existingPlayer.setHighestScore(statsUpdate.getHighestScore());
        if (statsUpdate.getBattingAverage() != null) existingPlayer.setBattingAverage(statsUpdate.getBattingAverage());
        if (statsUpdate.getStrikeRate() != null) existingPlayer.setStrikeRate(statsUpdate.getStrikeRate());
        if (statsUpdate.getFifties() != null) existingPlayer.setFifties(statsUpdate.getFifties());
        if (statsUpdate.getHundreds() != null) existingPlayer.setHundreds(statsUpdate.getHundreds());

        if (statsUpdate.getOversBowled() != null) existingPlayer.setOversBowled(statsUpdate.getOversBowled());
        if (statsUpdate.getRunsConceded() != null) existingPlayer.setRunsConceded(statsUpdate.getRunsConceded());
        if (statsUpdate.getWickets() != null) existingPlayer.setWickets(statsUpdate.getWickets());
        if (statsUpdate.getBestBowling() != null) existingPlayer.setBestBowling(statsUpdate.getBestBowling());
        if (statsUpdate.getEconomyRate() != null) existingPlayer.setEconomyRate(statsUpdate.getEconomyRate());
        if (statsUpdate.getBowlingAverage() != null) existingPlayer.setBowlingAverage(statsUpdate.getBowlingAverage());
        if (statsUpdate.getBowlingStrikeRate() != null) existingPlayer.setBowlingStrikeRate(statsUpdate.getBowlingStrikeRate());

        return playerRepository.save(existingPlayer);
    }
}
