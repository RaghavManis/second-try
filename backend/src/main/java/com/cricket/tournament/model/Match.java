package com.cricket.tournament.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    public enum MatchType {
        TOURNAMENT, PRACTICE
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "match_type", nullable = false)
    private MatchType matchType = MatchType.TOURNAMENT;

    @ManyToOne
    @JoinColumn(name = "team_a_id", nullable = false)
    @NotNull(message = "Team A is required")
    private Team teamA;

    @ManyToOne
    @JoinColumn(name = "team_b_id", nullable = false)
    @NotNull(message = "Team B is required")
    private Team teamB;

    @NotNull(message = "Match date is required")
    @Column(name = "match_date", nullable = false)
    private LocalDate matchDate;

    @NotNull(message = "Overs is required")
    @Column(name = "overs", nullable = false)
    private Integer overs; // 10, 15, 20, custom

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private MatchStatus status; // SCHEDULED, COMPLETED

    @ManyToOne
    @JoinColumn(name = "winner_team_id")
    private Team winnerTeam; // Can be null if TIE or SCHEDULED

    @ManyToOne
    @JoinColumn(name = "toss_winner_id")
    private Team tossWinner;

    @Column(name = "toss_decision")
    private String tossDecision; // BATTING or BOWLING

    @ManyToOne
    @JoinColumn(name = "batting_team_id")
    private Team battingTeam;

    @ManyToOne
    @JoinColumn(name = "bowling_team_id")
    private Team bowlingTeam;

    @Column(name = "current_innings")
    private Integer currentInnings; // 1 or 2

    @Column(name = "target_score")
    private Integer targetScore;

    @Column(name = "current_score")
    private Integer currentScore = 0;

    @Column(name = "current_wickets")
    private Integer currentWickets = 0;

    @Column(name = "first_innings_score")
    private Integer firstInningsScore;

    @Column(name = "first_innings_wickets")
    private Integer firstInningsWickets;

    @Column(name = "first_innings_balls")
    private Integer firstInningsBalls;

    @Column(name = "current_balls")
    private Integer currentBalls = 0;

    @ManyToOne
    @JoinColumn(name = "current_striker_id")
    private Player currentStriker;

    @ManyToOne
    @JoinColumn(name = "current_non_striker_id")
    private Player currentNonStriker;

    @ManyToOne
    @JoinColumn(name = "current_bowler_id")
    private Player currentBowler;

    @ManyToMany
    @JoinTable(
        name = "match_playing_xi_a",
        joinColumns = @JoinColumn(name = "match_id"),
        inverseJoinColumns = @JoinColumn(name = "player_id")
    )
    private java.util.Set<Player> playingXiTeamA = new java.util.HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "match_playing_xi_b",
        joinColumns = @JoinColumn(name = "match_id"),
        inverseJoinColumns = @JoinColumn(name = "player_id")
    )
    private java.util.Set<Player> playingXiTeamB = new java.util.HashSet<>();

    @Column(name = "result")
    private String result;

    @ManyToOne
    @JoinColumn(name = "man_of_the_match_id")
    private Player manOfTheMatch;

    public enum MatchStatus {
        SCHEDULED,
        ONGOING,
        COMPLETED
    }

    public Match() {
    }

    public Match(Team teamA, Team teamB, LocalDate matchDate, Integer overs, MatchStatus status) {
        this.teamA = teamA;
        this.teamB = teamB;
        this.matchDate = matchDate;
        this.overs = overs;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Team getTeamA() {
        return teamA;
    }

    public void setTeamA(Team teamA) {
        this.teamA = teamA;
    }

    public Team getTeamB() {
        return teamB;
    }

    public void setTeamB(Team teamB) {
        this.teamB = teamB;
    }

    public LocalDate getMatchDate() {
        return matchDate;
    }

    public void setMatchDate(LocalDate matchDate) {
        this.matchDate = matchDate;
    }

    public Integer getOvers() {
        return overs;
    }

    public void setOvers(Integer overs) {
        this.overs = overs;
    }

    public MatchStatus getStatus() {
        return status;
    }

    public void setStatus(MatchStatus status) {
        this.status = status;
    }

    public MatchType getMatchType() {
        return matchType;
    }

    public void setMatchType(MatchType matchType) {
        this.matchType = matchType;
    }

    public Team getWinnerTeam() {
        return winnerTeam;
    }

    public void setWinnerTeam(Team winnerTeam) {
        this.winnerTeam = winnerTeam;
    }

    public Team getTossWinner() {
        return tossWinner;
    }

    public void setTossWinner(Team tossWinner) {
        this.tossWinner = tossWinner;
    }

    public String getTossDecision() {
        return tossDecision;
    }

    public void setTossDecision(String tossDecision) {
        this.tossDecision = tossDecision;
    }

    public Team getBattingTeam() {
        return battingTeam;
    }

    public void setBattingTeam(Team battingTeam) {
        this.battingTeam = battingTeam;
    }

    public Team getBowlingTeam() {
        return bowlingTeam;
    }

    public void setBowlingTeam(Team bowlingTeam) {
        this.bowlingTeam = bowlingTeam;
    }

    public Integer getCurrentInnings() {
        return currentInnings;
    }

    public void setCurrentInnings(Integer currentInnings) {
        this.currentInnings = currentInnings;
    }

    public Integer getTargetScore() {
        return targetScore;
    }

    public void setTargetScore(Integer targetScore) {
        this.targetScore = targetScore;
    }

    public Integer getCurrentScore() {
        return currentScore;
    }

    public void setCurrentScore(Integer currentScore) {
        this.currentScore = currentScore;
    }

    public Integer getCurrentWickets() {
        return currentWickets;
    }

    public void setCurrentWickets(Integer currentWickets) {
        this.currentWickets = currentWickets;
    }

    public Integer getCurrentBalls() {
        return currentBalls;
    }

    public void setCurrentBalls(Integer currentBalls) {
        this.currentBalls = currentBalls;
    }

    public Integer getFirstInningsScore() {
        return firstInningsScore;
    }

    public void setFirstInningsScore(Integer firstInningsScore) {
        this.firstInningsScore = firstInningsScore;
    }

    public Integer getFirstInningsWickets() {
        return firstInningsWickets;
    }

    public void setFirstInningsWickets(Integer firstInningsWickets) {
        this.firstInningsWickets = firstInningsWickets;
    }

    public Integer getFirstInningsBalls() {
        return firstInningsBalls;
    }

    public void setFirstInningsBalls(Integer firstInningsBalls) {
        this.firstInningsBalls = firstInningsBalls;
    }

    public Player getCurrentStriker() {
        return currentStriker;
    }

    public void setCurrentStriker(Player currentStriker) {
        this.currentStriker = currentStriker;
    }

    public Player getCurrentNonStriker() {
        return currentNonStriker;
    }

    public void setCurrentNonStriker(Player currentNonStriker) {
        this.currentNonStriker = currentNonStriker;
    }

    public Player getCurrentBowler() {
        return currentBowler;
    }

    public void setCurrentBowler(Player currentBowler) {
        this.currentBowler = currentBowler;
    }

    public java.util.Set<Player> getPlayingXiTeamA() {
        return playingXiTeamA;
    }

    public void setPlayingXiTeamA(java.util.Set<Player> playingXiTeamA) {
        this.playingXiTeamA = playingXiTeamA;
    }

    public java.util.Set<Player> getPlayingXiTeamB() {
        return playingXiTeamB;
    }

    public void setPlayingXiTeamB(java.util.Set<Player> playingXiTeamB) {
        this.playingXiTeamB = playingXiTeamB;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public Player getManOfTheMatch() {
        return manOfTheMatch;
    }

    public void setManOfTheMatch(Player manOfTheMatch) {
        this.manOfTheMatch = manOfTheMatch;
    }
}
