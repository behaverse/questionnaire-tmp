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

class CatalogueCard(BaseModel):
    id: str
    version: str
    entity_type: str
    title: str | None = None
    short_title: str | None = None
    description: str | None = None
    status: str
    effective_license: str | None = None
    language: str | None = None
    available_languages: list[str] | None = None
    item_count: int | None = None
    estimated_minutes: int | None = None
    domain: list[str] = []
    population: list[str] = []

class PaginatedCards(BaseModel):
    items: list[CatalogueCard]
    total: int
    limit: int
    offset: int

class VersionInfo(BaseModel):
    id: str
    version: str
    status: str
    severity: str | None = None
    date: str | None = None
