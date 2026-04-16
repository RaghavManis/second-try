package com.cricket.tournament.dto;

public class StreamConfigDto {
    private String streamUrl;
    private Integer streamDelaySeconds;

    public StreamConfigDto() {}

    public StreamConfigDto(String streamUrl, Integer streamDelaySeconds) {
        this.streamUrl = streamUrl;
        this.streamDelaySeconds = streamDelaySeconds != null ? streamDelaySeconds : 0;
    }

    public String getStreamUrl() {
        return streamUrl;
    }

    public void setStreamUrl(String streamUrl) {
        this.streamUrl = streamUrl;
    }

    public Integer getStreamDelaySeconds() {
        return streamDelaySeconds;
    }

    public void setStreamDelaySeconds(Integer streamDelaySeconds) {
        this.streamDelaySeconds = streamDelaySeconds;
    }
}
