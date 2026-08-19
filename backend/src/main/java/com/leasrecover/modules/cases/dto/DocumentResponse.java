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

    public DocumentResponse() {}

    public DocumentResponse(UUID id, String fileName, String fileUrl, String phaseUploadedIn, String uploaderName, ZonedDateTime createdAt) {
        this.id = id;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.phaseUploadedIn = phaseUploadedIn;
        this.uploaderName = uploaderName;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
    public String getPhaseUploadedIn() { return phaseUploadedIn; }
    public void setPhaseUploadedIn(String phaseUploadedIn) { this.phaseUploadedIn = phaseUploadedIn; }
    public String getUploaderName() { return uploaderName; }
    public void setUploaderName(String uploaderName) { this.uploaderName = uploaderName; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }

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
