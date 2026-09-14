package com.leasrecover.modules.cases;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.cases.dto.*;
import jakarta.validation.Valid;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.util.UUID;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.leasrecover.modules.notification.ValuationProgressService;
import com.leasrecover.modules.notification.AiProgressPayload;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

@RestController
@RequestMapping("/api/v1/cases")
public class CaseController {

    private final CaseService caseService;
    private final CaseHistoryService caseHistoryService;
    private final PdfExportService pdfExportService;
    private final DocumentUploadService documentUploadService;
    private final ValuationProgressService valuationProgressService;
    private final AIValuationService aiValuationService;
    private final boolean allowHeaderFallback;

    public CaseController(
            CaseService caseService,
            CaseHistoryService caseHistoryService,
            PdfExportService pdfExportService,
            DocumentUploadService documentUploadService,
            ValuationProgressService valuationProgressService,
            AIValuationService aiValuationService,
            @Value("${app.security.allow-header-fallback:true}") boolean allowHeaderFallback) {
        this.caseService = caseService;
        this.caseHistoryService = caseHistoryService;
        this.pdfExportService = pdfExportService;
        this.documentUploadService = documentUploadService;
        this.valuationProgressService = valuationProgressService;
        this.aiValuationService = aiValuationService;
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

    @PostMapping
    public ResponseEntity<JSendResponse<CaseResponse>> createCase(
            @RequestBody @Valid CaseCreateRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        CaseResponse response = caseService.createCase(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<JSendResponse<Page<CaseListResponse>>> getCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sortBy,
            @RequestParam(required = false) String phase,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String alertLevel,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        String email = resolveUserEmail(userEmail);
        
        Sort sort = Sort.unsorted();
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            String[] parts = sortBy.split(",");
            String property = parts[0];
            Sort.Direction direction = Sort.Direction.ASC;
            if (parts.length > 1 && "desc".equalsIgnoreCase(parts[1])) {
                direction = Sort.Direction.DESC;
            }
            
            String sortProperty = property;
            if ("clientName".equals(property)) {
                sortProperty = "contract.client.fullNameOrCompany";
            } else if ("contractReference".equals(property)) {
                sortProperty = "contract.referenceNumber";
            } else if ("assigneeName".equals(property)) {
                sortProperty = "assignee.firstName";
            } else if ("currentPhase".equals(property)) {
                sortProperty = "currentPhase";
            } else if ("reliabilityIndicator".equals(property)) {
                sortProperty = "createdAt"; // fallback
            }
            
            sort = Sort.by(direction, sortProperty);
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CaseListResponse> response = caseService.getCases(pageable, phase, status, alertLevel, email);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JSendResponse<CaseResponse>> getCase(@PathVariable UUID id) {
        CaseResponse response = caseService.getCase(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JSendResponse<CaseResponse>> updateCase(
            @PathVariable UUID id,
            @RequestBody @Valid CaseUpdateRequest request) {
        CaseResponse response = caseService.updateCase(id, request);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<JSendResponse<CaseResponse>> assignCase(
            @PathVariable UUID id,
            @RequestBody @Valid AssignCaseRequest request) {
        CaseResponse response = caseService.assignCase(id, request.getAssigneeId());
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/assignees")
    public ResponseEntity<JSendResponse<List<AssigneeResponse>>> getAssignees() {
        List<AssigneeResponse> response = caseService.getAssignees();
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<JSendResponse<NoteResponse>> addNote(
            @PathVariable UUID id,
            @RequestBody @Valid NoteCreateRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        NoteResponse response = caseService.addNote(id, request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<JSendResponse<List<NoteResponse>>> getNotes(@PathVariable UUID id) {
        List<NoteResponse> response = caseService.getNotes(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<JSendResponse<List<HistoryEventResponse>>> getCaseHistory(@PathVariable UUID id) {
        List<HistoryEventResponse> response = caseHistoryService.getCaseHistory(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> exportCasePdf(@PathVariable UUID id) {
        byte[] pdfBytes = pdfExportService.generateCasePdf(id);
        
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_PDF);
        headers.setContentDisposition(org.springframework.http.ContentDisposition.attachment()
                .filename("dossier-history-" + id + ".pdf")
                .build());
                
        return new ResponseEntity<>(pdfBytes, headers, org.springframework.http.HttpStatus.OK);
    }

    @PostMapping("/{id}/next-phase")
    public ResponseEntity<JSendResponse<CaseResponse>> advanceCasePhase(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        CaseResponse response = caseService.advancePhase(id, email);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}/prerequisites")
    public ResponseEntity<JSendResponse<CasePrerequisitesResponse>> getCasePrerequisites(
            @PathVariable UUID id) {
        CasePrerequisitesResponse response = caseService.getPrerequisites(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/alerts")
    public ResponseEntity<JSendResponse<List<CaseAlertResponse>>> getUnresolvedAlerts() {
        List<CaseAlertResponse> response = caseService.getUnresolvedAlerts();
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}/alerts")
    public ResponseEntity<JSendResponse<List<CaseAlertResponse>>> getUnresolvedAlertsForCase(
            @PathVariable UUID id) {
        List<CaseAlertResponse> response = caseService.getUnresolvedAlertsForCase(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    // -------------------------------------------------------------------------
    // Document Vault Endpoints (Story 4.4)
    // -------------------------------------------------------------------------

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<JSendResponse<DocumentResponse>> uploadDocument(
            @PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("phase") String phase,
            @RequestParam(value = "tag", required = false) String tag,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        DocumentResponse response = documentUploadService.storeDocument(id, file, phase, tag, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping("/{id}/documents")
    public ResponseEntity<JSendResponse<List<DocumentResponse>>> getDocuments(
            @PathVariable UUID id) {
        List<DocumentResponse> response = documentUploadService.getDocumentsForCase(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @DeleteMapping("/{id}/documents/{docId}")
    public ResponseEntity<JSendResponse<Void>> deleteDocument(
            @PathVariable UUID id,
            @PathVariable UUID docId) {
        documentUploadService.deleteDocument(id, docId);
        return ResponseEntity.ok(JSendResponse.success(null));
    }

    @GetMapping("/{id}/documents/{docId}/download")
    public ResponseEntity<Resource> downloadDocument(
            @PathVariable UUID id,
            @PathVariable UUID docId) {
        Resource resource = documentUploadService.loadDocumentAsResource(id, docId);
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

    @GetMapping(value = "/{id}/valuation-progress", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter getValuationProgress(@PathVariable UUID id) {
        return valuationProgressService.registerEmitter(id);
    }

    @GetMapping("/{id}/valuation")
    public ResponseEntity<JSendResponse<CaseValuationResponse>> getCaseValuation(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        CaseValuationResponse response = aiValuationService.getValuationByCaseId(id, email);
        return ResponseEntity.ok(JSendResponse.success(response));
    }
}

@RestController
@RequestMapping("/api/v1/internal/webhooks")
class InternalWebhookController {
    private final AIValuationService aiValuationService;

    public InternalWebhookController(AIValuationService aiValuationService) {
        this.aiValuationService = aiValuationService;
    }

    @PostMapping("/ai-progress")
    public ResponseEntity<Void> handleAiProgressWebhook(@RequestBody AiProgressPayload payload) {
        UUID tenantId = payload.getTenantId();
        String schemaName = "tenant_" + tenantId.toString().replace("-", "");
        try {
            com.leasrecover.core.tenant.TenantContextHolder.setTenantId(schemaName);
            com.leasrecover.core.tenant.TenantContextHolder.setTenantUuid(tenantId);

            aiValuationService.processWebhookCallback(payload);

            return ResponseEntity.ok().build();
        } finally {
            com.leasrecover.core.tenant.TenantContextHolder.clear();
        }
    }
}

@RestController
@RequestMapping("/api/v1/dashboard/alerts")
class DashboardAlertController {
    private final CaseService caseService;
    private final boolean allowHeaderFallback;

    public DashboardAlertController(
            CaseService caseService,
            @Value("${app.security.allow-header-fallback:true}") boolean allowHeaderFallback) {
        this.caseService = caseService;
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

    @GetMapping("/priority")
    public ResponseEntity<JSendResponse<List<PriorityAlertResponse>>> getPriorityAlerts(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String email = resolveUserEmail(userEmail);
        List<PriorityAlertResponse> response = caseService.getPriorityAlerts(email);
        return ResponseEntity.ok(JSendResponse.success(response));
    }
}
