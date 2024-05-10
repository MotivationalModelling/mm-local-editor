/**
 * This file also exist in @maxgrah package along with corresponding changes on other files
 * but for some reason, the registered shape can't be used on GraphWorkder
 * So I have created this file for register the shapes again
 */

import {
  ActorShape,
  Rectangle,
  AbstractCanvas2D,
  constants,
  Point,
  utils,
  CellRenderer,
  Shape,
} from "@maxgraph/core";

// custom shape name
const HEART_SHAPE = "heartShape";
const PARALLELOGRAM_SHAPE = "parallelogramShape";
const CLOUD_SHAPE = "cloudShape";
const NEGATIVE_SHAPE = "negativeShape";
const PERSON_SHAPE = "personShape";

export {
  HEART_SHAPE,
  PARALLELOGRAM_SHAPE,
  CLOUD_SHAPE,
  NEGATIVE_SHAPE,
  PERSON_SHAPE,
};

export const registerCustomShapes = (): void => {
  CellRenderer.registerShape(PARALLELOGRAM_SHAPE, ParallelogramShape);
  CellRenderer.registerShape(HEART_SHAPE, HeartShape);
  CellRenderer.registerShape(NEGATIVE_SHAPE, NegativeShape);
  CellRenderer.registerShape(PERSON_SHAPE, PersonShape);
  CellRenderer.registerShape(CLOUD_SHAPE, MMCloudShape);
  console.log("Custom shapes registered");
};

// Define shpaes for goals
// Parallelogram shape
class ParallelogramShape extends ActorShape {
  constructor(
    bounds: Rectangle,
    fill: string,
    stroke: string,
    strokeWidth = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
    this.startSize = 0.12;
  }

  isRoundable(): boolean {
    return true;
  }

  /**
   * Draws the path for this parallelogram shape.
   */
  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const dx =
      w *
      Math.max(
        0,
        Math.min(
          1,
          parseFloat(utils.getValue(this.style, "startSize", this.startSize))
        )
      );
    const arcSize =
      utils.getValue(this.style, "arcSize", constants.LINE_ARCSIZE) / 2;
    const points: Point[] = [
      new Point(0, h),
      new Point(dx, 0),
      new Point(w, 0),
      new Point(w - dx, h),
    ];
    this.addPoints(c, points, this.isRounded, arcSize, true);
    c.end();
  }
}

// Heart shape
class HeartShape extends ActorShape {
  constructor(
    bounds: Rectangle,
    fill: string,
    stroke: string,
    strokeWidth = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  isRoundable(): boolean {
    return true;
  }

  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    c.moveTo(w / 2, 0.1 * h);
    c.curveTo((0.85 * w) / 2, 0.02 * h, (0.65 * w) / 2, 0, (0.55 * w) / 2, 0);
    c.curveTo((0.35 * w) / 2, 0, 0, 0.05 * h, 0, 0.35 * h);

    c.curveTo(0, 0.55 * h, (0.4 * w) / 2, 0.75 * h, (0.7 * w) / 2, 0.87 * h);
    c.curveTo((0.85 * w) / 2, 0.93 * h, (0.98 * w) / 2, 0.98 * h, w / 2, h);

    c.curveTo(
      w - (0.98 * w) / 2,
      0.98 * h,
      w - (0.85 * w) / 2,
      0.93 * h,
      w - (0.7 * w) / 2,
      0.87 * h
    );
    c.curveTo(w - (0.4 * w) / 2, 0.75 * h, w, 0.55 * h, w, 0.35 * h);
    c.curveTo(w, 0.05 * h, w - (0.35 * w) / 2, 0, w - (0.55 * w) / 2, 0);
    c.curveTo(
      w - (0.65 * w) / 2,
      0,
      w - (0.85 * w) / 2,
      0.02 * h,
      w / 2,
      0.1 * h
    );
    c.close();
  }
}

// Negative shape
class NegativeShape extends ActorShape {
  constructor(
    bounds: Rectangle,
    fill: string,
    stroke: string,
    strokeWidth = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  isRoundable(): boolean {
    return true;
  }

  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    const width = w / 2;
    c.moveTo(width, 0);
    c.curveTo(
      0.98 * width,
      0.02 * h,
      0.9 * width,
      0.07 * width,
      0.7 * width,
      0.13 * h
    );
    c.curveTo(0.4 * width, 0.25 * h, 0, 0.45 * h, 0, 0.65 * h);
    c.curveTo(0, 0.95 * h, 0.35 * width, h, 0.45 * width, h);
    c.curveTo(0.65 * width, h, 0.85 * width, 0.98 * h, width, 0.9 * h);

    c.curveTo(
      w - (0.85 * w) / 2,
      0.98 * h,
      w - 0.65 * width,
      h,
      w - 0.45 * width,
      h
    );
    c.curveTo(w - 0.35 * width, h, w, 0.95 * h, w, 0.65 * h);
    c.curveTo(
      w,
      0.45 * h,
      w - 0.4 * width,
      0.25 * h,
      w - 0.7 * width,
      0.13 * h
    );
    c.curveTo(w - 0.85 * width, 0.07 * h, w - 0.98 * width, 0.02 * h, width, 0);
    c.close();
  }
}

