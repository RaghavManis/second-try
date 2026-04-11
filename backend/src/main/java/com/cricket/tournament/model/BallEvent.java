package com.cricket.tournament.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ball_events", indexes = {
    @Index(name = "idx_ball_match_innings", columnList = "match_id, innings, over_number, ball_number, id")
})
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class BallEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Column(name = "innings", nullable = false)
    private Integer innings;

    @Column(name = "over_number", nullable = false)
    private Integer overNumber; // 1-indexed (e.g., 1 for the first over)

    @Column(name = "ball_number", nullable = false)
    private Integer ballNumber; // Usually 1 to 6

    @ManyToOne
    @JoinColumn(name = "bowler_id", nullable = false)
    private Player bowler;

    @ManyToOne
    @JoinColumn(name = "striker_id", nullable = false)
    private Player striker;

    @ManyToOne
    @JoinColumn(name = "non_striker_id", nullable = false)
    private Player nonStriker;

    @Column(name = "runs", nullable = false)
    private Integer runs; // Runs off the bat

    @Column(name = "extra_type")
    private String extraType; // WIDE, NO_BALL, BYE, LEG_BYE, null if legal and no extras

    @Column(name = "extra_runs")
    private Integer extraRuns; // Number of extra runs

    @Column(name = "is_wicket")
    private Boolean isWicket;

    @Column(name = "wicket_type")
    private String wicketType; // BOWLED, CAUGHT, LBW, RUN_OUT, STUMPED, etc.

    @ManyToOne
    @JoinColumn(name = "player_out_id")
    private Player playerOut; // Who got out (can be non-striker in runout)

    public BallEvent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public Integer getInnings() { return innings; }
    public void setInnings(Integer innings) { this.innings = innings; }
    public Integer getOverNumber() { return overNumber; }
    public void setOverNumber(Integer overNumber) { this.overNumber = overNumber; }
    public Integer getBallNumber() { return ballNumber; }
    public void setBallNumber(Integer ballNumber) { this.ballNumber = ballNumber; }
    public Player getBowler() { return bowler; }
    public void setBowler(Player bowler) { this.bowler = bowler; }
    public Player getStriker() { return striker; }
    public void setStriker(Player striker) { this.striker = striker; }
    public Player getNonStriker() { return nonStriker; }
    public void setNonStriker(Player nonStriker) { this.nonStriker = nonStriker; }
    public Integer getRuns() { return runs; }
    public void setRuns(Integer runs) { this.runs = runs; }
    public String getExtraType() { return extraType; }
    public void setExtraType(String extraType) { this.extraType = extraType; }
    public Integer getExtraRuns() { return extraRuns; }
    public void setExtraRuns(Integer extraRuns) { this.extraRuns = extraRuns; }
    public Boolean getIsWicket() { return isWicket; }
    public void setIsWicket(Boolean wicket) { isWicket = wicket; }
    public String getWicketType() { return wicketType; }
    public void setWicketType(String wicketType) { this.wicketType = wicketType; }
    public Player getPlayerOut() { return playerOut; }
    public void setPlayerOut(Player playerOut) { this.playerOut = playerOut; }
}
