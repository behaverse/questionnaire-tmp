from dataclasses import dataclass

_ENUM = {
    "public_domain": "public_domain", "cc0": "cc0", "cc_by": "cc_by",
    "cc_by_nc": "cc_by_nc", "cc_by_sa": "cc_by_sa",
    "free_research": "proprietary_open_redistribution",
    "proprietary": "proprietary_restricted",
    "mixed": "mixed_see_components", "unknown": "unknown",
}

@dataclass
class LicenseFlag:
    license_class: str
    license_status: str          # confirmed | inferred | unknown
    commercial_use: str          # yes | no | unknown
    redistribution: str
    translation: str
    source_url: str
    author_contact_needed: bool
    notes: str

    def canonical_enum(self) -> str:
        return _ENUM.get(self.license_class, "unknown")

    def x_metadata(self) -> dict:
        return {
            "x_license_class": self.license_class,
            "x_license_status": self.license_status,
            "x_commercial_use": self.commercial_use,
            "x_redistribution": self.redistribution,
            "x_translation": self.translation,
            "x_source_url": self.source_url,
            "x_author_contact_needed": self.author_contact_needed,
            "x_license_notes": self.notes,
        }

    @classmethod
    def unknown(cls, source_url: str) -> "LicenseFlag":
        return cls("unknown", "unknown", "unknown", "unknown", "unknown",
                   source_url, True, "license unclear — confirm with author")
