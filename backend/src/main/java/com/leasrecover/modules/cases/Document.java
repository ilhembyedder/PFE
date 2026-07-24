package com.leasrecover.modules.cases;

import com.leasrecover._common.entity.BaseEntity;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.users.AppUser;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "document")
@Getter
@Setter
public class Document extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploader_id", nullable = false)
    private AppUser uploader;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id")
    private RecoveryCase recoveryCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contract_id")
    private Contract contract;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    /**
     * Stores the on-disk path relative to the configured upload root,
     * e.g. "{tenantId}/{storedFileName}".
     * The retrieval HTTP URL is derived at response-time using caseId and document id.
     */
    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "phase_uploaded_in")
    private String phaseUploadedIn;
}
