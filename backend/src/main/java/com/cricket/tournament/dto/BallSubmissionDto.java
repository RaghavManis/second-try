package com.cricket.tournament.dto;

public class BallSubmissionDto {
    private Integer runs;
    private String extraType; // WIDE, NO_BALL, BYE, LEG_BYE
    private Integer extraRuns;
    private Boolean isWicket;
    private String wicketType; // BOWLED, CAUGHT, RUN_OUT, etc.
    private Long playerOutId;
    private Long fielderId; // For "CAUGHT" wicket
    private Long nextBatsmanId; // For when a wicket falls
    private Long nextBowlerId; // For end of over handling

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
    public Long getPlayerOutId() { return playerOutId; }
    public void setPlayerOutId(Long playerOutId) { this.playerOutId = playerOutId; }
    public Long getNextBatsmanId() { return nextBatsmanId; }
    public void setNextBatsmanId(Long nextBatsmanId) { this.nextBatsmanId = nextBatsmanId; }
    public Long getFielderId() { return fielderId; }
    public void setFielderId(Long fielderId) { this.fielderId = fielderId; }
    public Long getNextBowlerId() { return nextBowlerId; }
    public void setNextBowlerId(Long nextBowlerId) { this.nextBowlerId = nextBowlerId; }
}
