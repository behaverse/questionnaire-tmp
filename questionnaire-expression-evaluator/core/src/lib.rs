mod value;
pub use value::Value;

mod lexer;
mod ast;
mod parser;
mod eval;
pub use eval::Bindings;

mod helpers;
pub use helpers::{reversed_value, compare_solution, Comparator};

pub fn version() -> &'static str { "0.1.0" }

#[cfg(test)]
mod smoke {
    #[test]
    fn it_builds() { assert_eq!(super::version(), "0.1.0"); }
}
