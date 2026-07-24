from pydantic import BaseModel, HttpUrl, ConfigDict
from pydantic.alias_generators import to_camel
from uuid import UUID

class ExtractionRequest(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )
    case_id: UUID
    tenant_id: UUID
    webhook_url: HttpUrl
