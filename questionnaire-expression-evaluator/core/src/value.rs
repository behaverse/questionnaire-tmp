#[derive(Debug, Clone)]
pub enum Value {
    Null,
    Bool(bool),
    Number(f64),
    Str(String),
    List(Vec<Value>),
}

impl Value {
    /// Total value-equality (cross-type → false, never an error). Used by `==`/`!=`/`in`.
    pub fn eq_value(&self, other: &Value) -> bool {
        match (self, other) {
            (Value::Null, Value::Null) => true,
            (Value::Bool(a), Value::Bool(b)) => a == b,
            (Value::Number(a), Value::Number(b)) => a == b,
            (Value::Str(a), Value::Str(b)) => a == b,
            (Value::List(a), Value::List(b)) =>
                a.len() == b.len() && a.iter().zip(b).all(|(x, y)| x.eq_value(y)),
            _ => false,
        }
    }
    /// Boolean view: Some(b) only for Bool; everything else None (type error → caller funnels to Null/false).
    pub fn truthy(&self) -> Option<bool> {
        match self { Value::Bool(b) => Some(*b), _ => None }
    }
    pub fn is_empty_value(&self) -> bool {
        match self {
            Value::Null => true,
            Value::Str(s) => s.is_empty(),
            Value::List(l) => l.is_empty(),
            _ => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn equality_is_total_across_types() {
        assert!(Value::Null.eq_value(&Value::Null));
        assert!(Value::Number(1.0).eq_value(&Value::Number(1.0)));
        assert!(!Value::Number(1.0).eq_value(&Value::Number(2.0)));
        assert!(Value::Str("a".into()).eq_value(&Value::Str("a".into())));
        assert!(!Value::Number(1.0).eq_value(&Value::Str("1".into())));
        assert!(Value::List(vec![Value::Number(1.0)]).eq_value(&Value::List(vec![Value::Number(1.0)])));
    }
    #[test]
    fn truthiness_only_bool_true() {
        assert_eq!(Value::Bool(true).truthy(), Some(true));
        assert_eq!(Value::Bool(false).truthy(), Some(false));
        assert_eq!(Value::Null.truthy(), None);
        assert_eq!(Value::Number(1.0).truthy(), None);
    }
}
