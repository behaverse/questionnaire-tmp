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

class QuestionHit(BaseModel):
    id: str
    version: str
    text: str | None = None
    language: str | None = None

class PaginatedQuestions(BaseModel):
    items: list[QuestionHit]
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
    instrument_id: str | None = None
    variant: str | None = None
    domain: list[str] = []
    population: list[str] = []

class PaginatedCards(BaseModel):
    items: list[CatalogueCard]
    total: int
    limit: int
    offset: int

class InstrumentGroup(BaseModel):
    instrument_id: str | None = None
    title: str | None = None
    form_count: int
    languages: list[str] = []
    domain: list[str] = []
    forms: list[CatalogueCard]

class PaginatedGroups(BaseModel):
    items: list[InstrumentGroup]
    total: int
    limit: int
    offset: int

class VersionInfo(BaseModel):
    id: str
    version: str
    status: str
    severity: str | None = None
    date: str | None = None
