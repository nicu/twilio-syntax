import {
  NumericLiteral,
  BinaryExpression,
  ASTNode,
  ParenthesizedExpression,
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
   *    : AdditiveExpression
   *    ;
   */
  Expression() {
    return this.AdditiveExpression();
  }

  /**
   * AdditiveExpression
   *    : MultiplicativeExpression
   *    | AdditiveExpression "+" MultiplicativeExpression
   *    | AdditiveExpression "-" MultiplicativeExpression
   */
  AdditiveExpression() {
    return this._BinaryExpression(
      this.MultiplicativeExpression.bind(this),
      TokenType.ADDITIVE_OPERATOR
    );
  }

  /**
   * MultiplicativeExpression
   *    : PrimaryExpression
   *    | MultiplicativeExpression "*" PrimaryExpression
   *    ;
   */
  MultiplicativeExpression() {
    return this._BinaryExpression(
      this.PrimaryExpression.bind(this),
      TokenType.MULTIPLICATIVE_OPERATOR
    );
  }

  /**
   * PrimaryExpression
   *    : NumericLiteral
   *    | ParenthesizedExpression
   *    ;
   */
  PrimaryExpression(): ASTNode {
    switch (this._lookahead?.type) {
      case TokenType.OPEN_PARENTHESIS:
        return this.ParenthesizedExpression();
      case TokenType.NUMERIC_LITERAL:
        return this.NumericLiteral();
      default:
        throw new SyntaxError("Unexpected primary expression.");
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
