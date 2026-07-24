package com.leasrecover.modules.cases;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.config.FileStorageConfig;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.DocumentResponse;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.client.ClientRepository;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.contract.ContractRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.ZonedDateTime;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Service
public class DocumentUploadService {

    private static final Logger log = LoggerFactory.getLogger(DocumentUploadService.class);

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    private final FileStorageConfig fileStorageConfig;
    private final DocumentRepository documentRepository;
    private final RecoveryCaseRepository recoveryCaseRepository;
    private final AppUserRepository appUserRepository;
    private final AIValuationRepository aiValuationRepository;
    private final CaseAlertService caseAlertService;
    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final VehicleRepository vehicleRepository;
    private RestTemplate restTemplate;
    private final ExecutorService executorService = Executors.newVirtualThreadPerTaskExecutor();

    public void setRestTemplate(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Value("${app.ai-service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Value("${app.ai-service.webhook-url:http://localhost:8080/api/v1/internal/webhooks/ai-progress}")
    private String aiServiceWebhookUrl;

    public DocumentUploadService(
            FileStorageConfig fileStorageConfig,
            DocumentRepository documentRepository,
            RecoveryCaseRepository recoveryCaseRepository,
            AppUserRepository appUserRepository,
            AIValuationRepository aiValuationRepository,
            CaseAlertService caseAlertService,
            ClientRepository clientRepository,
            ContractRepository contractRepository,
            VehicleRepository vehicleRepository) {
        this.fileStorageConfig = fileStorageConfig;
        this.documentRepository = documentRepository;
        this.recoveryCaseRepository = recoveryCaseRepository;
        this.appUserRepository = appUserRepository;
        this.aiValuationRepository = aiValuationRepository;
        this.caseAlertService = caseAlertService;
        this.clientRepository = clientRepository;
        this.contractRepository = contractRepository;
        this.vehicleRepository = vehicleRepository;

        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Transactional
    public DocumentResponse storeDocument(UUID caseId, MultipartFile file, String phaseStr, String uploaderEmail) {
        return storeDocument(caseId, file, phaseStr, null, uploaderEmail);
    }

    @Transactional
    public DocumentResponse storeDocument(UUID caseId, MultipartFile file, String phaseStr, String tag, String uploaderEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (uploaderEmail == null || uploaderEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Uploader email is required");
        }

        // Validate GESTIONNAIRE role
        AppUser uploader = appUserRepository.findByEmailAndIsDeletedFalse(uploaderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Uploader not found"));

        if (!tenantId.equals(uploader.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Uploader does not belong to this tenant");
        }

        if (!"GESTIONNAIRE".equals(uploader.getRole()) && !"ADMIN".equals(uploader.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        // Validate recovery case existence and tenant ownership
        RecoveryCase recoveryCase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(recoveryCase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        // Validate file
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File size exceeds the 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "File type not allowed. Only PDF, JPEG, and PNG are permitted.");
        }

        // Determine extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate a secure storage filename using UUID
        String storedFileName = UUID.randomUUID().toString() + extension;

        // Build tenant-isolated path: {uploadDir}/{tenantId}/{storedFileName}
        Path uploadRoot = Paths.get(fileStorageConfig.getUploadDir()).toAbsolutePath().normalize();
        Path tenantDir = uploadRoot.resolve(tenantId.toString());
        Path targetPath = tenantDir.resolve(storedFileName);

        // Store the file to disk BEFORE committing the DB transaction
        try {
            Files.createDirectories(tenantDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store file on disk: " + e.getMessage());
        }

        // Persist document metadata; use relative path as fileUrl for internal storage reference
        // The HTTP retrieval URL will be derived at response-time using caseId and docId
        String relativeStoragePath = tenantId.toString() + "/" + storedFileName;

        Document document = new Document();
        document.setId(UuidCreator.createUuidV7());
        document.setTenantId(tenantId);
        document.setUploader(uploader);
        document.setRecoveryCase(recoveryCase);
        document.setFileName(originalFilename != null ? originalFilename : storedFileName);
        document.setFileUrl(relativeStoragePath);
        document.setPhaseUploadedIn(phaseStr);

        Document saved;
        try {
            saved = documentRepository.save(document);
        } catch (Exception e) {
            // Transactional consistency: remove orphaned disk file if DB save fails
            try {
                Files.deleteIfExists(targetPath);
                log.warn("Rolled back disk file after DB failure: {}", targetPath);
            } catch (IOException ioEx) {
                log.error("Failed to clean up orphaned file at {}: {}", targetPath, ioEx.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to persist document record: " + e.getMessage());
        }

        // Trigger AI Extraction if applicable
        if (isExpertiseReportTrigger(recoveryCase, phaseStr, tag, saved.getFileName())) {
            triggerAiExtraction(saved, file, recoveryCase);
        }

        recoveryCase.setLastActionAt(ZonedDateTime.now());
        recoveryCaseRepository.save(recoveryCase);
        caseAlertService.resolveDormancyAlert(caseId);

        return DocumentResponse.fromEntity(saved, caseId);
    }

    private boolean isExpertiseReportTrigger(RecoveryCase recoveryCase, String phaseStr, String tag, String fileName) {
        boolean isCaseInSaisiePhase = recoveryCase.getCurrentPhase() == RecoveryPhase.SAISIE;
        boolean isSaisiePhase = "SAISIE".equalsIgnoreCase(phaseStr) || "SAISIE_VEHICULE".equalsIgnoreCase(phaseStr);
        boolean isExpertiseTag = "EXPERTISE_REPORT".equalsIgnoreCase(tag);
        boolean isExpertiseFile = fileName != null && (
            fileName.toLowerCase().contains("expertise") || fileName.toLowerCase().contains("rapport")
        );
        return isCaseInSaisiePhase && isSaisiePhase && (isExpertiseTag || (tag == null && isExpertiseFile));
    }

    private void triggerAiExtraction(Document document, MultipartFile file, RecoveryCase recoveryCase) {
        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            log.error("Failed to read bytes from uploaded file: {}", e.getMessage());
            return;
        }

        AIValuation valuation = new AIValuation();
        valuation.setId(UuidCreator.createUuidV7());
        valuation.setTenantId(document.getTenantId());
        valuation.setRecoveryCase(recoveryCase);
        valuation.setDocument(document);
        valuation.setStatus("PENDING");

        final AIValuation savedValuation = aiValuationRepository.save(valuation);

        final UUID caseId = recoveryCase.getId();
        final UUID tenantId = document.getTenantId();
        final UUID valuationId = savedValuation.getId();
        final String originalFilename = document.getFileName();

        CompletableFuture.runAsync(() -> {
            try {
                // Establish tenant context in the virtual thread
                String schemaName = "tenant_" + tenantId.toString().replace("-", "");
                com.leasrecover.core.tenant.TenantContextHolder.setTenantId(schemaName);
                com.leasrecover.core.tenant.TenantContextHolder.setTenantUuid(tenantId);

                MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
                body.add("file", new ByteArrayResource(fileBytes) {
                    @Override
                    public String getFilename() {
                        return originalFilename;
                    }
                });
                body.add("caseId", caseId.toString());
                body.add("tenantId", tenantId.toString());
                body.add("webhookUrl", aiServiceWebhookUrl);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.MULTIPART_FORM_DATA);
                HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

                restTemplate.postForEntity(aiServiceUrl + "/api/extract", requestEntity, String.class);
            } catch (Exception e) {
                log.error("Failed to trigger AI extraction at FastAPI for caseId={}, valuationId={}: {}", 
                        caseId, valuationId, e.getMessage());
                try {
                    updateValuationStatus(valuationId, "FAILED");
                } catch (Exception ex) {
                    log.error("Failed to update AIValuation status to FAILED: {}", ex.getMessage());
                }
            } finally {
                com.leasrecover.core.tenant.TenantContextHolder.clear();
            }
        }, executorService);
    }

    private void updateValuationStatus(UUID valuationId, String status) {
        aiValuationRepository.findById(valuationId).ifPresent(val -> {
            val.setStatus(status);
            aiValuationRepository.save(val);
        });
    }

    /**
     * Fetch all documents for a given case.
     */
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsForCase(UUID caseId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase recoveryCase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(recoveryCase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        return documentRepository.findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(caseId)
                .stream()
                .map(doc -> DocumentResponse.fromEntity(doc, caseId))
                .collect(Collectors.toList());
    }

    /**
     * Resolve a file from local storage and return it as a Resource for streaming.
     *
     * @param caseId  The recovery case UUID
     * @param docId   The document UUID
     * @return        Spring Resource pointing to the file on disk
     */
    @Transactional(readOnly = true)
    public Resource loadDocumentAsResource(UUID caseId, UUID docId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase recoveryCase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(recoveryCase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (Boolean.TRUE.equals(document.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
        }

        if (!tenantId.equals(document.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Document does not belong to active tenant");
        }

        if (!caseId.equals(document.getRecoveryCase().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found for this case");
        }

        Path uploadRoot = Paths.get(fileStorageConfig.getUploadDir()).toAbsolutePath().normalize();
        Path filePath = uploadRoot.resolve(document.getFileUrl()).normalize();

        // Security: ensure the resolved path is within the upload root (prevent path traversal)
        if (!filePath.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Invalid file path");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on disk");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not resolve file path");
        }
    }

    /**
     * Get the original filename for a document (for Content-Disposition header).
     */
    @Transactional(readOnly = true)
    public String getDocumentOriginalFileName(UUID docId) {
        return documentRepository.findById(docId)
                .map(Document::getFileName)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
    }

    @Transactional
    public DocumentResponse storeEntityDocument(MultipartFile file, String entityType, UUID entityId, String uploaderEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (uploaderEmail == null || uploaderEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Uploader email is required");
        }

        // Validate GESTIONNAIRE role
        AppUser uploader = appUserRepository.findByEmailAndIsDeletedFalse(uploaderEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Uploader not found"));

        if (!tenantId.equals(uploader.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Uploader does not belong to this tenant");
        }

        if (!"GESTIONNAIRE".equals(uploader.getRole()) && !"ADMIN".equals(uploader.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        // Validate target entity existence and tenant ownership
        Client client = null;
        Contract contract = null;
        Vehicle vehicle = null;

        if ("client".equalsIgnoreCase(entityType)) {
            client = clientRepository.findById(entityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));
            if (!tenantId.equals(client.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Client does not belong to active tenant");
            }
        } else if ("contract".equalsIgnoreCase(entityType)) {
            contract = contractRepository.findById(entityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
            if (!tenantId.equals(contract.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Contract does not belong to active tenant");
            }
        } else if ("vehicle".equalsIgnoreCase(entityType)) {
            vehicle = vehicleRepository.findById(entityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
            if (!tenantId.equals(vehicle.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Vehicle does not belong to active tenant");
            }
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entity type: " + entityType);
        }

        // Validate file
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File size exceeds the 10MB limit");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    "File type not allowed. Only PDF, JPEG, and PNG are permitted.");
        }

        // Determine extension
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // Generate a secure storage filename using UUID
        String storedFileName = UUID.randomUUID().toString() + extension;

        // Build tenant-isolated path: {uploadDir}/{tenantId}/{storedFileName}
        Path uploadRoot = Paths.get(fileStorageConfig.getUploadDir()).toAbsolutePath().normalize();
        Path tenantDir = uploadRoot.resolve(tenantId.toString());
        Path targetPath = tenantDir.resolve(storedFileName);

        // Store the file to disk BEFORE committing the DB transaction
        try {
            Files.createDirectories(tenantDir);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to store file on disk: " + e.getMessage());
        }

        // Persist document metadata
        String relativeStoragePath = tenantId.toString() + "/" + storedFileName;

        Document document = new Document();
        document.setId(UuidCreator.createUuidV7());
        document.setTenantId(tenantId);
        document.setUploader(uploader);
        document.setRecoveryCase(null);
        document.setClient(client);
        document.setContract(contract);
        document.setVehicle(vehicle);
        document.setFileName(originalFilename != null ? originalFilename : storedFileName);
        document.setFileUrl(relativeStoragePath);
        document.setPhaseUploadedIn(null);

        Document saved;
        try {
            saved = documentRepository.save(document);
        } catch (Exception e) {
            // Transactional consistency: remove orphaned disk file if DB save fails
            try {
                Files.deleteIfExists(targetPath);
                log.warn("Rolled back disk file after DB failure: {}", targetPath);
            } catch (IOException ioEx) {
                log.error("Failed to clean up orphaned file at {}: {}", targetPath, ioEx.getMessage());
            }
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Failed to persist document record: " + e.getMessage());
        }

        return DocumentResponse.fromEntity(saved, null);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentsForEntity(String entityType, UUID entityId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        List<Document> docs;
        if ("client".equalsIgnoreCase(entityType)) {
            Client client = clientRepository.findById(entityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));
            if (!tenantId.equals(client.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Client does not belong to active tenant");
            }
            docs = documentRepository.findAllByClientIdAndIsDeletedFalseOrderByCreatedAtAsc(entityId);
        } else if ("contract".equalsIgnoreCase(entityType)) {
            Contract contract = contractRepository.findById(entityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));
            if (!tenantId.equals(contract.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Contract does not belong to active tenant");
            }
            docs = documentRepository.findAllByContractIdAndIsDeletedFalseOrderByCreatedAtAsc(entityId);
        } else if ("vehicle".equalsIgnoreCase(entityType)) {
            Vehicle vehicle = vehicleRepository.findById(entityId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found"));
            if (!tenantId.equals(vehicle.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Vehicle does not belong to active tenant");
            }
            docs = documentRepository.findAllByVehicleIdAndIsDeletedFalseOrderByCreatedAtAsc(entityId);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid entity type: " + entityType);
        }

        return docs.stream()
                .map(doc -> DocumentResponse.fromEntity(doc, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Resource loadDocumentAsResource(UUID docId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        Document document = documentRepository.findById(docId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (Boolean.TRUE.equals(document.getIsDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
        }

        if (!tenantId.equals(document.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Document does not belong to active tenant");
        }

        Path uploadRoot = Paths.get(fileStorageConfig.getUploadDir()).toAbsolutePath().normalize();
        Path filePath = uploadRoot.resolve(document.getFileUrl()).normalize();

        // Security: ensure the resolved path is within the upload root (prevent path traversal)
        if (!filePath.startsWith(uploadRoot)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Invalid file path");
        }

        try {
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found on disk");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not resolve file path");
        }
    }
}
