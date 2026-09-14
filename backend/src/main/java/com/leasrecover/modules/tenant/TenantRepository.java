package com.leasrecover.modules.tenant;
 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.ZonedDateTime;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {

    @Modifying
    @Query("UPDATE Tenant t SET t.status = :status, t.updatedAt = :updatedAt WHERE t.id = :id")
    int updateTenantStatus(@Param("id") UUID id, @Param("status") String status, @Param("updatedAt") ZonedDateTime updatedAt);
}
