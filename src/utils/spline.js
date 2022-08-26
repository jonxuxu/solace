import { Vec } from "@tldraw/vec";

export class Spline {
  points = [];
  lengths = [];

  totalLength = 0;

  prev;

  constructor(points = []) {
    this.points = points;
    this.lengths = points.map((point, i, arr) =>
      i === 0 ? 0 : Vec.dist(point, arr[i - 1])
    );
    this.totalLength = this.lengths.reduce((acc, cur) => acc + cur, 0);
  }

  addPoint = (point) => {
    if (this.prev) {
      const length = Vec.dist(this.prev, point);
      this.lengths.push(length);
      this.totalLength += length;
      this.points.push(point);
    }
    this.prev = point;
  };

  clear = () => {
    this.points = this.prev ? [this.prev] : [];
    this.totalLength = 0;
  };

  getSplinePoint = (rt) => {
    const { points } = this;
    const l = points.length - 1,
      d = Math.trunc(rt),
      p1 = Math.min(d + 1, l),
      p2 = Math.min(p1 + 1, l),
      p3 = Math.min(p2 + 1, l),
      p0 = p1 - 1,
      t = rt - d;
    const tt = t * t,
      ttt = tt * t,
      q1 = -ttt + 2 * tt - t,
      q2 = 3 * ttt - 5 * tt + 2,
      q3 = -3 * ttt + 4 * tt + t,
      q4 = ttt - tt;
    return [
      (points[p0][0] * q1 +
        points[p1][0] * q2 +
        points[p2][0] * q3 +
        points[p3][0] * q4) /
        2,
      (points[p0][1] * q1 +
        points[p1][1] * q2 +
        points[p2][1] * q3 +
        points[p3][1] * q4) /
        2,
    ];
  };
}
