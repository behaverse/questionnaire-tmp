use crate::ast::{BinOp, Expr, UnOp};
use crate::lexer::{tokenize, ParseError, Token};

pub fn parse(src: &str) -> Result<Expr, ParseError> {
    let tokens = tokenize(src)?;
    let mut p = Parser { tokens, pos: 0 };
    let e = p.parse_or()?;
    if p.pos != p.tokens.len() {
        return Err(ParseError { offset: p.pos, message: "unexpected trailing tokens".into() });
    }
    Ok(e)
}

struct Parser { tokens: Vec<Token>, pos: usize }

impl Parser {
    fn peek(&self) -> Option<&Token> { self.tokens.get(self.pos) }
    fn bump(&mut self) -> Option<Token> { let t = self.tokens.get(self.pos).cloned(); if t.is_some() { self.pos += 1; } t }
    fn err(&self, m: &str) -> ParseError { ParseError { offset: self.pos, message: m.to_string() } }

    fn parse_or(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_and()?;
        while matches!(self.peek(), Some(Token::OrOr)) { self.bump();
            let right = self.parse_and()?; left = Expr::Binary(BinOp::Or, Box::new(left), Box::new(right)); }
        Ok(left)
    }
    fn parse_and(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_cmp()?;
        while matches!(self.peek(), Some(Token::AndAnd)) { self.bump();
            let right = self.parse_cmp()?; left = Expr::Binary(BinOp::And, Box::new(left), Box::new(right)); }
        Ok(left)
    }
    fn parse_cmp(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_add()?;
        loop {
            let op = match self.peek() {
                Some(Token::EqEq) => BinOp::Eq, Some(Token::NotEq) => BinOp::Ne,
                Some(Token::Lt) => BinOp::Lt, Some(Token::Le) => BinOp::Le,
                Some(Token::Gt) => BinOp::Gt, Some(Token::Ge) => BinOp::Ge,
                Some(Token::In) => BinOp::In,
                _ => break,
            };
            self.bump();
            let right = self.parse_add()?;
            left = Expr::Binary(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }
    fn parse_add(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_mul()?;
        loop {
            let op = match self.peek() { Some(Token::Plus) => BinOp::Add, Some(Token::Minus) => BinOp::Sub, _ => break };
            self.bump(); let right = self.parse_mul()?;
            left = Expr::Binary(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }
    fn parse_mul(&mut self) -> Result<Expr, ParseError> {
        let mut left = self.parse_unary()?;
        loop {
            let op = match self.peek() {
                Some(Token::Star) => BinOp::Mul, Some(Token::Slash) => BinOp::Div, Some(Token::Percent) => BinOp::Mod, _ => break };
            self.bump(); let right = self.parse_unary()?;
            left = Expr::Binary(op, Box::new(left), Box::new(right));
        }
        Ok(left)
    }
    fn parse_unary(&mut self) -> Result<Expr, ParseError> {
        match self.peek() {
            Some(Token::Bang) => { self.bump(); Ok(Expr::Unary(UnOp::Not, Box::new(self.parse_unary()?))) }
            Some(Token::Minus) => { self.bump(); Ok(Expr::Unary(UnOp::Neg, Box::new(self.parse_unary()?))) }
            _ => self.parse_primary(),
        }
    }
    fn parse_primary(&mut self) -> Result<Expr, ParseError> {
        match self.bump() {
            Some(Token::Number(n)) => Ok(Expr::Num(n)),
            Some(Token::Str(s)) => Ok(Expr::Str(s)),
            Some(Token::True) => Ok(Expr::Bool(true)),
            Some(Token::False) => Ok(Expr::Bool(false)),
            Some(Token::Null) => Ok(Expr::Null),
            Some(Token::LParen) => {
                let e = self.parse_or()?;
                match self.bump() { Some(Token::RParen) => Ok(e), _ => Err(self.err("expected ')'")) }
            }
            Some(Token::LBracket) => {
                let mut items = Vec::new();
                if !matches!(self.peek(), Some(Token::RBracket)) {
                    loop {
                        items.push(self.parse_or()?);
                        match self.peek() { Some(Token::Comma) => { self.bump(); } _ => break }
                    }
                }
                match self.bump() { Some(Token::RBracket) => Ok(Expr::List(items)), _ => Err(self.err("expected ']'")) }
            }
            Some(Token::Ident(name)) => {
                if matches!(self.peek(), Some(Token::LParen)) {
                    self.bump();
                    let mut args = Vec::new();
                    if !matches!(self.peek(), Some(Token::RParen)) {
                        loop {
                            args.push(self.parse_or()?);
                            match self.peek() { Some(Token::Comma) => { self.bump(); } _ => break }
                        }
                    }
                    match self.bump() { Some(Token::RParen) => Ok(Expr::Call(name, args)), _ => Err(self.err("expected ')'")) }
                } else { Ok(Expr::Ident(name)) }
            }
            _ => Err(self.err("expected an expression")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ast::{Expr, BinOp, UnOp};
    fn p(s: &str) -> Expr { parse(s).unwrap() }
    #[test]
    fn precedence_and_over_or_comparison_over_arith() {
        assert_eq!(p("a || b && c"), Expr::Binary(BinOp::Or, Box::new(Expr::Ident("a".into())),
            Box::new(Expr::Binary(BinOp::And, Box::new(Expr::Ident("b".into())), Box::new(Expr::Ident("c".into()))))));
        assert_eq!(p("1 + 2 < 3"), Expr::Binary(BinOp::Lt,
            Box::new(Expr::Binary(BinOp::Add, Box::new(Expr::Num(1.0)), Box::new(Expr::Num(2.0)))),
            Box::new(Expr::Num(3.0))));
    }
    #[test]
    fn calls_lists_unary_membership() {
        assert_eq!(p("length(s)"), Expr::Call("length".into(), vec![Expr::Ident("s".into())]));
        assert_eq!(p("score('phq9_total')"), Expr::Call("score".into(), vec![Expr::Str("phq9_total".into())]));
        assert_eq!(p("!x"), Expr::Unary(UnOp::Not, Box::new(Expr::Ident("x".into()))));
        assert_eq!(p("-2"), Expr::Unary(UnOp::Neg, Box::new(Expr::Num(2.0))));
        assert_eq!(p("a in [1, 2]"), Expr::Binary(BinOp::In, Box::new(Expr::Ident("a".into())),
            Box::new(Expr::List(vec![Expr::Num(1.0), Expr::Num(2.0)]))));
    }
    #[test]
    fn canonical_examples_parse() {
        for s in ["phq9_total >= 10", "length(it_name) < 5", "it_year_born == ''", "true",
                  "length(it_name) > 0 && is_empty(it_topics)"] {
            assert!(parse(s).is_ok(), "failed: {s}");
        }
    }
    #[test]
    fn errors() {
        assert!(parse("1 +").is_err());
        assert!(parse("(1 + 2").is_err());
        assert!(parse("").is_err());
    }
}
