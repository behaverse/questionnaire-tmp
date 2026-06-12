use crate::value::Value;
use regex::Regex;

/// 05b 4.1: post-reversal value. Deterministic; the Library guards which Prompts may set reversed.
pub fn reversed_value(value: f64, min: f64, max: f64) -> f64 { max + min - value }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Comparator { Equals, SetEquals, MatchesRegex }

/// 05b 4.3: Solution correctness. Comparator is chosen by the host from the Option triple.
pub fn compare_solution(cmp: Comparator, response: &Value, expected: &Value) -> bool {
    match cmp {
        Comparator::Equals => response.eq_value(expected),
        Comparator::SetEquals => match (response, expected) {
            (Value::List(a), Value::List(b)) => {
                a.len() == b.len()
                    && a.iter().all(|x| b.iter().any(|y| x.eq_value(y)))
                    && b.iter().all(|y| a.iter().any(|x| x.eq_value(y)))
            }
            _ => false,
        },
        Comparator::MatchesRegex => match (response, expected) {
            (Value::Str(s), Value::Str(pat)) => Regex::new(pat).map(|re| re.is_match(s)).unwrap_or(false),
            _ => false,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::value::Value;
    #[test]
    fn reversed() {
        assert_eq!(reversed_value(1.0, 0.0, 6.0), 5.0);
        assert_eq!(reversed_value(4.0, 1.0, 5.0), 2.0);
        assert_eq!(reversed_value(-1.0, -3.0, 3.0), 1.0);
    }
    #[test]
    fn equals_and_set_equals() {
        assert!(compare_solution(Comparator::Equals, &Value::Number(3.0), &Value::Number(3.0)));
        assert!(!compare_solution(Comparator::Equals, &Value::Number(3.0), &Value::Number(4.0)));
        let a = Value::List(vec![Value::Number(1.0), Value::Number(2.0)]);
        let b = Value::List(vec![Value::Number(2.0), Value::Number(1.0)]);
        assert!(compare_solution(Comparator::SetEquals, &a, &b));
        let c = Value::List(vec![Value::Number(1.0)]);
        assert!(!compare_solution(Comparator::SetEquals, &a, &c));
    }
    #[test]
    fn matches_regex() {
        assert!(compare_solution(Comparator::MatchesRegex, &Value::Str("ab12".into()), &Value::Str(r"^[a-z]+\d+$".into())));
        assert!(!compare_solution(Comparator::MatchesRegex, &Value::Str("ABC".into()), &Value::Str(r"^[a-z]+$".into())));
        assert!(!compare_solution(Comparator::MatchesRegex, &Value::Str("x".into()), &Value::Str("(".into())));
        assert!(!compare_solution(Comparator::MatchesRegex, &Value::Number(1.0), &Value::Str("1".into())));
    }
}
