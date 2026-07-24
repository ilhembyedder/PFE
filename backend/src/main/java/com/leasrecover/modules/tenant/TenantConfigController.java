package com.leasrecover.modules.tenant;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.dto.TenantConfigRequest;
import com.leasrecover.modules.tenant.dto.TenantConfigResponse;
import com.leasrecover.modules.tenant.dto.ThresholdResponse;
import com.leasrecover.modules.tenant.dto.ThresholdUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tenant/config")
public class TenantConfigController {

    private final TenantConfigRepository tenantConfigRepository;

    public TenantConfigController(TenantConfigRepository tenantConfigRepository) {
        this.tenantConfigRepository = tenantConfigRepository;
    }

    @GetMapping
    public ResponseEntity<JSendResponse<TenantConfigResponse>> getTenantConfig() {
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            return ResponseEntity.badRequest().body(JSendResponse.fail(null));
        }

        TenantConfig config = tenantConfigRepository.findById(tenantUuid)
                .orElseGet(() -> createAndSaveDefaultConfig(tenantUuid));

        TenantConfigResponse response = new TenantConfigResponse(
                config.getTenantId(),
                config.getDormancyThresholdDays(),
                config.getPhaseLegalDelays()
        );

        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping
    public ResponseEntity<JSendResponse<TenantConfigResponse>> updateTenantConfig(
            @Valid @RequestBody TenantConfigRequest request) {
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            return ResponseEntity.badRequest().body(JSendResponse.fail(null));
        }

        TenantConfig config = tenantConfigRepository.findById(tenantUuid)
                .orElseGet(() -> createDefaultConfigInstance(tenantUuid));

        config.setDormancyThresholdDays(request.getDormancyThresholdDays());
        config.setPhaseLegalDelays(request.getPhaseLegalDelays());

        TenantConfig savedConfig = tenantConfigRepository.save(config);

        TenantConfigResponse response = new TenantConfigResponse(
                savedConfig.getTenantId(),
                savedConfig.getDormancyThresholdDays(),
                savedConfig.getPhaseLegalDelays()
        );

        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/thresholds")
    public ResponseEntity<JSendResponse<ThresholdResponse>> getThresholds() {
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            return ResponseEntity.badRequest().body(JSendResponse.fail(null));
        }

        TenantConfig config = tenantConfigRepository.findById(tenantUuid)
                .orElseGet(() -> createAndSaveDefaultConfig(tenantUuid));

        ThresholdResponse response = new ThresholdResponse(
                config.getTenantId(),
                config.getAiDeviationModerate(),
                config.getAiDeviationCritical()
        );

        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/thresholds")
    public ResponseEntity<JSendResponse<ThresholdResponse>> updateThresholds(
            @Valid @RequestBody ThresholdUpdateRequest request) {
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            return ResponseEntity.badRequest().body(JSendResponse.fail(null));
        }

        TenantConfig config = tenantConfigRepository.findById(tenantUuid)
                .orElseGet(() -> createDefaultConfigInstance(tenantUuid));

        config.setAiDeviationModerate(request.getAiDeviationModerate());
        config.setAiDeviationCritical(request.getAiDeviationCritical());

        TenantConfig savedConfig = tenantConfigRepository.save(config);

        ThresholdResponse response = new ThresholdResponse(
                savedConfig.getTenantId(),
                savedConfig.getAiDeviationModerate(),
                savedConfig.getAiDeviationCritical()
        );

        return ResponseEntity.ok(JSendResponse.success(response));
    }

    private TenantConfig createDefaultConfigInstance(UUID tenantUuid) {
        TenantConfig config = new TenantConfig();
        config.setTenantId(tenantUuid);
        config.setDormancyThresholdDays(30);
        config.setAiDeviationModerate(new BigDecimal("10.00"));
        config.setAiDeviationCritical(new BigDecimal("20.00"));
        
        Map<String, Integer> defaultDelays = new HashMap<>();
        defaultDelays.put("PRE_CONTENTIEUX", 15);
        defaultDelays.put("MISE_EN_DEMEURE", 30);
        defaultDelays.put("SAISIE", 45);
        defaultDelays.put("VENTE", 60);
        config.setPhaseLegalDelays(defaultDelays);

        return config;
    }

    private TenantConfig createAndSaveDefaultConfig(UUID tenantUuid) {
        TenantConfig config = createDefaultConfigInstance(tenantUuid);
        return tenantConfigRepository.save(config);
    }
}
