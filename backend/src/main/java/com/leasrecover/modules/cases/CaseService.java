package com.leasrecover.modules.cases;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.*;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.client.ClientRepository;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.contract.ContractRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.notification.EmailService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
public class CaseService {

    private final ClientRepository clientRepository;
    private final ContractRepository contractRepository;
    private final VehicleRepository vehicleRepository;
    private final RecoveryCaseRepository recoveryCaseRepository;
    private final AppUserRepository appUserRepository;
    private final NoteRepository noteRepository;
    private final CasePrerequisiteService casePrerequisiteService;
    private final CaseAlertRepository caseAlertRepository;
    private final AIValuationRepository aiValuationRepository;
    private final CaseAlertService caseAlertService;
    private final TenantRepository tenantRepository;
    private final EmailService emailService;

    public CaseService(
            ClientRepository clientRepository,
            ContractRepository contractRepository,
            VehicleRepository vehicleRepository,
            RecoveryCaseRepository recoveryCaseRepository,
            AppUserRepository appUserRepository,
            NoteRepository noteRepository,
            CasePrerequisiteService casePrerequisiteService,
            CaseAlertRepository caseAlertRepository,
            AIValuationRepository aiValuationRepository,
            CaseAlertService caseAlertService,
            TenantRepository tenantRepository,
            EmailService emailService) {
        this.clientRepository = clientRepository;
        this.contractRepository = contractRepository;
        this.vehicleRepository = vehicleRepository;
        this.recoveryCaseRepository = recoveryCaseRepository;
        this.appUserRepository = appUserRepository;
        this.noteRepository = noteRepository;
        this.casePrerequisiteService = casePrerequisiteService;
        this.caseAlertRepository = caseAlertRepository;
        this.aiValuationRepository = aiValuationRepository;
        this.caseAlertService = caseAlertService;
        this.tenantRepository = tenantRepository;
        this.emailService = emailService;
    }

    @Transactional
    public CaseResponse createCase(CaseCreateRequest request, String userEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User email header is missing");
        }

        AppUser user = appUserRepository.findByEmailAndIsDeletedFalse(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"GESTIONNAIRE".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        // 1. Find or create Client
        Client client = null;
        if (request.getClientRegistrationNumber() != null && !request.getClientRegistrationNumber().trim().isEmpty()) {
            client = clientRepository.findFirstByRegistrationNumberAndIsDeletedFalse(request.getClientRegistrationNumber()).orElse(null);
        }
        if (client == null && request.getClientContactEmail() != null && !request.getClientContactEmail().trim().isEmpty()) {
            client = clientRepository.findFirstByContactEmailAndIsDeletedFalse(request.getClientContactEmail()).orElse(null);
        }

        if (client == null) {
            client = new Client();
            client.setId(UuidCreator.createUuidV7());
            client.setTenantId(tenantId);
            client.setIsDeleted(false);
        }
        client.setFullNameOrCompany(request.getClientFullName());
        client.setRegistrationNumber(request.getClientRegistrationNumber());
        client.setContactEmail(request.getClientContactEmail());
        client.setContactPhone(request.getClientContactPhone());
        client.setAddress(request.getClientAddress());
        Client savedClient = clientRepository.save(client);

        // 2. Find or create Contract
        Contract contract = contractRepository.findByReferenceNumberAndTenantIdAndIsDeletedFalse(
                request.getContractReferenceNumber(), tenantId).orElse(null);

        if (contract == null) {
            contract = new Contract();
            contract.setId(UuidCreator.createUuidV7());
            contract.setTenantId(tenantId);
            contract.setReferenceNumber(request.getContractReferenceNumber());
            contract.setIsDeleted(false);
        }
        contract.setClient(savedClient);
        contract.setStartDate(request.getContractStartDate());
        contract.setEndDate(request.getContractEndDate());
        contract.setStatus(request.getContractStatus());
        Contract savedContract = contractRepository.save(contract);

        // 3. Find or create Vehicle
        Vehicle vehicle = vehicleRepository.findByContract(savedContract).orElse(null);

        if (vehicle == null) {
            vehicle = new Vehicle();
            vehicle.setId(UuidCreator.createUuidV7());
            vehicle.setTenantId(tenantId);
            vehicle.setContract(savedContract);
            vehicle.setIsDeleted(false);
        }
        vehicle.setVin(request.getVehicleVin());
        vehicle.setLicensePlate(request.getVehicleLicensePlate());
        vehicle.setBrand(request.getVehicleBrand());
        vehicle.setModel(request.getVehicleModel());
        vehicle.setYear(request.getVehicleYear());
        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        // 4. Create and save RecoveryCase
        ZonedDateTime now = ZonedDateTime.now();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UuidCreator.createUuidV7());
        rcase.setTenantId(tenantId);
        rcase.setAssignee(user);
        rcase.setContract(savedContract);
        rcase.setInitialResidualValueCents(request.getInitialResidualValueCents());
        rcase.setCurrencyCode(request.getCurrencyCode() != null ? request.getCurrencyCode() : "TND");
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
        rcase.setPhaseStartedAt(now);
        rcase.setLastActionAt(now);
        rcase.setStatus("ACTIVE");
        RecoveryCase savedCase = recoveryCaseRepository.save(rcase);

