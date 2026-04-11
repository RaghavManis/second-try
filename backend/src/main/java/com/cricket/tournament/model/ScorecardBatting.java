package com.cricket.tournament.model;

import jakarta.persistence.*;

@Entity
@Table(name = "scorecard_batting", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"match_id", "innings", "player_id"})
    },
    indexes = {
        @Index(name = "idx_batting_match_innings_player", columnList = "match_id, innings, player_id")
    }
)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ScorecardBatting {

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

    @Column(name = "runs")
    private Integer runs = 0;

    @Column(name = "balls")
    private Integer balls = 0;

    @Column(name = "fours")
    private Integer fours = 0;

    @Column(name = "sixes")
    private Integer sixes = 0;

    @Column(name = "strike_rate")
    private Double strikeRate = 0.0;

    @Column(name = "how_out")
    private String howOut = "Not Out";

    public ScorecardBatting() {}

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
    public Integer getRuns() { return runs; }
    public void setRuns(Integer runs) { this.runs = runs; }
    public Integer getBalls() { return balls; }
    public void setBalls(Integer balls) { this.balls = balls; }
    public Integer getFours() { return fours; }
    public void setFours(Integer fours) { this.fours = fours; }
    public Integer getSixes() { return sixes; }
    public void setSixes(Integer sixes) { this.sixes = sixes; }
    public Double getStrikeRate() { return strikeRate; }
    public void setStrikeRate(Double strikeRate) { this.strikeRate = strikeRate; }
    public String getHowOut() { return howOut; }
    public void setHowOut(String howOut) { this.howOut = howOut; }
}
