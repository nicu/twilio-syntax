export class Tree {
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;

  mod: number = 0;

  parent: Tree | null = null;
  children: Array<Tree> = [];

  value: string;
  className: string;
  constructor(
    value: any,
    className: string,
    children: Array<Tree> | null = null
  ) {
    this.className = className;

    this.value = value.toString();
    if (children) {
      this.children = children;
    }
    this.x = 0;
    this.y = 0;
    this.mod = 0;

    this.width = 120;
    this.height = 28;

    if (children) {
      children.forEach((child) => (child.parent = this));
    }
  }

  isLeaf() {
    return this.children.length === 0;
  }

  isLeftMost() {
    if (this.parent === null) {
      return true;
    }

    return this.parent.children[0] === this;
  }

  isRightMost() {
    if (this.parent === null) {
      return true;
    }

    return this.parent.children[this.parent.children.length - 1] === this;
  }

  getPreviousSibling() {
    if (this.parent == null || this.isLeftMost()) {
      return null;
    }

    return this.parent.children[this.parent.children.indexOf(this) - 1];
  }

  getNextSibling() {
    if (this.parent == null || this.isRightMost()) {
      return null;
    }

    return this.parent.children[this.parent.children.indexOf(this) + 1];
  }

  getLeftMostSibling() {
    if (this.parent == null) return null;

    if (this.isLeftMost()) return this;

    return this.parent.children[0];
  }

  getLeftMostChild() {
    if (this.children.length == 0) return null;

    return this.children[0];
  }

  getRightMostChild() {
    if (this.children.length == 0) return null;

    return this.children[this.children.length - 1];
  }
}

export class TreeLayout {
  // nodeSize: number = 80;
  siblingDistance: number = 20;
  treeDistance: number = this.siblingDistance + 10;

  maxX: number = 0;
  maxY: number = 0;

  autoLayout(rootNode: Tree) {
    this.maxX = 0;
    this.maxY = 0;

    // initialize node x, y, and mod values
    this.initializeNodes(rootNode, 0);

    // assign initial X and Mod values for nodes
    this.calculateInitialX(rootNode);

    // ensure no node is being drawn off screen
    this.checkAllChildrenOnScreen(rootNode);

    // assign final X values to nodes
    this.calculateFinalPositions(rootNode, 0);

    return [this.maxX, this.maxY];
  }

  initializeNodes(node: Tree, depth: number) {
    node.x = -1;
    node.y = depth;
    node.mod = 0;

    node.children?.forEach((child) => {
      this.initializeNodes(child, depth + 1);
    });
  }

  calculateInitialX(node: Tree) {
    node.children?.forEach((child) => this.calculateInitialX(child));

    if (node.isLeaf()) {
      if (!node.isLeftMost()) {
        node.x =
          // node.getPreviousSibling()!.x + this.nodeSize + this.siblingDistance;
          node.getPreviousSibling()!.x +
          node.getPreviousSibling()!.width +
          this.siblingDistance;
      } else {
        node.x = 0;
      }
    } else if (node.children.length === 1) {
      if (node.isLeftMost()) {
        node.x = node.children[0].x;
      } else {
        node.x =
          // node.getPreviousSibling()!.x + this.nodeSize + this.siblingDistance;
          node.getPreviousSibling()!.x +
          node.getPreviousSibling()!.width +
          this.siblingDistance;
        node.mod = node.x - node.children[0].x;
      }
    } else {
      const leftChild = node.getLeftMostChild()!;
      const rightChild = node.getRightMostChild()!;

      // const mid = (leftChild.x + rightChild.x) / 2;
      const mid =
        (rightChild.x +
          rightChild.width / 2 -
          (leftChild.x + leftChild.width / 2)) /
        2;
      /* +
        node.x +
        node.width / 2 */

      if (node.isLeftMost()) {
        node.x = leftChild.x + mid;
      } else {
        // node.x = node.getPreviousSibling()!.x + this.nodeSize + this.siblingDistance;

        node.x =
          node.getPreviousSibling()!.x +
          // node.getPreviousSibling()!.width / 2 +
          node.getPreviousSibling()!.width +
          this.siblingDistance;

        node.mod = node.x - mid;
      }
    }

    if (node.children.length && !node.isLeftMost()) {
      this.checkForConflicts(node);
    }
  }

  checkAllChildrenOnScreen(node: Tree) {
    const nodeContour: Map<number, any> = new Map();
    this.getLeftContour(node, 0, nodeContour);

    let shiftAmount = 0;
    for (let y of nodeContour.keys()) {
      if (nodeContour.get(y) + shiftAmount < 0) {
        shiftAmount = nodeContour.get(y) * -1;
      }
    }

    if (shiftAmount > 0) {
      node.x += shiftAmount;
      node.mod += shiftAmount;
    }
  }

