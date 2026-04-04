package com.cricket.tournament.dto;

import com.cricket.tournament.model.Player;
import java.util.Map;

public class PlayerProfileDto {
    private Player player;
    private Map<String, Object> overallStats;
    private Map<String, Object> tournamentStats;
    private Map<String, Object> practiceStats;

    public PlayerProfileDto() {}

    public PlayerProfileDto(Player player, Map<String, Object> overallStats, Map<String, Object> tournamentStats, Map<String, Object> practiceStats) {
        this.player = player;
        this.overallStats = overallStats;
        this.tournamentStats = tournamentStats;
        this.practiceStats = practiceStats;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public Map<String, Object> getOverallStats() {
        return overallStats;
    }

    public void setOverallStats(Map<String, Object> overallStats) {
        this.overallStats = overallStats;
    }

    public Map<String, Object> getTournamentStats() {
        return tournamentStats;
    }

    public void setTournamentStats(Map<String, Object> tournamentStats) {
        this.tournamentStats = tournamentStats;
    }

    public Map<String, Object> getPracticeStats() {
        return practiceStats;
    }

    public void setPracticeStats(Map<String, Object> practiceStats) {
        this.practiceStats = practiceStats;
    }
}
