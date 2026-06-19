import pytest
from harvester.cli import dispatch_adapter
from harvester.sources.psytoolkit import PsyToolkitAdapter
from harvester.sources.psychology_tools import PsychologyToolsAdapter

def test_dispatch_psytoolkit_host():
    a = dispatch_adapter("https://us.psytoolkit.org/survey-library/anxiety-gad7.html")
    assert isinstance(a, PsyToolkitAdapter)

def test_dispatch_psychology_tools_host():
    a = dispatch_adapter("https://psychology-tools.com/test/penn-state-worry-questionnaire")
    assert isinstance(a, PsychologyToolsAdapter)

def test_dispatch_unknown_host_raises():
    with pytest.raises(ValueError):
        dispatch_adapter("https://example.com/foo")
