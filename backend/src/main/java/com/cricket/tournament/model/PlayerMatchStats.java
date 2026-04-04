package com.cricket.tournament.model;

import jakarta.persistence.*;

@Entity
@Table(name = "player_match_stats")
public class PlayerMatchStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_id", nullable = false)
    private Match match;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false)
    private Match.MatchType matchType;

    // Batting stats
    private int runsScored = 0;
    private int ballsFaced = 0;
    private int fours = 0;
    private int sixes = 0;
    private boolean isOut = false;

    // Bowling stats
    private double oversBowled = 0.0;
    private int runsConceded = 0;
    private int wickets = 0;
    private int maidens = 0;

    // Fielding stats
    private int catches = 0;
    private int runOuts = 0;
    private int stumpings = 0;

    public PlayerMatchStats() {
    }

    public PlayerMatchStats(Player player, Match match, Match.MatchType matchType) {
        this.player = player;
        this.match = match;
        this.matchType = matchType;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Player getPlayer() {
        return player;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public Match getMatch() {
        return match;
    }

    public void setMatch(Match match) {
        this.match = match;
    }

    public Match.MatchType getMatchType() {
        return matchType;
    }

    public void setMatchType(Match.MatchType matchType) {
        this.matchType = matchType;
    }

    public int getRunsScored() {
        return runsScored;
    }

    public void setRunsScored(int runsScored) {
        this.runsScored = runsScored;
    }

    public int getBallsFaced() {
        return ballsFaced;
    }

    public void setBallsFaced(int ballsFaced) {
        this.ballsFaced = ballsFaced;
    }

    public int getFours() {
        return fours;
    }

    public void setFours(int fours) {
        this.fours = fours;
    }

    public int getSixes() {
        return sixes;
    }

    public void setSixes(int sixes) {
        this.sixes = sixes;
    }

    public boolean isOut() {
        return isOut;
    }

    public void setOut(boolean out) {
        isOut = out;
    }

    public double getOversBowled() {
        return oversBowled;
    }

    public void setOversBowled(double oversBowled) {
        this.oversBowled = oversBowled;
    }

    public int getRunsConceded() {
        return runsConceded;
    }

    public void setRunsConceded(int runsConceded) {
        this.runsConceded = runsConceded;
    }

    public int getWickets() {
        return wickets;
    }

    public void setWickets(int wickets) {
        this.wickets = wickets;
    }

    public int getMaidens() {
        return maidens;
    }

    public void setMaidens(int maidens) {
        this.maidens = maidens;
    }

    public int getCatches() {
        return catches;
    }

    public void setCatches(int catches) {
        this.catches = catches;
    }

    public int getRunOuts() {
        return runOuts;
    }

    public void setRunOuts(int runOuts) {
        this.runOuts = runOuts;
    }

    public int getStumpings() {
        return stumpings;
    }

    public void setStumpings(int stumpings) {
        this.stumpings = stumpings;
    }
}
