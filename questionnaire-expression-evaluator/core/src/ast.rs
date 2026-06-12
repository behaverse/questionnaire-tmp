#[derive(Debug, Clone, PartialEq)]
pub enum Expr {
    Num(f64),
    Str(String),
    Bool(bool),
    Null,
    List(Vec<Expr>),
    Ident(String),
    Call(String, Vec<Expr>),
    Unary(UnOp, Box<Expr>),
    Binary(BinOp, Box<Expr>, Box<Expr>),
}
#[derive(Debug, Clone, PartialEq)]
pub enum UnOp { Not, Neg }
#[derive(Debug, Clone, PartialEq)]
pub enum BinOp { Or, And, Eq, Ne, Lt, Le, Gt, Ge, In, Add, Sub, Mul, Div, Mod }
