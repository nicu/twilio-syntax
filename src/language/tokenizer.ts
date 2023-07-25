export enum TokenType {
  COMMA = "COMMA",
  DOT = "DOT",
  OPEN_PARENTHESIS = "OPEN_PARENTHESIS",
  CLOSED_PARENTHESIS = "CLOSED_PARENTHESIS",
  OPEN_SQUARE_BRACKET = "OPEN_SQUARE_BRACKET",
  CLOSED_SQUARE_BRACKET = "CLOSED_SQUARE_BRACKET",
  NUMERIC_LITERAL = "NUMERIC_LITERAL",
  STRING_LITERAL = "STRING_LITERAL",
  IDENTIFIER = "IDENTIFIER",
  RELATIONAL_OPERATOR = "RELATIONAL_OPERATOR",
  EQUALITY_OPERATOR = "EQUALITY_OPERATOR",
  AND = "AND",
  OR = "OR",
  NOT = "NOT",
  TRUE = "TRUE",
  FALSE = "FALSE",
  NULL = "NULL",
  IN = "IN",
  NOT_IN = "NOT_IN",
  CONTAINS = "CONTAINS",
  HAS = "HAS",
}

export interface Token {
  type: TokenType;
  value?: any;
}

const Spec: Array<[RegExp, string | null]> = [
  // whitespace
  [/^\s+/, null],

  // symbols & delimiters
  [/^,/, TokenType.COMMA],
  [/^\./, TokenType.DOT],

  // equality operators: ==, !=
  [/^[=!]=/, TokenType.EQUALITY_OPERATOR],

  // relational operators: <, >, <=, >=
  [/^[<>]=?/, TokenType.RELATIONAL_OPERATOR],

  // logical operators
  [/^\b(and|AND)\b/, TokenType.AND],
  [/^\b(or|OR)\b/, TokenType.OR],
  [/^!/, TokenType.NOT],

  // scalar operators
  [/^\b(contains|CONTAINS)\b/, TokenType.CONTAINS],

  // array operators
  [/^\b(in|IN)\b/, TokenType.IN],
  [/^\b(not in|NOT IN)\b/, TokenType.NOT_IN],
  [/^\b(has|HAS)\b/, TokenType.HAS],

  // parenthesis
  [/^\(/, TokenType.OPEN_PARENTHESIS],
  [/^\)/, TokenType.CLOSED_PARENTHESIS],
  [/^\[/, TokenType.OPEN_SQUARE_BRACKET],
  [/^\]/, TokenType.CLOSED_SQUARE_BRACKET],

  // keywords
  [/^\btrue\b/, TokenType.TRUE],
  [/^\bfalse\b/, TokenType.FALSE],
  [/^\bnull\b/, TokenType.NULL],

  // numbers
  [/^\d+(\.\d+)?/, TokenType.NUMERIC_LITERAL],

  // strings
  [/^"[^"]*"/, TokenType.STRING_LITERAL],
  [/^'[^']*'/, TokenType.STRING_LITERAL],

  // identifier
  [/^\w+/, TokenType.IDENTIFIER],
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
