import {
  NumericLiteral,
  BinaryExpression,
  ASTNode,
  ParenthesizedExpression,
  StringLiteral,
  Identifier,
  BooleanLiteral,
  NullLiteral,
  MemberExpression,
  ArrayLiteralExpression,
  ScalarExpression,
  ArrayExpression,
} from "./ast";

import Tokenizer, { TokenType, Token } from "./tokenizer";

export default class Parser {
  private _tokenizer;
  private _lookahead: Token | null;

  constructor() {
    this._lookahead = null;
    this._tokenizer = new Tokenizer();
  }

  parse(text: string) {
    this._tokenizer.init(text);
    this._lookahead = this._tokenizer.getNextToken();

    const output = this.Program();
    if (this._lookahead) {
      throw new SyntaxError(`Unexpected token: "${this._lookahead.value}"`);
    }

    return output;
  }

  // main entry point
  /**
   * Program
   *    : Expression
   *    ;
   */
  Program() {
    return this.Expression();
  }

  /**
   * Expression
   *    : LogicalORExpression
   *    ;
   */
  Expression() {
    return this.LogicalORExpression();
  }

  /**
   * LogicalORExpression
   *    : LogicalANDExpression
   *    | LogicalANDExpression "or" LogicalORExpression
   *    ;
   */
  LogicalORExpression() {
    return this._BinaryExpression(
      this.LogicalANDExpression.bind(this),
      TokenType.OR,
      "LogicalExpression"
    );
  }

  /**
   * LogicalANDExpression
   *    : EqualityExpression
   *    | EqualityExpression "and" LogicalANDExpression
   *    ;
   */
  LogicalANDExpression() {
    return this._BinaryExpression(
      this.EqualityExpression.bind(this),
      TokenType.AND,
      "LogicalExpression"
    );
  }

  /**
   * EqualityExpression
   *    : RelationalExpression
   *    | RelationalExpression "==" EqualityExpression
   *    | RelationalExpression "!=" EqualityExpression
   *    ;
   */
  EqualityExpression() {
    return this._BinaryExpression(
      this.RelationalExpression.bind(this),
      TokenType.EQUALITY_OPERATOR
    );
  }

  /**
   * RelationalExpression
   *    : ScalarExpression
   *    | ScalarExpression "<" RelationalExpression
   *    | ScalarExpression ">" RelationalExpression
   *    | ScalarExpression "<=" RelationalExpression
   *    | ScalarExpression ">=" RelationalExpression
   *    ;
   */
  RelationalExpression() {
    return this._BinaryExpression(
      this.ScalarExpression.bind(this),
      TokenType.RELATIONAL_OPERATOR
    );
  }

  /**
   * ScalarExpression
   *    : ArrayExpression
   *    | MemberExpression "contains" MemberExpression
   *    ;
   */
  ScalarExpression() {
    let left = this.ArrayExpression();

    if (this._lookahead?.type === TokenType.CONTAINS) {
      const operatorToken = this._eat(this._lookahead.type);
      const right = this.MemberExpression();

      left = {
        type: "ScalarExpression",
        operator: operatorToken.value,
        left: this._checkScalar(left),
        right: this._checkScalar(right),
      } as ScalarExpression;
    }

    return left;
  }

  /**
   * ArrayExpression
   *    : MemberExpression
   *    | ArrayLiteralExpression "has" MemberExpression
   *    | MemberExpression "in" ArrayLiteralExpression
   *    ;
   */
  ArrayExpression() {
    let left = this.MemberExpression();

    // left side array
    if (this._lookahead?.type === TokenType.HAS) {
      const operatorToken = this._eat(TokenType.HAS);
      const right = this.MemberExpression();

      left = {
        type: "ArrayExpression",
        operator: operatorToken.value.toLowerCase(),
        left: this._checkArray(left),
        right: this._checkScalar(right),
      } as ArrayExpression;
    }

    // right side array
    if (
      this._lookahead?.type === TokenType.IN ||
      this._lookahead?.type === TokenType.NOT_IN
    ) {
      const operatorToken = this._eat(this._lookahead.type);
      const right = this.MemberExpression();

      left = {
        type: "ArrayExpression",
        operator: operatorToken.value.toLowerCase(),
        left: this._checkScalar(left),
        right: this._checkArray(right),
      } as ArrayExpression;
    }

    return left;
  }