  calculateFinalPositions(node: Tree, modSum: number) {
    node.x += modSum;
    node.y = node.y * 100;
    modSum += node.mod;

    if (this.maxX < node.x + node.width) {
      this.maxX = node.x + node.width;
    }

    if (this.maxY < node.y + node.height) {
      this.maxY = node.y + node.height;
    }

    node.children.forEach((child) => {
      this.calculateFinalPositions(child, modSum);
    });

    // if (node.children.length == 0) {
    //   node.width = node.x;
    //   node.height = node.y;
    // } else {
    //   node.width = node.children[0].width;
    //   node.height = node.children[0].height;
    // }
  }

  checkForConflicts(node: Tree) {
    // const minDistance = this.treeDistance + this.nodeSize;
    const minDistance = this.treeDistance + node.width;
    let shiftValue = 0;

    const nodeContour: Map<number, any> = new Map();
    this.getLeftContour(node, 0, nodeContour);

    let sibling = node.getLeftMostSibling();
    while (sibling !== null && sibling !== node) {
      const siblingContour: Map<number, any> = new Map();
      this.getRightContour(sibling, 0, siblingContour);

      const maxNodeLevel = Math.max.apply(Math, Array.from(nodeContour.keys()));
      // const maxNodeLevel = nodeContour.length;
      const maxSiblingLevel = Math.max.apply(
        Math,
        Array.from(siblingContour.keys())
      );
      const maxLevel = Math.min(maxNodeLevel, maxSiblingLevel);

      for (let level = node.y + 1; level <= maxLevel; level++) {
        const distance = nodeContour.get(level) - siblingContour.get(level);
        if (distance + shiftValue < minDistance) {
          shiftValue = Math.max(minDistance - distance, shiftValue);
        }
      }

      if (shiftValue > 0) {
        this.centerNodesBetween(node, sibling);
      }

      sibling = sibling.getNextSibling();
    }

    if (shiftValue > 0) {
      node.x += shiftValue;
      node.mod += shiftValue;
      shiftValue = 0;
    }

    // center node in the middle of its children
    const left = node.getLeftMostChild();
    const right = node.getRightMostChild();

    if (left && right && left !== right) {
      const middle = node.mod + (left.x + (right.x - left.x) / 2);
      node.x = middle;
    }
  }

  centerNodesBetween(leftNode: Tree, rightNode: Tree) {
    const leftIndex = leftNode.parent!.children.indexOf(leftNode);
    const rightIndex = leftNode.parent!.children.indexOf(rightNode);

    const numNodesBetween = rightIndex - leftIndex - 1;

    if (numNodesBetween > 0) {
      const distanceBetweenNodes =
        (leftNode.x - rightNode.x) / (numNodesBetween + 1);

      let count = 1;
      for (let i = leftIndex + 1; i < rightIndex; i++) {
        const middleNode = leftNode.parent!.children[i];

        const desiredX = rightNode.x + distanceBetweenNodes * count;
        const offset = desiredX - middleNode.x;
        middleNode.x += offset;
        middleNode.mod += offset;

        count++;
      }

      this.checkForConflicts(leftNode);
    }
  }

  getLeftContour(node: Tree, modSum: number, values: Map<number, any>) {
    if (!values.has(node.y)) {
      values.set(node.y, node.x + modSum);
    } else {
      values.set(node.y, Math.min(values.get(node.y), node.x + modSum));
    }

    modSum += node.mod;

    node.children.forEach((child) =>
      this.getLeftContour(child, modSum, values)
    );
  }

  getRightContour(node: Tree, modSum: number, values: Map<number, any>) {
    if (!values.has(node.y)) {
      values.set(node.y, node.x + modSum);
    } else {
      values.set(node.y, Math.max(values.get(node.y), node.x + modSum));
    }

    modSum += node.mod;

    node.children.forEach((child) =>
      this.getRightContour(child, modSum, values)
    );
  }
}

