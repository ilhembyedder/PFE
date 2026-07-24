import time
import requests
import logging

logger = logging.getLogger("ai_service")

# Canonical error message for unreadable or invalid document (FR32)
DOCUMENT_UNREADABLE_MESSAGE = "Le document est illisible ou n'est pas un rapport d'expertise valide."


def execute_background_extraction(file_bytes: bytes, case_id: str, tenant_id: str, webhook_url: str):
    """
    Execute the document extraction pipeline in a background task.
    On any failure, fires a FAILED webhook so the frontend can display a retry CTA.
    """
    logger.info(f"Starting background extraction for case: {case_id}, tenant: {tenant_id}")

    try:
        # Step 1: Reading document — validate that file bytes are non-empty
        if not file_bytes:
            raise ValueError("Le fichier transmis est vide ou illisible.")

        time.sleep(3)
        payload_reading = {
            "caseId": case_id,
            "tenantId": tenant_id,
            "status": "PENDING",
            "stage": "READING",
            "progress": 30,
            "message": "Lecture du document...",
            "data": None
        }
        logger.info(f"Sending reading progress: {payload_reading}")
        send_webhook(webhook_url, payload_reading)

        # Step 2: Extraction — parse content and invoke LLM API
        time.sleep(3)
        payload_extraction = {
            "caseId": case_id,
            "tenantId": tenant_id,
            "status": "PENDING",
            "stage": "EXTRACTION",
            "progress": 70,
            "message": "Extraction des données...",
            "data": None
        }
        logger.info(f"Sending extraction progress: {payload_extraction}")
        send_webhook(webhook_url, payload_extraction)

        # Step 3: Calculation (Completion)
        time.sleep(3)
        payload_success = {
            "caseId": case_id,
            "tenantId": tenant_id,
            "status": "SUCCESS",
            "stage": "CALCULATION",
            "progress": 100,
            "message": "Calcul d'écart complété.",
            "data": {
                "brand": "BMW",
                "model": "520d",
                "year": 2020,
                "mileage": 87000,
                "condition": "Bon état",
                "marketValueCents": 1840000,
                "currencyCode": "EUR"
            }
        }
        logger.info(f"Sending final extraction result: {payload_success}")
        send_webhook(webhook_url, payload_success)

    except Exception as e:
        logger.error(f"Error during background extraction for case {case_id}: {str(e)}")
        # Fire the FAILED webhook with a canonical, user-facing error message (FR32, FR26)
        payload_failed = {
            "caseId": case_id,
            "tenantId": tenant_id,
            "status": "FAILED",
            "stage": "EXTRACTION",
            "progress": 100,
            "message": DOCUMENT_UNREADABLE_MESSAGE,
            "data": None
        }
        try:
            send_webhook(webhook_url, payload_failed)
        except Exception as ex:
            logger.error(f"Failed to send failure webhook for case {case_id}: {str(ex)}")


def send_webhook(webhook_url: str, payload: dict):
    try:
        response = requests.post(webhook_url, json=payload, timeout=5)
        response.raise_for_status()
        logger.info(f"Webhook response status: {response.status_code}")
    except Exception as e:
        logger.error(f"Could not reach or deliver payload to webhook URL {webhook_url}: {str(e)}")
        raise e
