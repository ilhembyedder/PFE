from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
from uuid import UUID
from app.schemas.extraction import ExtractionRequest
from app.services.llm_extraction import execute_background_extraction

router = APIRouter()

@router.post("/extract", status_code=202)
async def extract_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    caseId: UUID = Form(...),
    tenantId: UUID = Form(...),
    webhookUrl: str = Form(...)
):
    # Validate PDF content type or file extension
    is_pdf = file.filename.lower().endswith('.pdf') or file.content_type == 'application/pdf'
    if not is_pdf:
        raise HTTPException(
            status_code=400,
            detail="Seuls les fichiers PDF sont acceptés."
        )
    
    # Validate metadata fields via Pydantic model
    try:
        request_metadata = ExtractionRequest(
            case_id=caseId,
            tenant_id=tenantId,
            webhook_url=webhookUrl
        )
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail=f"Metadata validation failed: {str(e)}"
        )
    
    # Read file bytes (to pass to async background task)
    file_bytes = await file.read()
    
    # Spawn background task
    background_tasks.add_task(
        execute_background_extraction,
        file_bytes,
        str(request_metadata.case_id),
        str(request_metadata.tenant_id),
        str(request_metadata.webhook_url)
    )
    
    return {
        "status": "success",
        "message": "Extraction process scheduled in the background"
    }
