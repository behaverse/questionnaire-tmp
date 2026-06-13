use serde_json::{json, Value};

pub fn wrap_ok(output: Value) -> Value {
    json!({ "ok": true, "output": output })
}
pub fn wrap_err(msg: &str) -> Value {
    json!({ "ok": false, "error": msg })
}
/// Length-prefixed: 4-byte little-endian u32 length, then the UTF-8 JSON bytes.
pub fn encode(value: &Value) -> Vec<u8> {
    let json = serde_json::to_vec(value)
        .unwrap_or_else(|_| br#"{"ok":false,"error":"encode failure"}"#.to_vec());
    let mut out = Vec::with_capacity(4 + json.len());
    out.extend_from_slice(&(json.len() as u32).to_le_bytes());
    out.extend_from_slice(&json);
    out
}

// ---- wasm-facing plumbing (referenced by the `scorer!` macro) ----

/// Allocate `len` bytes; return a pointer the host writes into. Exact-size boxed slice
/// so `dealloc(ptr, len)` frees precisely what was allocated.
pub fn alloc(len: i32) -> i32 {
    let buf = vec![0u8; len.max(0) as usize].into_boxed_slice();
    Box::into_raw(buf) as *mut u8 as i32
}
pub fn dealloc(ptr: i32, len: i32) {
    if ptr == 0 || len <= 0 { return; }
    unsafe {
        let slice = std::slice::from_raw_parts_mut(ptr as *mut u8, len as usize);
        drop(Box::from_raw(slice as *mut [u8]));
    }
}
/// Read input JSON at [in_ptr, in_ptr+in_len), run `f`, return a pointer to the
/// length-prefixed `{ok,...}` envelope. The host frees it via `scorer_dealloc(ptr, 4+jsonLen)`.
pub fn run<F: Fn(&Value) -> Result<Value, String>>(f: F, in_ptr: i32, in_len: i32) -> i32 {
    let input = unsafe { std::slice::from_raw_parts(in_ptr as *const u8, in_len.max(0) as usize) };
    let result = match serde_json::from_slice::<Value>(input) {
        Ok(v) => match f(&v) {
            Ok(out) => wrap_ok(out),
            Err(e) => wrap_err(&e),
        },
        Err(_) => wrap_err("invalid input json"),
    };
    let boxed = encode(&result).into_boxed_slice(); // exact-size allocation
    Box::into_raw(boxed) as *mut u8 as i32
}

/// Emit the four ABI exports for a scorer whose logic is `$f: fn(&Value) -> Result<Value, String>`.
#[macro_export]
macro_rules! scorer {
    ($f:path) => {
        #[no_mangle] pub extern "C" fn scorer_abi_version() -> i32 { 1 }
        #[no_mangle] pub extern "C" fn scorer_alloc(len: i32) -> i32 { $crate::alloc(len) }
        #[no_mangle] pub extern "C" fn scorer_dealloc(ptr: i32, len: i32) { $crate::dealloc(ptr, len) }
        #[no_mangle] pub extern "C" fn scorer_score(in_ptr: i32, in_len: i32) -> i32 { $crate::run($f, in_ptr, in_len) }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn wraps_ok_and_err() {
        assert_eq!(wrap_ok(json!({"total": 3})), json!({"ok": true, "output": {"total": 3}}));
        assert_eq!(wrap_err("bad"), json!({"ok": false, "error": "bad"}));
    }
    #[test]
    fn encode_is_length_prefixed() {
        let bytes = encode(&json!({"ok": true}));
        let len = u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]) as usize;
        assert_eq!(len, bytes.len() - 4);
        assert_eq!(&bytes[4..], br#"{"ok":true}"#);
    }
}
