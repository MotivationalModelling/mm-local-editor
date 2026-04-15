import {
  Graph,
  GraphLayout,
  Cell,
  CellPath,
  CompactTreeLayout,
  Rectangle,
} from "@maxgraph/core";

// Referencing the data type from:
// https://github.com/maxGraph/maxGraph/blob/3758ac4dce45c62862f320a665c29f3a29130ba5/packages/core/src/view/layout/CompactTreeLayout.ts#L270

export interface _mxCompactTreeLayoutNode {
  cell?: Cell;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  offsetX?: number;
  offsetY?: number;
  contour?: {
    upperTail?: _mxCompactTreeLayoutLine;
    upperHead?: _mxCompactTreeLayoutLine;
    lowerTail?: _mxCompactTreeLayoutLine;
    lowerHead?: _mxCompactTreeLayoutLine;
    [key: string]: any;
  };
  next?: _mxCompactTreeLayoutNode;
  child?: _mxCompactTreeLayoutNode;
  theta?: number;
}

export interface _mxCompactTreeLayoutLine {
  dx: number;
  dy: number;
  next: _mxCompactTreeLayoutLine;
  child?: _mxCompactTreeLayoutLine;
}

/**
 * Extends <mxGraphLayout> to implement auto-layout for Motivaitonal
 * Models.
 *
 * Optional arguments:
 * : levelDistance, default distance between goals at adjacent ranks
 * : nodeDistance, default distance between adjacent nodes at the same rank
 */
export class GoalModelLayout extends GraphLayout {
  constructor(
    graph: Graph,
    levelDistance: number | null,
    nodeDistance: number | null
  ) {
    super(graph);
    console.log("GoalModelLayout created ----------------------------------");
    this.levelDistance = levelDistance || 30;
    this.nodeDistance = nodeDistance || 30;
  }

  levelDistance: number;

  nodeDistance: number;

  // tracks parents that need to be updated if children are updated
  parentsChanged: { [id: string]: Cell } | null = null;

  parentX: number | null = null;
  parentY: number | null = null;

  // tracks cells that have already been visited by the DFS autolayout
  visited: { [key: string]: Cell } = {};

  // default horiztonal distance between edges exiting a vertex
  prefHozEdgeSep = 5;

  // default vertical offset between edges exiting a vertex
  prefVertEdgeOff = 4;

  // root of the tree - this is automatically determined unless passed
  // explicitly
  root: Cell | null = null;

  // internal representation of root cell - DO NOT TOUCH THIS
  node: _mxCompactTreeLayoutNode | null = null;

  /**
   * Determine whether vertex should be ignored for the purposes of
   * the autolayout algorithm.
   */
  isVertexIgnored(vertex: Cell): boolean {
    return (
      super.isVertexIgnored(vertex) ||
      this.graph.getConnections(vertex).length == 0
    );
  }

