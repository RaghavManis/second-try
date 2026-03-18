package com.cricket.tournament.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(name = "players")
public class Player {

    public enum PlayerRole {
        BATSMAN, BOWLER, ALL_ROUNDER, WICKETKEEPER
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Player name is required")
    private String name;

    @NotNull(message = "Player role is required")
    @Enumerated(EnumType.STRING)
    private PlayerRole role;

    private Integer jerseyNumber;

    @Column(name = "is_captain")
    private Boolean isCaptain = false;

    @Column(name = "is_vice_captain")
    private Boolean isViceCaptain = false;

    // Basic Info
    @Column(name = "batting_style")
    private String battingStyle;

    @Column(name = "bowling_style")
    private String bowlingStyle;

    // Batting Statistics
    @Column(name = "matches_played")
    private Integer matchesPlayed = 0;

    @Column(name = "innings_played")
    private Integer inningsPlayed = 0;

    @Column(name = "runs_scored")
    private Integer runsScored = 0;

    @Column(name = "balls_faced")
    private Integer ballsFaced = 0;

    @Column(name = "highest_score")
    private Integer highestScore = 0;

    @Column(name = "batting_average")
    private Double battingAverage = 0.0;

    @Column(name = "strike_rate")
    private Double strikeRate = 0.0;

    private Integer fifties = 0;
    private Integer hundreds = 0;

    // Bowling Statistics
    @Column(name = "overs_bowled")
    private Double oversBowled = 0.0;

    @Column(name = "runs_conceded")
    private Integer runsConceded = 0;

    private Integer wickets = 0;

    @Column(name = "best_bowling")
    private String bestBowling;

    @Column(name = "economy_rate")
    private Double economyRate = 0.0;

    @Column(name = "bowling_average")
    private Double bowlingAverage = 0.0;

    @Column(name = "bowling_strike_rate")
    private Double bowlingStrikeRate = 0.0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    // Constructors
    public Player() {
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public PlayerRole getRole() {
        return role;
    }

    public void setRole(PlayerRole role) {
        this.role = role;
    }

    public Integer getJerseyNumber() {
        return jerseyNumber;
    }

    public void setJerseyNumber(Integer jerseyNumber) {
        this.jerseyNumber = jerseyNumber;
    }

    public Boolean getIsCaptain() {
        return isCaptain;
    }

    public void setIsCaptain(Boolean isCaptain) {
        this.isCaptain = isCaptain;
    }

    public Boolean getIsViceCaptain() {
        return isViceCaptain;
    }

    public void setIsViceCaptain(Boolean isViceCaptain) {
        this.isViceCaptain = isViceCaptain;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    // Getters and Setters for Stats
    public String getBattingStyle() { return battingStyle; }
    public void setBattingStyle(String battingStyle) { this.battingStyle = battingStyle; }

    public String getBowlingStyle() { return bowlingStyle; }
    public void setBowlingStyle(String bowlingStyle) { this.bowlingStyle = bowlingStyle; }

    public Integer getMatchesPlayed() { return matchesPlayed; }
    public void setMatchesPlayed(Integer matchesPlayed) { this.matchesPlayed = matchesPlayed; }

    public Integer getInningsPlayed() { return inningsPlayed; }
    public void setInningsPlayed(Integer inningsPlayed) { this.inningsPlayed = inningsPlayed; }

    public Integer getRunsScored() { return runsScored; }
    public void setRunsScored(Integer runsScored) { this.runsScored = runsScored; }

    public Integer getBallsFaced() { return ballsFaced; }
    public void setBallsFaced(Integer ballsFaced) { this.ballsFaced = ballsFaced; }

    public Integer getHighestScore() { return highestScore; }
    public void setHighestScore(Integer highestScore) { this.highestScore = highestScore; }

    public Double getBattingAverage() { return battingAverage; }
    public void setBattingAverage(Double battingAverage) { this.battingAverage = battingAverage; }

    public Double getStrikeRate() { return strikeRate; }
    public void setStrikeRate(Double strikeRate) { this.strikeRate = strikeRate; }

    public Integer getFifties() { return fifties; }
    public void setFifties(Integer fifties) { this.fifties = fifties; }

    public Integer getHundreds() { return hundreds; }
    public void setHundreds(Integer hundreds) { this.hundreds = hundreds; }

    public Double getOversBowled() { return oversBowled; }
    public void setOversBowled(Double oversBowled) { this.oversBowled = oversBowled; }

    public Integer getRunsConceded() { return runsConceded; }
    public void setRunsConceded(Integer runsConceded) { this.runsConceded = runsConceded; }

    public Integer getWickets() { return wickets; }
    public void setWickets(Integer wickets) { this.wickets = wickets; }

    public String getBestBowling() { return bestBowling; }
    public void setBestBowling(String bestBowling) { this.bestBowling = bestBowling; }

    public Double getEconomyRate() { return economyRate; }
    public void setEconomyRate(Double economyRate) { this.economyRate = economyRate; }

    public Double getBowlingAverage() { return bowlingAverage; }
    public void setBowlingAverage(Double bowlingAverage) { this.bowlingAverage = bowlingAverage; }

    public Double getBowlingStrikeRate() { return bowlingStrikeRate; }
    public void setBowlingStrikeRate(Double bowlingStrikeRate) { this.bowlingStrikeRate = bowlingStrikeRate; }
}
