package com.leasrecover.modules.cases;

import com.leasrecover._common.entity.BaseEntity;
import com.leasrecover.modules.users.AppUser;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Entity
@Table(name = "note")
@Getter
@Setter
public class Note extends BaseEntity {

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private RecoveryCase recoveryCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private AppUser author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;
}