  /**
   * Executes the autolayout algorithm
   *
   * If the parent has any connected edges, then it is used as the root of
   * the tree. Else, <mxGraph.findTreeRoots> will be used to find a suitable
   * root node within the set of children of the given parent.
   *
   * Parameters:
   *
   * parent - <mxCell> whose children should be laid out.
   * root - Optional <mxCell> that will be used as the root of the tree.
   * Overrides <root> if specified.
   */
  execute(parent: Cell, root?: Cell): void {
    console.log("Executing layout with parent:", parent, "and root:", root);
    this.parent = parent;
    const model = this.graph.getDataModel();

    if (root == null) {
      // Takes the parent as the root if it has outgoing edges
      if (
        this.graph.getEdges(parent, parent.getParent(), false, true, false)
          .length > 0
      ) {
        this.root = parent;
      }

      // Tries to find a suitable root in the parent's children
      else {
        const roots = findTreeRoots(this.graph, parent, true, false);

        if (roots.length > 0) {
          for (let i = 0; i < roots.length; i++) {
            if (
              !this.isVertexIgnored(roots[i]) &&
              this.graph.getEdges(roots[i], null, false, true, false).length > 0
            ) {
              this.root = roots[i];
              break;
            }
          }
        }
      }
    } else {
      this.root = root;
    }

    // check if we need to resize or change the parent's location
    if (this.root != null) {
      this.parentsChanged = null;

      //  Maintaining parent location
      this.parentX = null;
      this.parentY = null;

      model.beginUpdate(); // start transaction

      try {
        this.visited = {};
        this.node = this.dfs(this.root, parent);

        if (this.node != null) {
          this.layout(this.node);
          const x0 = this.graph.gridSize;
          const y0 = x0;

          const bounds = this.verticalLayout(this.node, null, x0, y0);

          if (bounds != null) {
            let dx = 0;
            let dy = 0;

            if (bounds.x < 0) {
              dx = Math.abs(x0 - bounds.x);
            }

            if (bounds.y < 0) {
              dy = Math.abs(y0 - bounds.y);
            }

            if (dx != 0 || dy != 0) {
              this.moveNode(this.node, dx, dy);
            }
          }

          // Maintaining parent location
          if (this.parentX != null && this.parentY != null) {
            let geo = parent.getGeometry();

            if (geo != null) {
              geo = geo.clone();
              geo.x = this.parentX;
              geo.y = this.parentY;
              model.setGeometry(parent, geo);
            }
          }
        }
      } finally {
        model.endUpdate(); // end transaction
      }
    }
  }

  /**
   * Moves the specified node and all of its children by the given amount.
   */
  moveNode(node: any, dx: number, dy: number): void {
    node.x += dx;
    node.y += dy;
    this.apply(node);

    let child = node.child;

    while (child != null) {
      this.moveNode(child, dx, dy);
      child = child.next;
    }
  }

  /**
   * Does a depth first search starting at the specified cell.
   * Makes sure the specified parent is never left by the
   * algorithm.
   */
  dfs(cell: Cell, parent: Cell) {
    const id = CellPath.create(cell);
    let node = null;

    if (
      cell != null &&
      this.visited[id] == null &&
      !this.isVertexIgnored(cell)
    ) {
      this.visited[id] = cell;
      node = this.createNode(cell);

      // const model = this.graph.getDataModel();
      let prev = null;
      const out = this.graph.getEdges(cell, parent, false, true, false, true);
      const view = this.graph.getView();

      for (let i = 0; i < out.length; i++) {
        const edge = out[i];

        if (!this.isEdgeIgnored(edge)) {
          // Checks if terminal in same swimlane
          const state = view.getState(edge);
          const target =
            state != null
              ? (state.getVisibleTerminal(false) as Cell)
              : (view.getVisibleTerminal(edge, false) as Cell);
          const tmp = this.dfs(target, parent);

          if (tmp != null && target.getGeometry() != null) {
            if (prev == null) {
              node.child = tmp;
            } else {
              prev.next = tmp;
            }

            prev = tmp;
          }
        }
      }
    }

    return node;
  }

  /**
   * Function: verticalLayout
   */
  verticalLayout(
    node: _mxCompactTreeLayoutNode,
    parent: _mxCompactTreeLayoutNode | null,
    x0: number,
    y0: number,
    bounds: Rectangle | null = null
  ): Rectangle | null {
    const offsetX = node.offsetX as number;
    const offsetY = node.offsetY as number;
    node.x = (node.x as number) + x0 + offsetY;
    node.y = (node.y as number) + y0 + offsetX;
    bounds = this.apply(node, bounds);
    const child = node.child;

    if (child != null) {
      bounds = this.verticalLayout(child, node, node.x, node.y, bounds);
      const childOffsetY = child.offsetY as number;
      let siblingOffset = node.x + childOffsetY;
      let s = child.next;

      while (s != null) {
        const childOffsetX = child.offsetX as number;
        bounds = this.verticalLayout(
          s,
          node,
          siblingOffset,
          node.y + childOffsetX,
          bounds
        );
        siblingOffset += s.offsetY as number;
        s = s.next;
      }
    }

    return bounds;
  }

