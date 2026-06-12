#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Number(f64), Str(String), Ident(String),
    True, False, Null, In,
    OrOr, AndAnd, Bang,
    EqEq, NotEq, Lt, Le, Gt, Ge,
    Plus, Minus, Star, Slash, Percent,
    LParen, RParen, LBracket, RBracket, Comma,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ParseError { pub offset: usize, pub message: String }

pub fn tokenize(src: &str) -> Result<Vec<Token>, ParseError> {
    let chars: Vec<char> = src.chars().collect();
    let mut i = 0usize;
    let mut out = Vec::new();
    let err = |offset: usize, m: &str| ParseError { offset, message: m.to_string() };
    while i < chars.len() {
        let c = chars[i];
        if c.is_whitespace() { i += 1; continue; }
        match c {
            '(' => { out.push(Token::LParen); i += 1; }
            ')' => { out.push(Token::RParen); i += 1; }
            '[' => { out.push(Token::LBracket); i += 1; }
            ']' => { out.push(Token::RBracket); i += 1; }
            ',' => { out.push(Token::Comma); i += 1; }
            '+' => { out.push(Token::Plus); i += 1; }
            '-' => { out.push(Token::Minus); i += 1; }
            '*' => { out.push(Token::Star); i += 1; }
            '/' => { out.push(Token::Slash); i += 1; }
            '%' => { out.push(Token::Percent); i += 1; }
            '!' => { if chars.get(i+1) == Some(&'=') { out.push(Token::NotEq); i += 2; } else { out.push(Token::Bang); i += 1; } }
            '=' => { if chars.get(i+1) == Some(&'=') { out.push(Token::EqEq); i += 2; } else { return Err(err(i, "expected '=='")); } }
            '<' => { if chars.get(i+1) == Some(&'=') { out.push(Token::Le); i += 2; } else { out.push(Token::Lt); i += 1; } }
            '>' => { if chars.get(i+1) == Some(&'=') { out.push(Token::Ge); i += 2; } else { out.push(Token::Gt); i += 1; } }
            '&' => { if chars.get(i+1) == Some(&'&') { out.push(Token::AndAnd); i += 2; } else { return Err(err(i, "expected '&&'")); } }
            '|' => { if chars.get(i+1) == Some(&'|') { out.push(Token::OrOr); i += 2; } else { return Err(err(i, "expected '||'")); } }
            '\'' => {
                let start = i; i += 1; let mut s = String::new();
                loop {
                    match chars.get(i) {
                        None => return Err(err(start, "unterminated string")),
                        Some('\'') => { i += 1; break; }
                        Some('\\') => {
                            match chars.get(i+1) {
                                Some('\'') => { s.push('\''); i += 2; }
                                Some('\\') => { s.push('\\'); i += 2; }
                                _ => return Err(err(i, "invalid escape")),
                            }
                        }
                        Some(ch) => { s.push(*ch); i += 1; }
                    }
                }
                out.push(Token::Str(s));
            }
            c if c.is_ascii_digit() => {
                let start = i;
                while i < chars.len() && (chars[i].is_ascii_digit() || chars[i] == '.') { i += 1; }
                let lit: String = chars[start..i].iter().collect();
                let n: f64 = lit.parse().map_err(|_| err(start, "invalid number"))?;
                if !n.is_finite() { return Err(err(start, "non-finite number")); }
                out.push(Token::Number(n));
            }
            c if c == '_' || c.is_ascii_alphabetic() => {
                let start = i;
                while i < chars.len() && (chars[i] == '_' || chars[i].is_ascii_alphanumeric()) { i += 1; }
                let word: String = chars[start..i].iter().collect();
                out.push(match word.as_str() {
                    "true" => Token::True, "false" => Token::False,
                    "null" => Token::Null, "in" => Token::In,
                    _ => Token::Ident(word),
                });
            }
            _ => return Err(err(i, "unexpected character")),
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn kinds(src: &str) -> Vec<Token> { tokenize(src).unwrap() }
    #[test]
    fn tokenizes_operators_and_literals() {
        assert_eq!(kinds("a >= 10"), vec![Token::Ident("a".into()), Token::Ge, Token::Number(10.0)]);
        assert_eq!(kinds("x == ''"), vec![Token::Ident("x".into()), Token::EqEq, Token::Str("".into())]);
        assert_eq!(kinds("true && false"), vec![Token::True, Token::AndAnd, Token::False]);
        assert_eq!(kinds("length(s)"), vec![Token::Ident("length".into()), Token::LParen, Token::Ident("s".into()), Token::RParen]);
        assert_eq!(kinds("[1, 2]"), vec![Token::LBracket, Token::Number(1.0), Token::Comma, Token::Number(2.0), Token::RBracket]);
        assert_eq!(kinds("a in b"), vec![Token::Ident("a".into()), Token::In, Token::Ident("b".into())]);
    }
    #[test]
    fn string_escapes() {
        assert_eq!(kinds(r"'a\'b'"), vec![Token::Str("a'b".into())]);
        assert_eq!(kinds(r"'a\\b'"), vec![Token::Str(r"a\b".into())]);
    }
    #[test]
    fn negative_and_decimal_numbers_are_two_tokens_minus_then_number() {
        assert_eq!(kinds("-2.5"), vec![Token::Minus, Token::Number(2.5)]);
    }
    #[test]
    fn errors_on_unterminated_string_and_bad_char() {
        assert!(tokenize("'oops").is_err());
        assert!(tokenize("a @ b").is_err());
    }
}
