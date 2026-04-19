package com.cricket.tournament.dto;

import com.cricket.tournament.model.Match;
import com.cricket.tournament.model.Player;
import java.util.List;

public class LiveMatchDetailsDto {
    private Match match;
    private Integer currentScore;
    private Integer currentWickets;
    private Double currentOvers;
    private Double currentRunRate;
    
    private Integer targetScore;
    private Double requiredRunRate;
    
    // Current Players context
    private Player currentStriker;
    private Player currentNonStriker;
    private Player currentBowler;
    private Long previousBowlerId;

    // Batting stats for current 
    private Integer strikerRuns;
    private Integer strikerBalls;
    private Integer nonStrikerRuns;
    private Integer nonStrikerBalls;

    // Bowling stats for current
    private Double bowlerOvers;
    private Integer bowlerRuns;
    private Integer bowlerWickets;
    private Double bowlerEconomy;

    private List<String> recentBalls; 
    private List<String> thisOverBalls; 

    private String streamUrl;
    private Integer streamDelaySeconds;

    private List<Player> teamAPlayers;
    private List<Player> teamBPlayers;

    public LiveMatchDetailsDto() {}
    
    // ... Getters and Setters omitted for brevity are untouched ...
    public Match getMatch() { return match; }
    public void setMatch(Match match) { this.match = match; }
    public Integer getCurrentScore() { return currentScore; }
    public void setCurrentScore(Integer currentScore) { this.currentScore = currentScore; }
    public Integer getCurrentWickets() { return currentWickets; }
    public void setCurrentWickets(Integer currentWickets) { this.currentWickets = currentWickets; }
    public Double getCurrentOvers() { return currentOvers; }
    public void setCurrentOvers(Double currentOvers) { this.currentOvers = currentOvers; }
    public Double getCurrentRunRate() { return currentRunRate; }
    public void setCurrentRunRate(Double currentRunRate) { this.currentRunRate = currentRunRate; }
    public Integer getTargetScore() { return targetScore; }
    public void setTargetScore(Integer targetScore) { this.targetScore = targetScore; }
    public Double getRequiredRunRate() { return requiredRunRate; }
    public void setRequiredRunRate(Double requiredRunRate) { this.requiredRunRate = requiredRunRate; }
    public Player getCurrentStriker() { return currentStriker; }
    public void setCurrentStriker(Player currentStriker) { this.currentStriker = currentStriker; }
    public Player getCurrentNonStriker() { return currentNonStriker; }
    public void setCurrentNonStriker(Player currentNonStriker) { this.currentNonStriker = currentNonStriker; }
    public Player getCurrentBowler() { return currentBowler; }
    public void setCurrentBowler(Player currentBowler) { this.currentBowler = currentBowler; }
    public Long getPreviousBowlerId() { return previousBowlerId; }
    public void setPreviousBowlerId(Long previousBowlerId) { this.previousBowlerId = previousBowlerId; }
    public Integer getStrikerRuns() { return strikerRuns; }
    public void setStrikerRuns(Integer strikerRuns) { this.strikerRuns = strikerRuns; }
    public Integer getStrikerBalls() { return strikerBalls; }
    public void setStrikerBalls(Integer strikerBalls) { this.strikerBalls = strikerBalls; }
    public Integer getNonStrikerRuns() { return nonStrikerRuns; }
    public void setNonStrikerRuns(Integer nonStrikerRuns) { this.nonStrikerRuns = nonStrikerRuns; }
    public Integer getNonStrikerBalls() { return nonStrikerBalls; }
    public void setNonStrikerBalls(Integer nonStrikerBalls) { this.nonStrikerBalls = nonStrikerBalls; }
    public Double getBowlerOvers() { return bowlerOvers; }
    public void setBowlerOvers(Double bowlerOvers) { this.bowlerOvers = bowlerOvers; }
    public Integer getBowlerRuns() { return bowlerRuns; }
    public void setBowlerRuns(Integer bowlerRuns) { this.bowlerRuns = bowlerRuns; }
    public Integer getBowlerWickets() { return bowlerWickets; }
    public void setBowlerWickets(Integer bowlerWickets) { this.bowlerWickets = bowlerWickets; }
    public Double getBowlerEconomy() { return bowlerEconomy; }
    public void setBowlerEconomy(Double bowlerEconomy) { this.bowlerEconomy = bowlerEconomy; }
    public List<String> getRecentBalls() { return recentBalls; }
    public void setRecentBalls(List<String> recentBalls) { this.recentBalls = recentBalls; }
    public List<String> getThisOverBalls() { return thisOverBalls; }
    public void setThisOverBalls(List<String> thisOverBalls) { this.thisOverBalls = thisOverBalls; }
    public String getStreamUrl() { return streamUrl; }
    public void setStreamUrl(String streamUrl) { this.streamUrl = streamUrl; }
    public Integer getStreamDelaySeconds() { return streamDelaySeconds; }
    public void setStreamDelaySeconds(Integer streamDelaySeconds) { this.streamDelaySeconds = streamDelaySeconds; }
    public List<Player> getTeamAPlayers() { return teamAPlayers; }
    public void setTeamAPlayers(List<Player> teamAPlayers) { this.teamAPlayers = teamAPlayers; }
    public List<Player> getTeamBPlayers() { return teamBPlayers; }
    public void setTeamBPlayers(List<Player> teamBPlayers) { this.teamBPlayers = teamBPlayers; }
}
