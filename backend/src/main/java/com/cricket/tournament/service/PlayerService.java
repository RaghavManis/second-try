package com.cricket.tournament.service;

import com.cricket.tournament.model.Player;
import com.cricket.tournament.model.Team;
import com.cricket.tournament.repository.PlayerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.cricket.tournament.dto.PlayerProfileDto;
import com.cricket.tournament.repository.PlayerMatchStatsRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlayerService {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private PlayerMatchStatsRepository playerMatchStatsRepository;

    @Autowired
    private TeamService teamService;

    @Transactional
    @CacheEvict(value = {"players", "playerProfile", "teamPlayers"}, allEntries = true)
    public Player addPlayer(Player player) {
        return playerRepository.save(player);
    }

    @Cacheable(value = "teamPlayers", key = "#teamId")
    public List<Player> getPlayersByTeam(Long teamId) {
        // Verify team exists before fetching players
        teamService.getTeamById(teamId);
        return playerRepository.findByTeamId(teamId);
    }

    @Transactional
    @CacheEvict(value = {"players", "playerProfile", "teamPlayers"}, allEntries = true)
    public void removePlayer(Long id) {
        if (!playerRepository.existsById(id)) {
            throw new RuntimeException("Player not found");
        }
        playerRepository.deleteById(id);
    }

    @Cacheable(value = "players")
    public List<Player> getAllPlayers() {
        return playerRepository.findAll();
    }

    public Player getPlayerById(Long id) {
        return playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found with id " + id));
    }

    @Transactional
    @CacheEvict(value = {"players", "playerProfile", "teamPlayers"}, allEntries = true)
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

    @Cacheable(value = "playerProfile", key = "#id")
    public PlayerProfileDto getPlayerProfile(Long id) {
        Player player = getPlayerById(id);
        
        Map<String, Object> overall = playerMatchStatsRepository.getOverallAggregatedStatsByPlayer(id);
        if (overall == null || overall.get("matchesPlayed") == null || ((Number)overall.get("matchesPlayed")).intValue() == 0) {
            overall = new HashMap<>(); // Empty stats map
        }
        
        List<Map<String, Object>> aggregated = playerMatchStatsRepository.getAggregatedStatsByPlayer(id);
        Map<String, Object> tournamentStats = new HashMap<>();
        Map<String, Object> practiceStats = new HashMap<>();
        
        for (Map<String, Object> statBreakdown : aggregated) {
            if ("TOURNAMENT".equals(String.valueOf(statBreakdown.get("matchType")))) {
                tournamentStats = statBreakdown;
            } else if ("PRACTICE".equals(String.valueOf(statBreakdown.get("matchType")))) {
                practiceStats = statBreakdown;
            }
        }
        
        return new PlayerProfileDto(player, overall, tournamentStats, practiceStats);
    }


}
