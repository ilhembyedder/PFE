package com.leasrecover.modules.cases.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NoteCreateRequest {

    @NotBlank(message = "Note content is required")
    private String content;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