        return CaseResponse.fromEntity(savedCase, savedVehicle);
    }

    @Transactional(readOnly = true)
    public CaseResponse getCase(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        Vehicle vehicle = vehicleRepository.findByContract(rcase.getContract()).orElse(null);
        return CaseResponse.fromEntity(rcase, vehicle);
    }

    @Transactional
    public CaseResponse updateCase(UUID id, CaseUpdateRequest request) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        rcase.setInitialResidualValueCents(request.getInitialResidualValueCents());
        rcase.setCurrencyCode(request.getCurrencyCode());

        Contract contract = rcase.getContract();
        if (contract != null) {
            if (!tenantId.equals(contract.getTenantId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Contract does not belong to active tenant");
            }
            contract.setReferenceNumber(request.getContractReferenceNumber());
            contractRepository.save(contract);

            Client client = contract.getClient();
            if (client != null) {
                if (!tenantId.equals(client.getTenantId())) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Client does not belong to active tenant");
                }
                client.setFullNameOrCompany(request.getClientFullName());
                clientRepository.save(client);
            }
        }

        rcase.setLastActionAt(ZonedDateTime.now());
        RecoveryCase savedCase = recoveryCaseRepository.save(rcase);
        caseAlertService.resolveDormancyAlert(id);

        Vehicle vehicle = vehicleRepository.findByContract(savedCase.getContract()).orElse(null);
        return CaseResponse.fromEntity(savedCase, vehicle);
    }

    @Transactional
    public CaseResponse assignCase(UUID id, UUID assigneeId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        AppUser assignee = appUserRepository.findById(assigneeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignee user not found"));

        if (!tenantId.equals(assignee.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Assignee does not belong to active tenant");
        }

        if (!"GESTIONNAIRE".equals(assignee.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Assignee must be a GESTIONNAIRE");
        }

        rcase.setAssignee(assignee);
        rcase.setLastActionAt(ZonedDateTime.now());
        RecoveryCase savedCase = recoveryCaseRepository.save(rcase);
        caseAlertService.resolveDormancyAlert(id);

        Vehicle vehicle = vehicleRepository.findByContract(savedCase.getContract()).orElse(null);
        return CaseResponse.fromEntity(savedCase, vehicle);
    }

    @Transactional(readOnly = true)
    public List<AssigneeResponse> getAssignees() {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }
        List<AppUser> users = appUserRepository.findAllByTenantIdAndRoleAndIsDeletedFalse(tenantId, "GESTIONNAIRE");
        return users.stream().map(AssigneeResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public NoteResponse addNote(UUID caseId, NoteCreateRequest request, String authorEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        AppUser author = appUserRepository.findByEmailAndIsDeletedFalse(authorEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Author user not found"));

        if (!tenantId.equals(author.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Author does not belong to active tenant");
        }

        Note note = new Note();
        note.setId(UuidCreator.createUuidV7());
        note.setTenantId(tenantId);
        note.setRecoveryCase(rcase);
        note.setAuthor(author);
        note.setContent(request.getContent());

        Note savedNote = noteRepository.save(note);

        rcase.setLastActionAt(ZonedDateTime.now());
        recoveryCaseRepository.save(rcase);
        caseAlertService.resolveDormancyAlert(caseId);

        return NoteResponse.fromEntity(savedNote);
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getNotes(UUID caseId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        List<Note> notes = noteRepository.findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(caseId);
        return notes.stream().map(NoteResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public CaseResponse advancePhase(UUID id, String userEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User email is missing");
        }

        AppUser user = appUserRepository.findByEmailAndIsDeletedFalse(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"GESTIONNAIRE".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        RecoveryPhase nextPhase = rcase.getCurrentPhase().getNextPhase();
        List<String> unsatisfied = casePrerequisiteService.checkPrerequisites(rcase, nextPhase);
        if (!unsatisfied.isEmpty()) {
            throw new PrerequisiteNotMetException(unsatisfied);
        }
        rcase.setCurrentPhase(nextPhase);

        ZonedDateTime now = ZonedDateTime.now();
        rcase.setPhaseStartedAt(now);
        rcase.setLastActionAt(now);

        RecoveryCase savedCase = recoveryCaseRepository.save(rcase);
        caseAlertService.resolveDeadlineAlert(id);

        if (nextPhase == RecoveryPhase.MISE_EN_DEMEURE) {
            try {
                Client client = savedCase.getContract() != null ? savedCase.getContract().getClient() : null;
                String clientEmail = client != null ? client.getContactEmail() : null;

                if (clientEmail != null && !clientEmail.trim().isEmpty()) {
                    Tenant tenant = tenantRepository.findById(tenantId).orElse(null);
                    String tenantName = tenant != null ? tenant.getName() : "LeasRecover";

                    List<AppUser> admins = appUserRepository.findAllByTenantIdAndRoleAndIsDeletedFalse(tenantId, "ADMIN");
                    String fromEmail = null;
                    if (!admins.isEmpty()) {
                        fromEmail = admins.get(0).getEmail();
                    } else {
                        fromEmail = "contact@" + tenantName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase() + ".com";
                    }

                    String subject = String.format("Mise en demeure - Contrat %s",
                            savedCase.getContract() != null ? savedCase.getContract().getReferenceNumber() : "");
                    String body = String.format(
                            "Bonjour %s,\n\n" +
                            "Nous vous informons que votre dossier de recouvrement lié au contrat %s est passé à la phase : Mise en demeure.\n" +
                            "Veuillez régulariser votre situation dans les plus brefs délais.\n\n" +
                            "Cordialement,\n" +
                            "L'équipe %s",
                            client.getFullNameOrCompany() != null ? client.getFullNameOrCompany() : "Client",
                            savedCase.getContract() != null ? savedCase.getContract().getReferenceNumber() : "",
                            tenantName
                    );

                    emailService.sendEmail(fromEmail, clientEmail, subject, body);
                } else {
                    org.slf4j.LoggerFactory.getLogger(CaseService.class)
                            .warn("Client email not found for case ID {}. Email notification skipped.", id);
                }
            } catch (Exception e) {
                org.slf4j.LoggerFactory.getLogger(CaseService.class)
                        .error("Error preparing/sending email notification for case ID {}: {}", id, e.getMessage(), e);
            }
        }

        Vehicle vehicle = vehicleRepository.findByContract(savedCase.getContract()).orElse(null);
        return CaseResponse.fromEntity(savedCase, vehicle);
    }

    @Transactional(readOnly = true)
    public CasePrerequisitesResponse getPrerequisites(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        RecoveryCase rcase = recoveryCaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));

        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }

        RecoveryPhase nextPhase = null;
        boolean isBlocked = false;
        List<String> missingPrerequisites = new ArrayList<>();

        try {
            nextPhase = rcase.getCurrentPhase().getNextPhase();
            missingPrerequisites = casePrerequisiteService.checkPrerequisites(rcase, nextPhase);
            isBlocked = !missingPrerequisites.isEmpty();
        } catch (IllegalStateException e) {
            // Current phase is CLOTURE, there is no next phase
            nextPhase = null;
            isBlocked = false;
        }

        return new CasePrerequisitesResponse(
            nextPhase != null ? nextPhase.name() : null,
            isBlocked,
            missingPrerequisites
        );
    }

    @Transactional(readOnly = true)
    public List<CaseAlertResponse> getUnresolvedAlerts() {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }
        return caseAlertRepository.findAllByTenantIdAndIsResolvedFalse(tenantId).stream()
                .map(CaseAlertResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CaseAlertResponse> getUnresolvedAlertsForCase(UUID caseId) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }
        RecoveryCase rcase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Case not found"));
        if (!tenantId.equals(rcase.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Case does not belong to active tenant");
        }
        return caseAlertRepository.findAllByCaseIdAndIsResolvedFalse(caseId).stream()
                .map(CaseAlertResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PriorityAlertResponse> getPriorityAlerts(String userEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User email is missing");
        }

        AppUser user = appUserRepository.findByEmailAndIsDeletedFalse(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"GESTIONNAIRE".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        List<CaseAlert> alerts = caseAlertRepository.findAllByTenantIdAndIsResolvedFalse(tenantId);

        return alerts.stream()
                .sorted((a1, a2) -> {
                    int c1 = "CRITICAL".equalsIgnoreCase(a1.getCriticality()) ? 0 : 1;
                    int c2 = "CRITICAL".equalsIgnoreCase(a2.getCriticality()) ? 0 : 1;
                    if (c1 != c2) {
                        return Integer.compare(c1, c2);
                    }
                    if (a1.getCreatedAt() != null && a2.getCreatedAt() != null) {
                        return a1.getCreatedAt().compareTo(a2.getCreatedAt());
                    }
                    return 0;
                })
                .limit(5)
                .map(alert -> {
                    PriorityAlertResponse response = new PriorityAlertResponse();
                    response.setAlertId(alert.getId());
                    response.setCaseId(alert.getCaseId());
                    response.setAlertType(alert.getAlertType());
                    response.setCriticality(alert.getCriticality());
                    response.setMessage(alert.getMessage());
                    response.setCreatedAt(alert.getCreatedAt());

                    recoveryCaseRepository.findById(alert.getCaseId()).ifPresent(rcase -> {
                        if (rcase.getContract() != null) {
                            response.setContractReference(rcase.getContract().getReferenceNumber());
                            if (rcase.getContract().getClient() != null) {
                                response.setClientName(rcase.getContract().getClient().getFullNameOrCompany());
                            }
                        }
                    });
                    return response;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CaseListResponse> getCases(Pageable pageable, String phase, String status, String alertLevel, String userEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User email is missing");
        }

        AppUser user = appUserRepository.findByEmailAndIsDeletedFalse(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"GESTIONNAIRE".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        org.springframework.data.jpa.domain.Specification<RecoveryCase> spec =
                CaseSpecification.filterCases(phase, status, alertLevel);

        Page<RecoveryCase> page = recoveryCaseRepository.findAll(spec, pageable);

        List<UUID> caseIds = page.getContent().stream()
                .map(RecoveryCase::getId)
                .collect(Collectors.toList());

        java.util.Map<UUID, String> reliabilityIndicators = new java.util.HashMap<>();
        if (!caseIds.isEmpty()) {
            List<AIValuation> valuations = aiValuationRepository.findByRecoveryCaseIdInAndStatus(caseIds, "SUCCESS");
            for (AIValuation valuation : valuations) {
                UUID caseId = valuation.getRecoveryCase().getId();
                reliabilityIndicators.merge(caseId, valuation.getReliabilityIndicator(), (oldVal, newVal) -> {
                    AIValuation oldValuation = valuations.stream()
                            .filter(v -> v.getRecoveryCase().getId().equals(caseId) && v.getReliabilityIndicator().equals(oldVal))
                            .findFirst().orElse(null);
                    if (oldValuation != null && valuation.getCreatedAt() != null && oldValuation.getCreatedAt() != null) {
                        return valuation.getCreatedAt().isAfter(oldValuation.getCreatedAt()) ? newVal : oldVal;
                    }
                    return newVal;
                });
            }
        }

        return page.map(rcase -> {
            CaseListResponse response = new CaseListResponse();
            response.setId(rcase.getId());
            response.setClientName(rcase.getContract() != null && rcase.getContract().getClient() != null ?
                    rcase.getContract().getClient().getFullNameOrCompany() : null);
            response.setContractReference(rcase.getContract() != null ? rcase.getContract().getReferenceNumber() : null);
            response.setCurrentPhase(rcase.getCurrentPhase() != null ? rcase.getCurrentPhase().name() : null);
            response.setAssigneeName(rcase.getAssignee() != null ?
                    rcase.getAssignee().getFirstName() + " " + rcase.getAssignee().getLastName() : null);
            response.setReliabilityIndicator(reliabilityIndicators.get(rcase.getId()));
            response.setLastActionAt(rcase.getLastActionAt());
            response.setCreatedAt(rcase.getCreatedAt());
            return response;
        });
    }
}

