import unittest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch
import io

class TestExtractionAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_extract_endpoint_success(self):
        pdf_file = io.BytesIO(b"%PDF-1.4 mock pdf content")
        pdf_file.name = "test.pdf"

        with patch("app.api.routes.extraction.execute_background_extraction") as mock_background_task:
            response = self.client.post(
                "/api/extract",
                files={"file": ("test.pdf", pdf_file, "application/pdf")},
                data={
                    "caseId": "123e4567-e89b-12d3-a456-426614174000",
                    "tenantId": "987fcba9-8765-4321-fedc-ba0987654321",
                    "webhookUrl": "http://localhost:8080/webhook"
                }
            )
            
            self.assertEqual(response.status_code, 202)
            self.assertEqual(response.json()["status"], "success")
            mock_background_task.assert_called_once()

    def test_extract_endpoint_invalid_file_type(self):
        txt_file = io.BytesIO(b"some plain text content")
        txt_file.name = "test.txt"

        response = self.client.post(
            "/api/extract",
            files={"file": ("test.txt", txt_file, "text/plain")},
            data={
                "caseId": "123e4567-e89b-12d3-a456-426614174000",
                "tenantId": "987fcba9-8765-4321-fedc-ba0987654321",
                "webhookUrl": "http://localhost:8080/webhook"
            }
        )
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Seuls les fichiers PDF sont acceptés.", response.json()["detail"])

    def test_extract_endpoint_missing_metadata(self):
        pdf_file = io.BytesIO(b"%PDF-1.4 mock pdf content")
        pdf_file.name = "test.pdf"

        # Missing tenantId
        response = self.client.post(
            "/api/extract",
            files={"file": ("test.pdf", pdf_file, "application/pdf")},
            data={
                "caseId": "123e4567-e89b-12d3-a456-426614174000",
                "webhookUrl": "http://localhost:8080/webhook"
            }
        )
        
        self.assertEqual(response.status_code, 422)

if __name__ == "__main__":
    unittest.main()