  /**
   * Function: createNode
   */
  createNode(cell: Cell): _mxCompactTreeLayoutNode {
    const node: _mxCompactTreeLayoutNode = {};
    node.cell = cell;
    node.x = 0;
    node.y = 0;
    node.width = 0;
    node.height = 0;

    const geo = this.getVertexBounds(cell);

    if (geo != null) {
      node.width = geo.width;
      node.height = geo.height;
    }

    node.offsetX = 0;
    node.offsetY = 0;
    node.contour = new Object();

    return node;
  }

  /**
   * Executes compact tree layout algorithm  at the given node.
   */
  layout(node: any): void {
    if (node != null) {
      let child = node.child;

      while (child != null) {
        this.layout(child);
        child = child.next;
      }

      if (node.child != null) {
        this.attachParent(node, this.join(node));
      } else {
        this.layoutLeaf(node);
      }
    }
  }

  /**
   * Function: layoutLeaf
   */
  layoutLeaf(node: any): void {
    const dist = 2 * this.nodeDistance;

    node.contour.upperTail = this.createLine(node.height + dist, 0);
    node.contour.upperHead = node.contour.upperTail;
    node.contour.lowerTail = this.createLine(0, -node.width - dist);
    node.contour.lowerHead = this.createLine(
      node.height + dist,
      0,
      node.contour.lowerTail
    );
  }

  /**
   * Function: join
   */
  join(node: any): number {
    const dist = 2 * this.nodeDistance;

    let child = node.child;
    node.contour = child.contour;
    let h = child.width + dist;
    let sum = h;
    child = child.next;

    while (child != null) {
      const d = this.merge(node.contour, child.contour);
      child.offsetY = d + h;
      child.offsetX = 0;
      h = child.width + dist;
      sum += d + h;
      child = child.next;
    }

    return sum;
  }

  /**
   * Function: merge
   */
  merge(p1: any, p2: any): number {
    let x = 0;
    let y = 0;
    let total = 0;

    let upper = p1.lowerHead;
    let lower = p2.upperHead;

    while (lower != null && upper != null) {
      const d = this.offset(x, y, lower.dx, lower.dy, upper.dx, upper.dy);
      y += d;
      total += d;

      if (x + lower.dx <= upper.dx) {
        x += lower.dx;
        y += lower.dy;
        lower = lower.next;
      } else {
        x -= upper.dx;
        y -= upper.dy;
        upper = upper.next;
      }
    }

    if (lower != null) {
      const b = this.bridge(p1.upperTail, 0, 0, lower, x, y);
      p1.upperTail = b.next != null ? p2.upperTail : b;
      p1.lowerTail = p2.lowerTail;
    } else {
      const b = this.bridge(p2.lowerTail, x, y, upper, 0, 0);

      if (b.next == null) {
        p1.lowerTail = b;
      }
    }

    p1.lowerHead = p2.lowerHead;

    return total;
  }

  /**
   * Function: offset
   */
  offset(
    p1: number,
    p2: number,
    a1: number,
    a2: number,
    b1: number,
    b2: number
  ): number {
    let d = 0;

    if (b1 <= p1 || p1 + a1 <= 0) {
      return 0;
    }

    const t = b1 * a2 - a1 * b2;

    if (t > 0) {
      if (p1 < 0) {
        const s = p1 * a2;
        d = s / a1 - p2;
      } else if (p1 > 0) {
        const s = p1 * b2;
        d = s / b1 - p2;
      } else {
        d = -p2;
      }
    } else if (b1 < p1 + a1) {
      const s = (b1 - p1) * a2;
      d = b2 - (p2 + s / a1);
    } else if (b1 > p1 + a1) {
      const s = (a1 + p1) * b2;
      d = s / b1 - (p2 + a2);
    } else {
      d = b2 - (p2 + a2);
    }

    if (d > 0) {
      return d;
    } else {
      return 0;
    }
  }

