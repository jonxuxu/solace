import React from "react";
import Sketch from "react-p5";
import "./App.css";

const rippleSpeed = 0.05;
const bigRippleMaxSize = 300;
const smallRippleMaxSize = 80;

function Canvas({ awareness }) {
  let bigRipples = [];
  let smallRipples = [];

  const mousePressed = (p5) => {
    awareness.setLocalStateField("canvasInfo", {
      click: {
        x: p5.mouseX,
        y: p5.mouseY,
				timestamp: Date.now(),	// only used to ensure uniqueness
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
						smallRipples.push(
							{ x: mouse.x, y: mouse.y, startTime: now },
						);
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

		if (p5.frameCount % 10 === 0) {
			awareness.setLocalStateField("canvasInfo", {
				mouse: {
					x: p5.mouseX,
					y: p5.mouseY,
					timestamp: Date.now(),	// only used to ensure uniqueness
				},
			});
		}

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
    let radius = time * rippleSpeed;
    if (radius < bigRippleMaxSize) {
      let alpha = (bigRippleMaxSize - radius) * 0.5;
      p5.stroke(255, alpha);
      p5.ellipse(ripple.x, ripple.y, radius);
      return true;
    }
    return false;
  };

  const drawSmallRipple = (p5, ripple, time) => {
    let radius = time * rippleSpeed + 5;
    if (radius < smallRippleMaxSize) {
      let alpha = (smallRippleMaxSize - radius) * 2.0;
      p5.stroke(255, alpha);
      p5.ellipse(ripple.x, ripple.y, radius);
      return true;
    }
    return false;
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
