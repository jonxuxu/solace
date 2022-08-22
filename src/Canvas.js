import React from "react";
import Sketch from "react-p5";
import "./App.css";

// constant parameters to control animation
const bigRippleSpeed = 0.1;
const smallRippleSpeed = 0.03;
const bigRippleMaxSize = 300;
const smallRippleMaxSize = 80;

function Canvas({ awareness }) {
  let bigRipples = [];
  let smallRipples = [];

  let lastSmallRipple = null;

  const mousePressed = (p5) => {
    awareness.setLocalStateField("canvasInfo", {
      click: {
        x: p5.mouseX,
        y: p5.mouseY,
        timestamp: Date.now(), // only used to ensure uniqueness
      },
    });
  };

  awareness.on("change", ({ updated }) => {
    if (updated) {
      const states = awareness.getStates();
      updated.forEach((clientID) => {
        const state = states.get(clientID);
        const { canvasInfo } = state;
        if (canvasInfo) {
          const { click, mouse } = canvasInfo;
          if (click) {
            const now = Date.now();
            bigRipples.push(
              { x: click.x, y: click.y, startTime: now },
              { x: click.x, y: click.y, startTime: now + 200 },
              { x: click.x, y: click.y, startTime: now + 400 }
            );
          }
          if (mouse) {
            const now = Date.now();
            smallRipples.push({ x: mouse.x, y: mouse.y, startTime: now });
          }
        }
      });
    }
  });

  const setup = (p5, canvasParentRef) => {
    let width = canvasParentRef.offsetWidth;
    let height = canvasParentRef.offsetHeight;
    let cnv = p5.createCanvas(width, height).parent(canvasParentRef);
  };

  const draw = (p5) => {
    const now = Date.now();
    p5.background(0);

    newSmallRipple(p5);

    p5.fill(0, 0);
    p5.strokeWeight(3);
    for (let i = bigRipples.length - 1; i >= 0; i--) {
      let ripple = bigRipples[i];
      let time = now - ripple.startTime;
      if (time > 0) {
        let keep = drawBigRipple(p5, ripple, time);
        if (!keep) {
          bigRipples.splice(i, 1);
        }
      }
    }

    p5.strokeWeight(2);
    for (let i = smallRipples.length - 1; i >= 0; i--) {
      let time = now - smallRipples[i].startTime;
      if (time > 0) {
        let keep = drawSmallRipple(p5, smallRipples[i], time);
        if (!keep) {
          smallRipples.splice(i, 1);
        }
      }
    }
  };

  const drawBigRipple = (p5, ripple, time) => {
    let radius = time * bigRippleSpeed;
    if (radius < bigRippleMaxSize) {
      let alpha = (bigRippleMaxSize - radius) * 0.5;
      p5.stroke(255, alpha);
      p5.ellipse(ripple.x, ripple.y, radius);
      return true;
    }
    return false;
  };

  const drawSmallRipple = (p5, ripple, time) => {
    let radius = time * smallRippleSpeed + 5;
    if (radius < smallRippleMaxSize) {
      let alpha = (smallRippleMaxSize - radius) * 2.0;
      p5.stroke(255, alpha);
      p5.ellipse(ripple.x, ripple.y, radius);
      return true;
    }
    return false;
  };

  const newSmallRipple = (p5) => {
    if (lastSmallRipple) {
      const x1 = lastSmallRipple.x;
      const y1 = lastSmallRipple.y;
      const t1 = lastSmallRipple.startTime;
      const x2 = p5.mouseX;
      const y2 = p5.mouseY;
      const t2 = Date.now();
      const dt = t2 - t1;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (dt / 2000 + d / 20 > 1) {
        lastSmallRipple = { x: x2, y: y2, startTime: t2 };
        awareness.setLocalStateField("canvasInfo", { mouse: lastSmallRipple });
      }
    } else {
      lastSmallRipple = { x: p5.mouseX, y: p5.mouseY, startTime: Date.now() };
      awareness.setLocalStateField("canvasInfo", { mouse: lastSmallRipple });
    }
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mousePressed}
      className="Canvas"
    />
  );
}

export default Canvas;