  /**
   * Function: bridge
   */
  bridge(
    line1: _mxCompactTreeLayoutLine,
    x1: number,
    y1: number,
    line2: _mxCompactTreeLayoutLine,
    x2: number,
    y2: number
  ) {
    const dx = x2 + line2.dx - x1;
    let dy = 0;
    let s = 0;

    if (line2.dx == 0) {
      dy = line2.dy;
    } else {
      s = dx * line2.dy;
      dy = s / line2.dx;
    }

    const r = this.createLine(dx, dy, line2.next);
    line1.next = this.createLine(0, y2 + line2.dy - dy - y1, r);

    return r;
  }

  /**
   * Function: attachParent
   */
  attachParent(node: any, height: number): void {
    const x = this.nodeDistance + this.levelDistance;
    const y2 = (height - node.width) / 2 - this.nodeDistance;
    const y1 = y2 + node.width + 2 * this.nodeDistance - height;

    node.child.offsetX = x + node.height;
    node.child.offsetY = y1;

    node.contour.upperHead = this.createLine(
      node.height,
      0,
      this.createLine(x, y1, node.contour.upperHead)
    );
    node.contour.lowerHead = this.createLine(
      node.height,
      0,
      this.createLine(x, y2, node.contour.lowerHead)
    );
  }

  /**
   * Function: apply
   */
  apply(
    node: _mxCompactTreeLayoutNode,
    bounds: Rectangle | null = null
  ): Rectangle | null {
    // const model = this.graph.getDataModel();
    const cell = node.cell as Cell;
    let g: Rectangle = cell.getGeometry() as Rectangle;

    if (cell != null && g != null) {
      if (this.isVertexMovable(cell)) {
        g = this.setVertexLocation(
          cell,
          node.x as number,
          node.y as number
        ) as Rectangle;
      }

      if (bounds == null) {
        bounds = new Rectangle(g.x, g.y, g.width, g.height);
      } else {
        bounds = new Rectangle(
          Math.min(bounds.x, g.x),
          Math.min(bounds.y, g.y),
          Math.max(bounds.x + bounds.width, g.x + g.width),
          Math.max(bounds.y + bounds.height, g.y + g.height)
        );
      }
    }

    return bounds;
  }

  /**
   * Function: createLine
   */
  createLine(
    dx: number,
    dy: number,
    next: any = null
  ): _mxCompactTreeLayoutLine {
    const line = {dx, dy, next};

    return line;
  }
}

/**
 * Utilizing with typescript https://github.com/maxGraph/maxGraph/blob/3758ac4dce45c62862f320a665c29f3a29130ba5/packages/core/src/util/treeTraversal.ts
 * This function is imported manually since it can't be import through @maxgraph/core
 */

function findTreeRoots(
  graph: Graph,
  parent: Cell,
  isolate = false,
  invert = false
) {
  const roots: Cell[] = [];
  console.log("finding roots", parent);
  if (parent != null) {
    let best = null;
    let maxDiff = 0;

    for (const cell of parent.getChildren()) {
      if (cell.isVertex() && cell.isVisible()) {
        const conns = graph.getConnections(cell, isolate ? parent : null);
        let fanOut = 0;
        let fanIn = 0;

        for (let j = 0; j < conns.length; j++) {
          const src = graph.view.getVisibleTerminal(conns[j], true);

          if (src == cell) {
            fanOut++;
          } else {
            fanIn++;
          }
        }

        if (
          (invert && fanOut == 0 && fanIn > 0) ||
          (!invert && fanIn == 0 && fanOut > 0)
        ) {
          roots.push(cell);
        }

        const diff = invert ? fanIn - fanOut : fanOut - fanIn;

        if (diff > maxDiff) {
          maxDiff = diff;
          best = cell;
        }
      }
    }

    if (roots.length == 0 && best != null) {
      roots.push(best);
    }
  }
  return roots;
}

// Could replace the customized GoalModelLayout
// export class CustomLayout extends CompactTreeLayout{
//     constructor(graph: Graph){
//         super(graph);
//     }

//     levelDistance: number = 60;
//     nodeDistance: number = 60;
// }
