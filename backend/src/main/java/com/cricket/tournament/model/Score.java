package com.cricket.tournament.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

@Entity
@Table(name = "scores")
public class Score {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "match_id", nullable = false, unique = true)
    @NotNull(message = "Match is required")
    private Match match;

    @NotNull
    @Min(value = 0, message = "Runs cannot be negative")
    @Column(name = "team_a_runs", nullable = false)
    private Integer teamARuns;

    @NotNull
    @Min(value = 0, message = "Wickets cannot be negative")
    @Column(name = "team_a_wickets", nullable = false)
    private Integer teamAWickets;

    @NotNull
    @Min(value = 0, message = "Runs cannot be negative")
    @Column(name = "team_b_runs", nullable = false)
    private Integer teamBRuns;

    @NotNull
    @Min(value = 0, message = "Wickets cannot be negative")
    @Column(name = "team_b_wickets", nullable = false)
    private Integer teamBWickets;

    @NotNull
    @Min(value = 0, message = "Overs played cannot be negative")
    @Column(name = "overs_played", nullable = false)
    private Double oversPlayed;

    public Score() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Match getMatch() {
        return match;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public Integer getTeamARuns() {
        return teamARuns;
    }

    public void setTeamARuns(Integer teamARuns) {
        this.teamARuns = teamARuns;
    }

    public Integer getTeamAWickets() {
        return teamAWickets;
    }

    public void setTeamAWickets(Integer teamAWickets) {
        this.teamAWickets = teamAWickets;
    }

    public Integer getTeamBRuns() {
        return teamBRuns;
    }

    public void setTeamBRuns(Integer teamBRuns) {
        this.teamBRuns = teamBRuns;
    }

    public Integer getTeamBWickets() {
        return teamBWickets;
    }

    public void setTeamBWickets(Integer teamBWickets) {
        this.teamBWickets = teamBWickets;
    }

    public Double getOversPlayed() {
        return oversPlayed;
    }

    public void setOversPlayed(Double oversPlayed) {
        this.oversPlayed = oversPlayed;
    }
}
