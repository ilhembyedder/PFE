package com.leasrecover.modules.notification;

import com.leasrecover.modules.cases.AIValuation;
import com.leasrecover.modules.cases.AIValuationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ValuationProgressService {
    private static final Logger log = LoggerFactory.getLogger(ValuationProgressService.class);

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();
    private final AIValuationRepository aiValuationRepository;

    public ValuationProgressService(AIValuationRepository aiValuationRepository) {
        this.aiValuationRepository = aiValuationRepository;
    }

    public SseEmitter registerEmitter(UUID caseId) {
        SseEmitter emitter = new SseEmitter(120000L); // 120,000ms

        emitter.onCompletion(() -> {
            log.info("SSE connection completed for caseId: {}", caseId);
            emitters.remove(caseId);
        });

        emitter.onTimeout(() -> {
            log.info("SSE connection timeout for caseId: {}", caseId);
            emitter.complete();
            emitters.remove(caseId);
        });

        emitter.onError((ex) -> {
            log.error("SSE connection error for caseId: {}, error: {}", caseId, ex.getMessage());
            emitter.completeWithError(ex);
            emitters.remove(caseId);
        });

        emitters.put(caseId, emitter);
        return emitter;
    }

    public void sendProgress(UUID caseId, Object payload) {
        SseEmitter emitter = emitters.get(caseId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name("progress").data(payload));
            } catch (IOException e) {
                log.warn("Failed to send SSE event for caseId: {}, removing emitter. Error: {}", caseId, e.getMessage());
                emitters.remove(caseId);
                emitter.completeWithError(e);
            }
        } else {
            log.debug("No active SSE emitter found for caseId: {}", caseId);
        }
    }

    @Transactional
    public void updateValuationStatus(UUID caseId, String status) {
        Optional<AIValuation> valuationOpt = aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING");
        if (valuationOpt.isPresent()) {
            AIValuation valuation = valuationOpt.get();
            valuation.setStatus(status);
            valuation.setProcessedAt(ZonedDateTime.now());
            aiValuationRepository.saveAndFlush(valuation);
            log.info("Updated AIValuation status to {} for caseId: {}", status, caseId);
        } else {
            log.warn("No PENDING AIValuation found to update for caseId: {}", caseId);
        }
    }

    public void completeEmitter(UUID caseId) {
        SseEmitter emitter = emitters.get(caseId);
        if (emitter != null) {
            emitter.complete();
            emitters.remove(caseId);
        }
    }
}
