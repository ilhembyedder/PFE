package com.leasrecover.modules.notification;

import com.leasrecover.modules.cases.AIValuation;
import com.leasrecover.modules.cases.AIValuationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ValuationProgressServiceTest {

    @Mock
    private AIValuationRepository aiValuationRepository;

    @InjectMocks
    private ValuationProgressService valuationProgressService;

    private UUID caseId;

    @BeforeEach
    void setUp() {
        caseId = UUID.randomUUID();
    }

    @Test
    void testRegisterEmitterAndSendProgress() {
        SseEmitter emitter = valuationProgressService.registerEmitter(caseId);
        assertNotNull(emitter);

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setTenantId(UUID.randomUUID());
        payload.setStatus("PENDING");
        payload.setStage("READING");
        payload.setProgress(30);
        payload.setMessage("Reading...");

        assertDoesNotThrow(() -> valuationProgressService.sendProgress(caseId, payload));
    }

    @Test
    void testCompleteEmitter() {
        SseEmitter emitter = valuationProgressService.registerEmitter(caseId);
        assertNotNull(emitter);

        valuationProgressService.completeEmitter(caseId);
    }

    @Test
    void testUpdateValuationStatus_Success() {
        AIValuation valuation = new AIValuation();
        valuation.setId(UUID.randomUUID());
        valuation.setStatus("PENDING");

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(eq(caseId), eq("PENDING")))
                .thenReturn(Optional.of(valuation));

        valuationProgressService.updateValuationStatus(caseId, "SUCCESS");

        assertEquals("SUCCESS", valuation.getStatus());
        assertNotNull(valuation.getProcessedAt());
        verify(aiValuationRepository, times(1)).saveAndFlush(valuation);
    }

    @Test
    void testConcurrentEmitters() {
        UUID caseId1 = UUID.randomUUID();
        UUID caseId2 = UUID.randomUUID();

        SseEmitter emitter1 = valuationProgressService.registerEmitter(caseId1);
        SseEmitter emitter2 = valuationProgressService.registerEmitter(caseId2);

        assertNotNull(emitter1);
        assertNotNull(emitter2);

        valuationProgressService.completeEmitter(caseId1);
        valuationProgressService.completeEmitter(caseId2);
    }
}
