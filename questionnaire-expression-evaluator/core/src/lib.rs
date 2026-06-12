mod value;
pub use value::Value;

mod lexer;

pub fn version() -> &'static str { "0.1.0" }

#[cfg(test)]
mod smoke {
    #[test]
    fn it_builds() { assert_eq!(super::version(), "0.1.0"); }
}
