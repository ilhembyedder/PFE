package com.leasrecover.modules.cases.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEventResponse {
    private String eventType;
    private ZonedDateTime timestamp;
    private String actor;
    private String description;

    public HistoryEventResponse() {}

    public HistoryEventResponse(String eventType, ZonedDateTime timestamp, String actor, String description) {
        this.eventType = eventType;
        this.timestamp = timestamp;
        this.actor = actor;
        this.description = description;
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public ZonedDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(ZonedDateTime timestamp) { this.timestamp = timestamp; }
    public String getActor() { return actor; }
    public void setActor(String actor) { this.actor = actor; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public static HistoryEventResponseBuilder builder() {
        return new HistoryEventResponseBuilder();
    }

    public static class HistoryEventResponseBuilder {
        private String eventType;
        private ZonedDateTime timestamp;
        private String actor;
        private String description;

        public HistoryEventResponseBuilder eventType(String eventType) { this.eventType = eventType; return this; }
        public HistoryEventResponseBuilder timestamp(ZonedDateTime timestamp) { this.timestamp = timestamp; return this; }
        public HistoryEventResponseBuilder actor(String actor) { this.actor = actor; return this; }
        public HistoryEventResponseBuilder description(String description) { this.description = description; return this; }

        public HistoryEventResponse build() {
            return new HistoryEventResponse(eventType, timestamp, actor, description);
        }
    }
}
