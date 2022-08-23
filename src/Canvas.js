import React from "react";
import Sketch from "react-p5";
import "./App.css";

// constant parameters to control animation
const cursorRadius = 6;
const cursorAlpha = 100;
const bigRippleSpeed = 50;
const smallRippleSpeed = 20;
const bigRippleMaxTime = 3;
const smallRippleMaxTime = 3;
const bigRippleWidth = 2;
const smallRippleWidth = 2;

function Canvas({ awareness }) {
  let bigRipples = [];
	let mousePaths = {};

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
        const { canvasInfo } = states.get(clientID);
        if (canvasInfo) {
          const { click, mouse } = canvasInfo;
          if (click) {
            const now = Date.now();
            bigRipples.push(
              { x: click.x, y: click.y, startTime: now },
              { x: click.x, y: click.y, startTime: now + 100 },
              { x: click.x, y: click.y, startTime: now + 200 },
            );
          }
					if (mouse) {
						if (!mousePaths[clientID]) {
							mousePaths[clientID] = [];
						}
						mousePaths[clientID].push({ x: mouse.x, y: mouse.y, timestamp: Date.now() });

						/*
						if (mousePaths[clientID].length === 0) {
							mousePaths[clientID] = [{
								x: mouse.x,
								y: mouse.y,
								startTime: Date.now(),
							}];
						} else {
							const path = mousePaths[clientID];
							const x = p5.mouseX;
							const y = p5.mouseY;
							const t = Date.now();
							while (true) {
								const lastRipple = path[path.length - 1];
								const x0 = lastRipple.x;
								const y0 = lastRipple.y;
								const t0 = lastRipple.startTime;
								const dx = x - x0;
								const dy = y - y0;
								const dt = t - t0;
								const d = Math.sqrt(dx * dx + dy * dy);
								if (dt / 3000  + d / maxPathJumpDistance > 1) {
									if (d > maxPathJumpDistance) {
										path.push({
											x: x0 + dx / d * maxPathJumpDistance,
											y: y0 + dy / d * maxPathJumpDistance,
											startTime: t + maxPathJumpDistance / maxPathSpeed,
										});
									}
									lastSmallRipple = { x: x2, y: y2, startTime: t2 };
								} else {
									break;
								}
							}
						}
						*/
					}
        }
      });
    }
  });

  const setup = (p5, canvasParentRef) => {
    let width = canvasParentRef.offsetWidth;
    let height = canvasParentRef.offsetHeight;
    let cnv = p5.createCanvas(width, height).parent(canvasParentRef);
		p5.ellipseMode(p5.RADIUS);
  };

  const draw = (p5) => {
    const now = Date.now();
    p5.background(0);

		// sending mouse position on every draw seems too frequent
		// probably better to use less events + interpolation
		awareness.setLocalStateField("canvasInfo", {
			mouse: {
				x: p5.mouseX,
				y: p5.mouseY,
				timestamp: now,
			}
		});

		p5.fill(255, cursorAlpha);
		p5.noStroke();
		Array.from(awareness.getStates().values()).forEach(({ canvasInfo }) => {
			if (canvasInfo) {
				let mouse = canvasInfo.mouse;
				if (mouse) {
					p5.ellipse(mouse.x, mouse.y, cursorRadius);
				}
			}
		});

    p5.fill(0, 0);
    p5.strokeWeight(bigRippleWidth);
		let newBigRipples = [];
		bigRipples.forEach((ripple) => {
      let time = (now - ripple.startTime) / 1000;
			if (time < bigRippleMaxTime) {
      	if (time > 0) {
        	drawBigRipple(p5, ripple, time);
				}
				newBigRipples.push(ripple);
      }
    });
		bigRipples = newBigRipples;

		/*
    p5.strokeWeight(smallRippleWidth);
		let newSmallRipples = [];
		smallRipples.forEach((ripple) => {
      let time = (now - ripple.startTime) / 1000;
			if (time < smallRippleMaxTime) {
      	drawSmallRipple(p5, ripple, time);
				newSmallRipples.push(ripple);
      }
		});
		smallRipples = newSmallRipples;
		*/
  };

  const drawBigRipple = (p5, ripple, time) => {
		let buffer = cursorRadius + bigRippleWidth / 2;
    let radius = time * bigRippleSpeed + buffer;
		let alpha = p5.map(time, 0, bigRippleMaxTime, cursorAlpha, 0);
		p5.stroke(255, alpha);
		p5.ellipse(ripple.x, ripple.y, radius);
  };

  const drawSmallRipple = (p5, ripple, time) => {
		let buffer = cursorRadius + smallRippleWidth / 2;
    let radius = time * smallRippleSpeed + buffer;
		let alpha = p5.map(time, 0, smallRippleMaxTime, cursorAlpha, 0);
		p5.stroke(255, alpha);
		p5.ellipse(ripple.x, ripple.y, radius);
  };

	/*
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
			if (dt / 2000 + d / 20 > 0) {
				lastSmallRipple = { x: x2, y: y2, startTime: t2 };
				awareness.setLocalStateField("canvasInfo", { mouse: lastSmallRipple });
			}
		} else {
			lastSmallRipple = { x: p5.mouseX, y: p5.mouseY, startTime: Date.now() };
			awareness.setLocalStateField("canvasInfo", { mouse: lastSmallRipple });
		}
	}
	*/

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
