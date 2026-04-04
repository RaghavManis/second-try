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



    // Getters and Setters for Stats
    public String getBattingStyle() { return battingStyle; }
    public void setBattingStyle(String battingStyle) { this.battingStyle = battingStyle; }

    public String getBowlingStyle() { return bowlingStyle; }
    public void setBowlingStyle(String bowlingStyle) { this.bowlingStyle = bowlingStyle; }



    @Column(name = "player_image", length = 1024)
    private String playerImage;

    public String getPlayerImage() { return playerImage; }
    public void setPlayerImage(String playerImage) { this.playerImage = playerImage; }
}
