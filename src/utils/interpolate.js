import { Spline } from "./spline";
import { Vec } from "@tldraw/vec";
import { useCallback } from "react";

const MAX_INTERVAL = 300;

export default class Interpolator {
  state = "idle";
  queue = [];
  timestamp = performance.now();
  timeoutId = null;
  prevPoint = null;
  spline = new Spline();
  currAnimation = null;
  startAnimation = performance.now();
  cb = () => {};

  constructor(callback) {
    this.cb = callback;
  }

  addPoint = (mouse) => {
    clearTimeout(this.timeoutId);
    const now = performance.now();
    const duration = Math.min(now - this.timestamp, MAX_INTERVAL);
    const point = [mouse.x, mouse.y];
    if (!this.prevPoint) {
      this.spline.clear();
      this.prevPoint = point;
      this.spline.addPoint(point);
      this.cb(point);
      this.state = "stopped";
      return;
    }
    if (this.state === "stopped") {
      if (Vec.dist(this.prevPoint, point) < 4) {
        this.cb(point);
        return;
      }
      this.spline.clear();
      this.spline.addPoint(this.prevPoint);
      this.spline.addPoint(this.prevPoint);
      this.spline.addPoint(point);
      this.state = "idle";
    } else {
      this.spline.addPoint(point);
    }
    if (duration < 16) {
      this.prevPoint = point;
      this.timestamp = now;
      this.cb(point);
      return;
    }
    const animation = {
      start: this.spline.points.length - 3,
      from: this.prevPoint,
      to: point,
      duration,
    };

    this.prevPoint = point;
    this.timestamp = now;

    switch (this.state) {
      case "idle": {
        this.state = "animating";
        this.currAnimation = animation;
        this.startAnimation = performance.now();
        this.drawSpline();
        break;
      }
      case "animating": {
        this.queue.push(animation);
        break;
      }
    }
  };

  drawSpline = () => {
    if (this.state == "animating") {
      const t =
        (performance.now() - this.startAnimation) / this.currAnimation.duration;

      if (t <= 1) {
        if (this.spline.points.length > 0) {
          try {
            const point = this.spline.getSplinePoint(
              t + this.currAnimation.start
            );
            this.cb(point);
          } catch (e) {
            console.warn(e);
          }
          return;
        }
      }
      const next = this.queue.shift();
      if (next) {
        this.state = "animating";
        this.currAnimation = next;
        this.startAnimation = performance.now();
      } else {
        this.state = "idle";
        this.timeoutId = setTimeout(() => {
          this.state = "stopped";
        }, MAX_INTERVAL);
      }
    }
  };
}