  /**
   * MemberExpression
   *    : PrimaryExpression
   *    | MemberExpression "." Identifier
   *    | MemberExpression "[" Expression "]"
   *    ;
   */
  MemberExpression() {
    let object = this.PrimaryExpression();

    while (
      this._lookahead?.type === TokenType.DOT ||
      this._lookahead?.type === TokenType.OPEN_SQUARE_BRACKET
    ) {
      if (this._lookahead?.type === TokenType.DOT) {
        if (this._isLiteralNode(object)) {
          throw new SyntaxError(
            "Invalid member expression: can't access member value of a scalar."
          );
        }

        this._eat(TokenType.DOT);
        const property = this.Identifier();

        object = {
          type: "MemberExpression",
          computed: false,
          object,
          property,
        } as MemberExpression;
      }

      if (this._lookahead?.type === TokenType.OPEN_SQUARE_BRACKET) {
        this._eat(TokenType.OPEN_SQUARE_BRACKET);
        const property = this.Expression();
        this._eat(TokenType.CLOSED_SQUARE_BRACKET);
        object = {
          type: "MemberExpression",
          computed: true,
          object,
          property,
        } as MemberExpression;
      }
    }

    return object;
  }

  /**
   * Identifier
   *    : IDENTIFIER
   *    ;
   */
  Identifier(): Identifier {
    const name = this._eat(TokenType.IDENTIFIER).value;

    return {
      type: "Identifier",
      name,
    };
  }

  /**
   * PrimaryExpression
   *    : Literal
   *    | ParenthesizedExpression
   *    | Identifier
   *    ;
   */
  PrimaryExpression(): ASTNode {
    if (this._lookahead?.type === TokenType.OPEN_SQUARE_BRACKET) {
      return this.ArrayLiteralExpression();
    }

    if (this._isLiteral(this._lookahead?.type)) {
      return this.Literal();
    }

    switch (this._lookahead?.type) {
      case TokenType.OPEN_PARENTHESIS:
        return this.ParenthesizedExpression();
      case TokenType.IDENTIFIER:
        return this.Identifier();
      default:
        throw new SyntaxError("Unexpected token.");
    }
  }

  /**
   * ParenthesizedExpression
   *  | "(" Expression ")"
   *  ;
   */
  ParenthesizedExpression(): ParenthesizedExpression {
    this._eat(TokenType.OPEN_PARENTHESIS);
    const expression = this.Expression();
    this._eat(TokenType.CLOSED_PARENTHESIS);

    return {
      ...expression,
      extra: {
        parenthesized: true,
      },
    };
  }

  /**
   * Literal
   *    : NumericLiteral
   *    | StringLiteral
   *    | BooleanLiteral
   *    | NullLiteral
   */
  Literal() {
    switch (this._lookahead?.type) {
      case TokenType.NUMERIC_LITERAL:
        return this.NumericLiteral();

      case TokenType.STRING_LITERAL:
        return this.StringLiteral();

      case TokenType.TRUE:
        return this.BooleanLiteral(true);

      case TokenType.FALSE:
        return this.BooleanLiteral(false);

      case TokenType.NULL:
        return this.NullLiteral();

      default:
        throw new Error(`Unexpected literal: ${this._lookahead?.type}`);
    }
  }

  /**
   * BooleanLiteral
   *    : "true"
   *    | "false"
   *    ;
   */
  BooleanLiteral(value: boolean): BooleanLiteral {
    this._eat(value ? TokenType.TRUE : TokenType.FALSE);
    return {
      type: "BooleanLiteral",
      value,
    };
  }

  /**
   * NullLiteral
   *    : "true"
   *    | "false"
   *    ;
   */
  NullLiteral(): NullLiteral {
    this._eat(TokenType.NULL);
    return {
      type: "NullLiteral",
      value: null,
    };
  }

