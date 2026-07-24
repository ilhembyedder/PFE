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