// Person shape
class PersonShape extends ActorShape {
  constructor(
    bounds: Rectangle,
    fill: string,
    stroke: string,
    strokeWidth = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  isRoundable(): boolean {
    return true;
  }

  paintVertexShape(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    c.translate(x + w / 3, y);
    c.begin();
    this.redrawPath(c, x, y, w, h);
    c.fillAndStroke();
  }

  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    w = w / 3.5;
    c.moveTo(0.02 * w, 0.55 * h);
    c.lineTo(0.02 * w, 0.25 * h);

    //shoulder
    c.curveTo(0.02 * w, 0.2 * h, 0.12 * w, 0.18 * h, w / 6, 0.17 * h);
    c.lineTo(0.3 * w, 0.17 * h);

    //neck
    c.curveTo(0.33 * w, 0.18 * h, 0.4 * w, 0.2 * h, w / 2, 0.2 * h);
    c.curveTo(0.6 * w, 0.2 * h, 0.67 * w, 0.18 * h, 0.7 * w, 0.17 * h);

    // shoulder
    c.lineTo((5 / 6) * w, 0.17 * h);
    c.curveTo(0.87 * w, 0.18 * h, w, 0.2 * h, 0.98 * w, 0.25 * h);

    c.lineTo(0.98 * w, 0.55 * h);

    //hand
    c.curveTo(0.98 * w, 0.56 * h, 0.94 * w, 0.58 * h, 0.88 * w, 0.58 * h);
    c.curveTo(0.85 * w, 0.58 * h, 0.78 * w, 0.57 * h, 0.78 * w, 0.55 * h);

    c.lineTo(0.78 * w, 0.3 * h);
    c.lineTo(0.78 * w, 0.9 * h);

    //leg
    c.curveTo(0.78 * w, 0.92 * h, 0.75 * w, 0.95 * h, 0.64 * w, 0.95 * h);
    c.curveTo(0.58 * w, 0.95 * h, w / 2, 0.92 * h, w / 2, 0.9 * h);

    c.lineTo(w / 2, 0.58 * h);
    c.lineTo(w / 2, 0.9 * h);

    //leg
    c.curveTo(w / 2, 0.92 * h, 0.42 * w, 0.95 * h, 0.36 * w, 0.95 * h);
    c.curveTo(0.25 * w, 0.95 * h, 0.22 * w, 0.92 * h, 0.22 * w, 0.9 * h);

    c.lineTo(0.22 * w, 0.3 * h);
    c.lineTo(0.22 * w, 0.55 * h);

    // hand
    c.curveTo(0.22 * w, 0.57 * h, 0.15 * w, 0.58 * h, 0.12 * w, 0.58 * h);
    c.curveTo(0.05 * w, 0.58 * h, 0.02 * w, 0.56 * h, 0.02 * w, 0.55 * h);

    // head
    c.moveTo(w / 2, h / 6);
    c.curveTo(
      w / 2 - 0.1 * h,
      h / 6,
      w / 2 - 0.1 * h,
      0.02 * h,
      w / 2,
      0.02 * h
    );
    c.curveTo(w / 2 + 0.1 * h, 0.02 * h, w / 2 + 0.1 * h, h / 6, w / 2, h / 6);
    c.close();
  }
}

// Cloud shape
class MMCloudShape extends ActorShape {
  constructor(
    bounds: Rectangle,
    fill: string,
    stroke: string,
    strokeWidth = 1
  ) {
    super();
    this.bounds = bounds;
    this.fill = fill;
    this.stroke = stroke;
    this.strokeWidth = strokeWidth;
  }

  isRoundable(): boolean {
    return true;
  }

  redrawPath(
    c: AbstractCanvas2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): void {
    c.moveTo(0.2 * w, 0.3 * h);
    c.curveTo(0.19 * w, 0.14 * h, 0.32 * w, 0.05 * h, 0.38 * w, 0.14 * h);
    c.curveTo(0.45 * w, 0.01 * h, 0.55 * w, 0.01 * h, 0.62 * w, 0.14 * h);
    c.curveTo(0.68 * w, 0.05 * h, 0.81 * w, 0.14 * h, 0.8 * w, 0.3 * h);
    c.curveTo(0.95 * w, 0.33 * h, 0.95 * w, 0.67 * h, 0.8 * w, 0.7 * h);

    c.curveTo(0.81 * w, 0.86 * h, 0.68 * w, 0.95 * h, 0.62 * w, 0.86 * h);
    c.curveTo(0.55 * w, 0.99 * h, 0.45 * w, 0.99 * h, 0.38 * w, 0.86 * h);
    c.curveTo(0.32 * w, 0.95 * h, 0.19 * w, 0.86 * h, 0.2 * w, 0.7 * h);
    c.curveTo(0.05 * w, 0.67 * h, 0.05 * w, 0.33 * h, 0.2 * w, 0.3 * h);
    c.close();
  }
}
