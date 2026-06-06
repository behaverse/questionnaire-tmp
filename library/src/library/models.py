from pydantic import BaseModel

class EntitySummary(BaseModel):
    id: str
    version: str
    entity_type: str
    title: str | None = None
    status: str
    effective_license: str | None = None

class Paginated(BaseModel):
    items: list[EntitySummary]
    total: int
    limit: int
    offset: int
