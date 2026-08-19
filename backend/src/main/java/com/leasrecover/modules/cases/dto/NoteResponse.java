package com.leasrecover.modules.cases.dto;

import com.leasrecover.modules.cases.Note;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class NoteResponse {
    private UUID id;
    private UUID caseId;
    private String authorName;
    private String content;
    private ZonedDateTime createdAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getCaseId() { return caseId; }
    public void setCaseId(UUID caseId) { this.caseId = caseId; }
    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

    public static NoteResponse fromEntity(Note note) {
        NoteResponse response = new NoteResponse();
        response.setId(note.getId());
        if (note.getRecoveryCase() != null) {
            response.setCaseId(note.getRecoveryCase().getId());
        }
        if (note.getAuthor() != null) {
            response.setAuthorName(note.getAuthor().getFirstName() + " " + note.getAuthor().getLastName());
        }
        response.setContent(note.getContent());
        response.setCreatedAt(note.getCreatedAt());
        return response;
    }
}
