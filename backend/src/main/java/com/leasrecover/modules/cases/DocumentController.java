package com.leasrecover.modules.cases;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.cases.dto.DocumentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/documents")
public class DocumentController {

    private final DocumentUploadService documentUploadService;
    private final boolean allowHeaderFallback;

    public DocumentController(
            DocumentUploadService documentUploadService,
            @Value("${app.security.allow-header-fallback:true}") boolean allowHeaderFallback) {
        this.documentUploadService = documentUploadService;
        this.allowHeaderFallback = allowHeaderFallback;
    }

    private String resolveUserEmail(String headerEmail) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String email = null;
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof com.leasrecover.modules.auth.UserPrincipal userPrincipal) {
                email = userPrincipal.getEmail();
            } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
                email = userDetails.getUsername();
            } else if (principal instanceof String principalString && !"anonymousUser".equals(principalString)) {
                email = principalString;
            }
        }
        if (email == null || email.trim().isEmpty()) {
            if (allowHeaderFallback) {
                email = headerEmail;
            }
        }
        return email;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<JSendResponse<DocumentResponse>> uploadEntityDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") UUID entityId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        DocumentResponse response = documentUploadService.storeEntityDocument(file, entityType, entityId, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<JSendResponse<List<DocumentResponse>>> getEntityDocuments(
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") UUID entityId) {
        List<DocumentResponse> response = documentUploadService.getDocumentsForEntity(entityType, entityId);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{docId}/download")
    public ResponseEntity<Resource> downloadEntityDocument(@PathVariable UUID docId) {
        Resource resource = documentUploadService.loadDocumentAsResource(docId);
        String originalFileName = documentUploadService.getDocumentOriginalFileName(docId);

        // Determine content type from filename extension
        String contentType = "application/octet-stream";
        if (originalFileName != null) {
            String lower = originalFileName.toLowerCase();
            if (lower.endsWith(".pdf")) {
                contentType = "application/pdf";
            } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
                contentType = "image/jpeg";
            } else if (lower.endsWith(".png")) {
                contentType = "image/png";
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + (originalFileName != null ? originalFileName : docId.toString()) + "\"")
                .body(resource);
    }
}
