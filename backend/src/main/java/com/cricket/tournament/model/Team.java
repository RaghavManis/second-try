package com.cricket.tournament.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Team name is required")
    @Column(name = "team_name", nullable = false, unique = true)
    private String teamName;

    @Column(name = "coach_name")
    private String coachName;

    public Team() {
    }

    public Team(String teamName, String coachName) {
        this.teamName = teamName;
        this.coachName = coachName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTeamName() {
        return teamName;
    }

    public void setTeamName(String teamName) {
        this.teamName = teamName;
    }

    public String getCoachName() {
        return coachName;
    }

    public void setCoachName(String coachName) {
        this.coachName = coachName;
    }

    @Column(name = "team_logo", length = 1024)
    private String teamLogo;

    public String getTeamLogo() {
        return teamLogo;
    }

    public void setTeamLogo(String teamLogo) {
        this.teamLogo = teamLogo;
    }

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private java.util.List<Player> players = new java.util.ArrayList<>();

    public java.util.List<Player> getPlayers() {
        return players;
    }

    public void setPlayers(java.util.List<Player> players) {
        this.players = players;
    }
}
