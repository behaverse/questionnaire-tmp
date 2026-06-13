from viewer_service.runtime import rewrite_scorer_urls


def test_rewrites_wasm_urls_to_public_base():
    runtime = {"scores": [
        {"id": "t", "scorer": "scr_phq9@v26.0602", "path": "/total",
         "impl": {"kind": "wasm", "url": "https://behaverse.org/x.wasm", "sha256": "ab"}},
    ]}
    rewrite_scorer_urls(runtime, "https://vs.example.com")
    impl = runtime["scores"][0]["impl"]
    assert impl["url"] == "https://vs.example.com/v1/scorers/scr_phq9@v26.0602/impl.wasm"
    assert impl["sha256"] == "ab"


def test_no_base_leaves_urls_untouched():
    runtime = {"scores": [{"id": "t", "scorer": "scr_x@v26.0101", "path": "/t",
                           "impl": {"kind": "wasm", "url": "https://orig/x.wasm", "sha256": "ab"}}]}
    rewrite_scorer_urls(runtime, "")
    assert runtime["scores"][0]["impl"]["url"] == "https://orig/x.wasm"


def test_non_wasm_kinds_untouched():
    runtime = {"scores": [{"id": "t", "scorer": "scr_x@v26.0101", "path": "/t",
                           "impl": {"kind": "http", "url": "https://api/x"}}]}
    rewrite_scorer_urls(runtime, "https://vs.example.com")
    assert runtime["scores"][0]["impl"]["url"] == "https://api/x"


def test_trailing_slash_base_is_normalised():
    runtime = {"scores": [{"id": "t", "scorer": "scr_x@v26.0101", "path": "/t",
                           "impl": {"kind": "wasm", "url": "u", "sha256": "ab"}}]}
    rewrite_scorer_urls(runtime, "https://vs.example.com/")
    assert runtime["scores"][0]["impl"]["url"] == "https://vs.example.com/v1/scorers/scr_x@v26.0101/impl.wasm"
