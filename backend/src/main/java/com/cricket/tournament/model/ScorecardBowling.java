package com.cricket.tournament.model;

import jakarta.persistence.*;

@Entity
@Table(name = "scorecard_bowling", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"match_id", "innings", "player_id"})
    },
    indexes = {
        @Index(name = "idx_bowling_match_innings_player", columnList = "match_id, innings, player_id")
    }
)
public class ScorecardBowling {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @Column(name = "innings", nullable = false)
    private Integer innings;

    @Column(name = "overs")
    private Double overs = 0.0;

    @Column(name = "maidens")
    private Integer maidens = 0;

    @Column(name = "runs")
    private Integer runs = 0;

    @Column(name = "wickets")
    private Integer wickets = 0;

    @Column(name = "economy_rate")
    private Double economyRate = 0.0;

    public ScorecardBowling() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }
    public Player getPlayer() { return player; }
    public void setPlayer(Player player) { this.player = player; }
    public Integer getInnings() { return innings; }
    public void setInnings(Integer innings) { this.innings = innings; }
    public Double getOvers() { return overs; }
    public void setOvers(Double overs) { this.overs = overs; }
    public Integer getMaidens() { return maidens; }
    public void setMaidens(Integer maidens) { this.maidens = maidens; }
    public Integer getRuns() { return runs; }
    public void setRuns(Integer runs) { this.runs = runs; }
    public Integer getWickets() { return wickets; }
    public void setWickets(Integer wickets) { this.wickets = wickets; }
    public Double getEconomyRate() { return economyRate; }
    public void setEconomyRate(Double economyRate) { this.economyRate = economyRate; }
}
