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
class RawOption:
    input_data_type: str
    measurement_type: str
    dimension: str
    selection: str | None = None
    anchors: list = field(default_factory=list)
    values: list = field(default_factory=list)
    min: float | None = None
    max: float | None = None
    step: float | None = None
    min_label: str | None = None
    max_label: str | None = None
    center_label: str | None = None
    initial_value: float | None = None
    randomize: bool = False

@dataclass
class RawItem:
    text: str | None
    construct: str | None = None
    reversed: bool = False
    option: "RawOption | None" = None

    def __post_init__(self):
        if isinstance(self.option, dict):
            self.option = RawOption(**self.option)

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
    scale: RawScale | None
    items: list
    license: LicenseFlag
    domain: list = field(default_factory=list)
    population: list = field(default_factory=list)
    context_text: str | None = None
    shared_prompt_text: str | None = None
    references: list = field(default_factory=list)
    keywords: list = field(default_factory=list)
    source_meta: dict | None = None

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
