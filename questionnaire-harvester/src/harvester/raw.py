from dataclasses import dataclass, asdict, field
from harvester.licensing import LicenseFlag

@dataclass
class RawScale:
    input_data_type: str
    measurement_type: str
    selection: str
    dimension: str
    anchors: list
    values: list

@dataclass
class RawItem:
    text: str
    construct: str | None = None

@dataclass
class RawQuestionnaire:
    qst_id: str
    title: str
    short_title: str
    description: str
    citation: str
    year: int | None
    source_site: str
    source_url: str
    instruction_text: str
    scale: RawScale
    items: list
    license: LicenseFlag
    domain: list = field(default_factory=list)
    population: list = field(default_factory=list)
    context_text: str | None = None

    def __post_init__(self):
        if isinstance(self.scale, dict):
            self.scale = RawScale(**self.scale)
        self.items = [RawItem(**i) if isinstance(i, dict) else i for i in self.items]
        if isinstance(self.license, dict):
            self.license = LicenseFlag(**self.license)

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, d: dict) -> "RawQuestionnaire":
        return cls(**d)
