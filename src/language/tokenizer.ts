export enum TokenType {
  OPEN_PARENTHESIS = "OPEN_PARENTHESIS",
  CLOSED_PARENTHESIS = "CLOSED_PARENTHESIS",
  ADDITIVE_OPERATOR = "ADDITIVE_OPERATOR",
  MULTIPLICATIVE_OPERATOR = "MULTIPLICATIVE_OPERATOR",
  NUMERIC_LITERAL = "NUMERIC_LITERAL",
}

export interface Token {
  type: TokenType;
  value?: any;
}

const Spec: Array<[RegExp, string | null]> = [
  // whitespace
  [/^\s+/, null],

  // parenthesis
  [/^\(/, TokenType.OPEN_PARENTHESIS],
  [/^\)/, TokenType.CLOSED_PARENTHESIS],

  // numbers
  [/^\d+(\.\d+)?/, TokenType.NUMERIC_LITERAL],

  // operators
  [/^[+-]/, TokenType.ADDITIVE_OPERATOR],
  [/^[*/]/, TokenType.MULTIPLICATIVE_OPERATOR],
];

export default class Tokenizer {
  private _text: string = "";
  private _cursor: number = 0;

  init(text: string) {
    this._text = text;
    this._cursor = 0;
  }

  getNextToken(): Token | null {
    if (!this.hasMoreTokens()) {
      return null;
    }

    const text = this._text.slice(this._cursor);

    for (const [regexp, tokenType] of Spec) {
      const match = regexp.exec(text);

      if (match === null) {
        // the current spec didn't match
        // continue to the next one
        continue;
      }

      // there was a match, advance the cursor
      this._cursor += match[0].length;

      if (tokenType === null) {
        // whitespace
        return this.getNextToken();
      }

      return {
        type: tokenType,
        value: match[0],
      } as Token;
    }

    throw new SyntaxError(`Unexpected token: "${text[0]}"`);
  }

  hasMoreTokens() {
    return this._cursor < this._text.length;
  }
}
