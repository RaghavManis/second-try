package com.cricket.tournament.dto;

public class LiveMatchSetupDto {
    private Long tossWinnerId;
    private String tossDecision;
    private Long strikerId;
    private Long nonStrikerId;
    private Long openingBowlerId;
    private Integer totalOvers;

    public Long getTossWinnerId() { return tossWinnerId; }
    public void setTossWinnerId(Long tossWinnerId) { this.tossWinnerId = tossWinnerId; }
    public String getTossDecision() { return tossDecision; }
    public void setTossDecision(String tossDecision) { this.tossDecision = tossDecision; }
    public Long getStrikerId() { return strikerId; }
    public void setStrikerId(Long strikerId) { this.strikerId = strikerId; }
    public Long getNonStrikerId() { return nonStrikerId; }
    public void setNonStrikerId(Long nonStrikerId) { this.nonStrikerId = nonStrikerId; }
    public Long getOpeningBowlerId() { return openingBowlerId; }
    public void setOpeningBowlerId(Long openingBowlerId) { this.openingBowlerId = openingBowlerId; }
    public Integer getTotalOvers() { return totalOvers; }
    public void setTotalOvers(Integer totalOvers) { this.totalOvers = totalOvers; }

    private java.util.List<Long> playingXiTeamAIds;
    private java.util.List<Long> playingXiTeamBIds;

    public java.util.List<Long> getPlayingXiTeamAIds() {
        return playingXiTeamAIds;
    }

    public void setPlayingXiTeamAIds(java.util.List<Long> playingXiTeamAIds) {
        this.playingXiTeamAIds = playingXiTeamAIds;
    }

    public java.util.List<Long> getPlayingXiTeamBIds() {
        return playingXiTeamBIds;
    }

    public void setPlayingXiTeamBIds(java.util.List<Long> playingXiTeamBIds) {
        this.playingXiTeamBIds = playingXiTeamBIds;
    }
}