export function transformAST(astNode: any): Tree {
  switch (astNode.type) {
    case "StatementList":
      return new Tree(
        "Statements",
        "statement-list",
        astNode.statements.map(transformAST)
      );

    case "ExpressionStatement":
      return new Tree("Expression", "expression-statement", [
        transformAST(astNode.expression),
      ]);

    case "BlockStatement":
      return new Tree(
        "Block",
        "block-statement",
        Array.isArray(astNode.body)
          ? astNode.body.map(transformAST)
          : astNode.body
          ? [transformAST(astNode.body)]
          : []
      );
      break;

    case "EmptyStatement":
      return new Tree("Empty", "empty-statement");

    case "BinaryExpression":
      return new Tree(astNode.operator, "binary-expression", [
        transformAST(astNode.left),
        transformAST(astNode.right),
      ]);

    case "LogicalExpression":
      return new Tree(astNode.operator, "logical-expression", [
        transformAST(astNode.left),
        transformAST(astNode.right),
      ]);

    case "MemberExpression":
      return new Tree("member", "member-expression", [
        transformAST(astNode.object),
        transformAST(astNode.property),
      ]);

    case "Identifier":
      return new Tree(astNode.name, "identifier");

    case "ArrayLiteralExpression":
      return new Tree(
        "array",
        "array-literal",
        astNode.elements.map(transformAST)
      );

    case "NumericLiteral":
      return new Tree(astNode.value, "numeric-literal");

    case "StringLiteral":
      return new Tree(`"${astNode.value}"`, "string-literal");

    case "AssignmentExpression":
      return new Tree("=", "assignment-expression", [
        transformAST(astNode.left),
        transformAST(astNode.right),
      ]);

    case "VariableStatement":
      return new Tree("var", "variable-statement", [
        transformAST(astNode.declaration),
      ]);

    case "VariableDeclaration":
      return new Tree(
        "set",
        "variable-statement",
        [transformAST(astNode.id)].concat(
          astNode.init ? transformAST(astNode.init) : []
        )
      );

    case "IfStatement": {
      return new Tree("if", "if-statement", [
        new Tree("[cond]", "if-condition-statement helper", [
          transformAST(astNode.test),
        ]),
        new Tree("[then]", "if-then-statement helper", [
          transformAST(astNode.consequent),
        ]),
        new Tree(
          "[else]",
          "if-else-statement helper",
          astNode.alternate && [transformAST(astNode.alternate)]
        ),
      ]);
    }

    case "BooleanLiteral":
      return new Tree(astNode.value, "boolean-literal keyword");

    case "NullLiteral":
      return new Tree("null", "null-literal keyword");

    case "UnaryExpression":
      return new Tree(
        astNode.operator === "!" ? "not" : astNode.operator,
        "unary-expression",
        [transformAST(astNode.argument)]
      );

    case "WhileStatement":
      return new Tree("while", "while-statement keyword", [
        new Tree("cond", "while-condition", [transformAST(astNode.test)]),
        new Tree("body", "while-condition-body", [transformAST(astNode.body)]),
      ]);

    case "DoWhileStatement":
      return new Tree("do while", "do-while-statement keyword", [
        new Tree("cond", "do-while-condition", [transformAST(astNode.test)]),
        new Tree("body", "do-while-condition-body", [
          transformAST(astNode.body),
        ]),
      ]);

    case "ForStatement":
      return new Tree("for", "for-statement keyword", [
        new Tree(
          "[init]",
          "for-init helper",
          astNode.init && [transformAST(astNode.init)]
        ),
        new Tree(
          "[test]",
          "for-test helper",
          astNode.test && [transformAST(astNode.test)]
        ),
        new Tree(
          "[update]",
          "for-update helper",
          astNode.update && [transformAST(astNode.update)]
        ),
        new Tree("[body]", "for-body helper", [transformAST(astNode.body)]),
      ]);

    case "FunctionDeclaration":
      return new Tree(`call ${astNode.name.name}`, "function-declaration", [
        new Tree(
          "params",
          "function-parameters helper",
          astNode.params.map(transformAST)
        ),
        new Tree("body", "function-body helper", [transformAST(astNode.body)]),
      ]);

    case "ReturnStatement":
      return new Tree("return", "return-statement", [
        transformAST(astNode.argument),
      ]);

    case "CallExpression":
      return new Tree(`call`, "call-expression", [
        transformAST(astNode.callee),
        new Tree(
          "args",
          "call-expression-args helper",
          astNode.args.map(transformAST)
        ),
      ]);

    case "ScalarExpression":
      return new Tree(astNode.operator, "scalar-expression", [
        transformAST(astNode.left),
        transformAST(astNode.right),
      ]);

    case "ArrayExpression":
      return new Tree(astNode.operator, "array-expression", [
        transformAST(astNode.left),
        transformAST(astNode.right),
      ]);

    case "Error":
      return new Tree(astNode.value, "error");

    default:
      throw new Error(`Unexpected node type: ${astNode.type}`);
  }
}

export function draw(node: Tree) {
  let output = `<div class="ast-node bg-${node.className}" style="left: ${node.x}px; top: ${node.y}px; width: ${node.width}px">${node.value}</div>`;

  if (node.children) {
    node.children.forEach((child) => {
      output += draw(child);
    });
  }

  return output;
}

function midPoint(parent: Tree, child: Tree): any {
  if (parent.x < child.x) {
    return {
      x: (child.x - parent.x) / 2,
      y: (child.y - parent.y + 20) / 2,
    };
  }

  return {
    x: (parent.x - child.x) / 2,
    y: (child.y - parent.y + 20) / 2,
  };
}

export function drawConnections(node: Tree, output: SVGElement) {
  if (node.children) {
    node.children.forEach((child) => {
      var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const mid = midPoint(node, child);

      const line = [
        [node.x + node.width / 2, node.y],
        [node.x + node.width / 2, node.y + mid.y],
        [child.x + child.width / 2, node.y + mid.y],
        [child.x + child.width / 2, child.y],
      ];

      path.setAttribute(
        "d",
        `M${line.map((point) => point.join(",")).join(" L")}`
      );
      output.appendChild(path);
      drawConnections(child, output);
    });
  }
}
