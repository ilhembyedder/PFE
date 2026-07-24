package com.leasrecover.modules.cases.dto;

import com.leasrecover.modules.cases.Document;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private UUID id;
    private String fileName;

    /**
     * The HTTP endpoint URL for downloading this document.
     * Format: /api/v1/cases/{caseId}/documents/{docId}/download
     */
    private String fileUrl;

    private String phaseUploadedIn;
    private String uploaderName;
    private ZonedDateTime createdAt;

    public static DocumentResponse fromEntity(Document doc, UUID caseId) {
        DocumentResponse response = new DocumentResponse();
        response.setId(doc.getId());
        response.setFileName(doc.getFileName());
        // Construct the retrieval URL from caseId and document id
        if (caseId != null) {
            response.setFileUrl("/api/v1/cases/" + caseId + "/documents/" + doc.getId() + "/download");
        } else {
            response.setFileUrl("/api/v1/documents/" + doc.getId() + "/download");
        }
        response.setPhaseUploadedIn(doc.getPhaseUploadedIn());

        if (doc.getUploader() != null) {
            response.setUploaderName(doc.getUploader().getFirstName() + " " + doc.getUploader().getLastName());
        }
        response.setCreatedAt(doc.getCreatedAt());
        return response;
    }
}
