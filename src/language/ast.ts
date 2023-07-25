export interface ASTNode {
  type: string;
}

export interface ParenthesizedExpression extends ASTNode {
  extra: {
    parenthesized: boolean;
  };
}

export interface StatementList extends ASTNode {
  type: "StatementList";
  statements: Array<ASTNode>;
}

export interface ExpressionStatement extends ASTNode {
  type: "ExpressionStatement";
  expression: ASTNode;
}

export interface BlockStatement extends ASTNode {
  type: "BlockStatement";
  body?: StatementList;
}

export interface EmptyStatement extends ASTNode {
  type: "EmptyStatement";
}

export interface NumericLiteral extends ASTNode {
  type: "NumericLiteral";
  value: number;
}

export interface StringLiteral extends ASTNode {
  type: "StringLiteral";
  value: string;
}

export interface BooleanLiteral extends ASTNode {
  type: "BooleanLiteral";
  value: boolean;
}

export interface NullLiteral extends ASTNode {
  type: "NullLiteral";
  value: null;
}

export interface BinaryExpression extends ASTNode {
  type: "BinaryExpression";
  operator: string;
  left: ASTNode;
  right: ASTNode;
}

export interface AssignmentExpression extends ASTNode {
  type: "AssignmentExpression";
  left: ASTNode;
  right: ASTNode;
}

export interface Identifier extends ASTNode {
  type: "Identifier";
  name: string;
}

export interface VariableStatement extends ASTNode {
  type: "VariableStatement";
  declaration: ASTNode;
}

export interface VariableDeclaration extends ASTNode {
  type: "VariableDeclaration";
  id: Identifier;
  init: ASTNode | null;
}

export interface IfStatement extends ASTNode {
  type: "IfStatement";
  test: ASTNode;
  consequent: ASTNode;
  alternate: ASTNode | null;
}

export interface UnaryExpression extends ASTNode {
  type: "UnaryExpression";
  operator: string;
  argument: ASTNode;
}

export interface WhileStatement extends ASTNode {
  type: "WhileStatement";
  test: ASTNode;
  body: ASTNode;
}

export interface DoWhileStatement extends ASTNode {
  type: "DoWhileStatement";
  test: ASTNode;
  body: ASTNode;
}

export interface ForStatement extends ASTNode {
  type: "ForStatement";
  init: ASTNode | null;
  test: ASTNode | null;
  update: ASTNode | null;
  body: ASTNode;
}

export interface FunctionDeclaration extends ASTNode {
  type: "FunctionDeclaration";
  name: ASTNode;
  params: Array<ASTNode>;
  body: ASTNode;
}

export interface ReturnStatement extends ASTNode {
  type: "ReturnStatement";
  argument: ASTNode | null;
}

export interface MemberExpression extends ASTNode {
  type: "MemberExpression";
  computed: boolean;
  object: ASTNode;
  property: ASTNode;
}

export interface CallExpression extends ASTNode {
  type: "CallExpression";
  callee: ASTNode;
  args: Array<ASTNode>;
}

export interface ArrayLiteralExpression extends ASTNode {
  type: "ArrayLiteralExpression";
  elements: Array<ASTNode>;
}

export interface ScalarExpression extends ASTNode {
  type: "ScalarExpression";
  operator: string;
  left: ASTNode;
  right: ArrayLiteralExpression;
}

export interface ArrayExpression extends ASTNode {
  type: "ArrayExpression";
  operator: string;
  left: ArrayLiteralExpression;
  right: ASTNode;
}