  /**
   * NumericLiteral
   *    : NUMERIC_LITERAL
   *    ;
   */
  NumericLiteral(): NumericLiteral {
    const token = this._eat(TokenType.NUMERIC_LITERAL);
    return {
      type: "NumericLiteral",
      value: Number(token.value),
    };
  }

  /**
   * StringLiteral
   *    : STRING_LITERAL
   *    ;
   */
  StringLiteral(): StringLiteral {
    const token = this._eat(TokenType.STRING_LITERAL);
    return {
      type: "StringLiteral",
      value: token.value.slice(1, -1),
    };
  }

  /**
   * ArrayLiteralExpression
   *    : "[" OptionalArrayLiteralElementList "]"
   *    ;
   */
  ArrayLiteralExpression(): ArrayLiteralExpression {
    this._eat(TokenType.OPEN_SQUARE_BRACKET);

    const elements =
      this._lookahead?.type === TokenType.CLOSED_SQUARE_BRACKET
        ? []
        : this.ArrayLiteralElementList();

    this._eat(TokenType.CLOSED_SQUARE_BRACKET);

    return {
      type: "ArrayLiteralExpression",
      elements,
    };
  }

  /**
   * ArrayLiteralElementList
   *    | Literal
   *    | MemberExpression
   *    | ArrayLiteralElementList "," Literal
   *    | ArrayLiteralElementList "," MemberExpression
   *    ;
   *
   */
  ArrayLiteralElementList() {
    const elements = [];

    do {
      elements.push(
        this._isLiteral(this._lookahead?.type)
          ? this.Literal()
          : this.MemberExpression()
      );
    } while (
      this._lookahead?.type === TokenType.COMMA &&
      this._eat(TokenType.COMMA)
    );

    return elements;
  }

  _isLiteral(tokenType: TokenType | undefined) {
    return (
      tokenType === TokenType.STRING_LITERAL ||
      tokenType === TokenType.NUMERIC_LITERAL ||
      tokenType === TokenType.TRUE ||
      tokenType === TokenType.FALSE ||
      tokenType === TokenType.NULL
    );
  }

  _checkValidAssignmentTarget(node: ASTNode) {
    if (node.type === "Identifier" || node.type === "MemberExpression") {
      return node;
    }

    throw new SyntaxError(`Invalid left-hand side in assignment expression`);
  }

  _checkScalar(node: ASTNode) {
    if (node.type !== "ArrayLiteralExpression") {
      return node;
    }

    throw new SyntaxError(`Invalid scalar: ${node.type}`);
  }

  _checkArray(node: ASTNode) {
    // if we have an identifier, we don't know its type at this moment
    // so we'll allow it
    if (node.type === "ArrayLiteralExpression" || node.type === "Identifier") {
      return node;
    }

    throw new SyntaxError(`Invalid array expression: ${node.type}`);
  }

  _isLiteralNode(node: ASTNode): boolean {
    return [
      "NumericLiteral",
      "StringLiteral",
      "BooleanLiteral",
      "NullLiteral",
    ].includes(node.type);
  }

  _BinaryExpression(
    builderName: () => ASTNode,
    operator: TokenType,
    type: string = "BinaryExpression"
  ): BinaryExpression | ASTNode {
    let left = builderName();

    while (this._lookahead?.type === operator) {
      const operatorToken = this._eat(operator);
      const right = builderName();

      left = {
        type,
        operator: operatorToken.value.toLowerCase(),
        left,
        right,
      } as BinaryExpression;
    }

    return left;
  }

  _eat(tokenType: string) {
    const token = this._lookahead;

    if (token === null) {
      throw new SyntaxError(
        `Unexpected end of input, expected: "${tokenType}"`
      );
    }

    if (token.type !== tokenType) {
      throw new SyntaxError(`Unexpected token: "${token.value}"`);
    }

    this._lookahead = this._tokenizer.getNextToken();

    return token;
  }
}
