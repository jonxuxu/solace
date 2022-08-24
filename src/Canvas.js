import { PerfectCursor } from "perfect-cursors";
import { Spline } from "./Spline";
import React from "react";
import Sketch from "react-p5";
import "./App.css";

// constant parameters to control animation
const cursorRadius = 6;
const cursorAlpha = 100;
const bigRippleSpeed = 50;
const bigRippleMaxTime = 3;
const bigRippleWidth = 2;
const smallRippleSpeed = 20;
const smallRippleMaxTime = 3;
const smallRippleWidth = 2;
const burstTime1 = 3;
const burstTime2 = 3;
const burstMaxTime = burstTime1 + burstTime2;
const burstMinRadius = 100;
const burstMaxRadius = 150;

// Github Copilot writing poetry
const poem = ["I am a poem", "I am a poem", "I am a poem"];

function Canvas({ awareness }) {
  // TODO: combine bigRipples, smallRipples, mousePaths, and bursts into:
  // canvasInfo = {
  // 	 client1: {
  //		 bigRipples: [],
  //		 smallRipples: [],
  //		 mousePaths: [],
  //		 bursts: [],
  //	 },
  //	 client2: {
  //	   ...
  //	 }
  // }
  // (stored locally)

  let bigRipples = [];
  let smallRipples = [];
  let bursts = [];

  let holdState = 0;
  let holdTimer = null;
  const myClientId = awareness.clientID;
  let cursors = { [myClientId]: { x: 0, y: 0 } };

  let stale = 0;

  let debounce = false;
  let debounceTimer = null;

  const mousePressed = (p5) => {
    if (debounce) {
      return;
    }
    debounce = true;
    debounceTimer = setTimeout(() => {
      debounce = false;
    }, 300);
    awareness.setLocalStateField("canvasInfo", {
      smallRipple: {
        x: p5.mouseX,
        y: p5.mouseY,
        timestamp: Date.now(), // only used to ensure uniqueness
      },
    });
    // Linearly increment the hold state until it reaches 100 in 2 seconds
    holdTimer = setInterval(() => {
      if (holdState < 100) {
        holdState += 10;
        // TODO: redundant fix
        awareness.setLocalStateField("canvasInfo", {
          mouse: {
            x: p5.mouseX,
            y: p5.mouseY,
            holdState: holdState,
          },
        });
      } else {
        clearInterval(holdTimer);
        holdState = 0;
        const now = Date.now();
        awareness.setLocalStateField("canvasInfo", {
          bigRipple: {
            x: p5.mouseX,
            y: p5.mouseY,
            timestamp: Date.now(), // only used to ensure uniqueness
          },
          burst: {
            x: p5.mouseX,
            y: p5.mouseY,
            line: 2,
            timestamp: Date.now(), // only used to ensure uniqueness
          },
        });
      }
    }, 100);
  };

  const mouseReleased = () => {
    clearInterval(holdTimer);
    holdState = 0;
  };

  awareness.on("change", ({ updated }) => {
    if (updated) {
      const now = Date.now();
      const states = awareness.getStates();
      updated.forEach((clientID) => {
        const { canvasInfo } = states.get(clientID);
        if (canvasInfo) {
          const { smallRipple, bigRipple, burst, mouse } = canvasInfo;
          if (smallRipple) {
            smallRipples.push({
              x: smallRipple.x,
              y: smallRipple.y,
              startTime: now,
            });
          }
          // Big ripple location
          if (bigRipple) {
            bigRipples.push(
              { x: bigRipple.x, y: bigRipple.y, startTime: now },
              { x: bigRipple.x, y: bigRipple.y, startTime: now + 100 },
              { x: bigRipple.x, y: bigRipple.y, startTime: now + 200 }
            );
          }
          if (burst) {
            let letters = poem[burst.line]
              .split("")
              .map((letter, index) => {
                const randomAngle = Math.random() * Math.PI * 2;
                const radius =
                  burstMinRadius +
                  Math.random() * (burstMaxRadius - burstMinRadius);
                return {
                  letter,
                  index,
                  midX: burst.x + Math.cos(randomAngle) * radius,
                  midY: burst.y + Math.sin(randomAngle) * radius,
                  endX: 100 + 10 * index,
                  endY: 100 + 20 * burst.line,
                };
              })
              .filter((letter) => {
                return letter.letter !== " ";
              });

            bursts.push({
              ...burst,
              letters,
              startTime: now,
            });
          }
          if (mouse) {
            if (!cursors[clientID]) {
              cursors[clientID] = {};
              if (clientID !== myClientId) {
                // function updateMyCursor(point) {
                //   cursors[clientID].x = point[0];
                //   cursors[clientID].y = point[1];
                // }
                // cursors[clientID].pc = new PerfectCursor(updateMyCursor);
                cursors[clientID].sp = new Spline();
              }
            }
            if (clientID !== myClientId) {
              // cursors[clientID].pc.addPoint([mouse.x, mouse.y]);
              cursors[clientID].sp.addPoint([mouse.x, mouse.y]);
              // console.log(JSON.stringify(cursors[clientID].sp.points));
              if (!cursors[clientID].animating) {
                cursors[clientID].animating = true;
                cursors[clientID].splineStart = performance.now();
                cursors[clientID].currFrame = 0;
                cursors[clientID].idleTimer = setTimeout(() => {
                  cursors[clientID].animating = false;
                  cursors[clientID].sp.clear();
                  cursors[clientID].currFrame = 0;
                }, 300);
              } else {
                clearTimeout(cursors[clientID].idleTimer);
              }
            }
            cursors[clientID].holdState = mouse.holdState;
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
    p5.background(0);

    // Update mouse position every frame
    if (stale > 7) {
      awareness.setLocalStateField("canvasInfo", {
        mouse: {
          x: p5.mouseX,
          y: p5.mouseY,
          holdState: holdState,
        },
      });
      stale = 0;
    }
    stale++;

    p5.noStroke();
    cursors[myClientId].x = p5.mouseX;
    cursors[myClientId].y = p5.mouseY;
    for (const [key, value] of Object.entries(cursors)) {
      // Calculate color and size from charge state
      let color = p5.color(
        255,
        cursorAlpha + ((255 - cursorAlpha) * value.holdState) / 100
      );
      let radius = cursorRadius + (cursorRadius * value.holdState) / 100;
      p5.fill(color);

      // Calculate x,y from spline
      if (key != myClientId && value.animating && value.sp.points.length > 1) {
        const splineNow = performance.now();
        const point = value.sp.getSplinePoint(
          value.currFrame + (splineNow - value.splineStart) / 30
        );
        cursors[key].x = point[0];
        cursors[key].y = point[1];
        if ((splineNow - value.splineStart) / 30 > 1) {
          cursors[key].currFrame++;
        }
      }
      p5.ellipse(value.x, value.y, radius);
    }

    const now = Date.now();

    p5.fill(0, 0); // fully transparent
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

    p5.fill(255);
    p5.noStroke();
    bursts = bursts.filter(({ startTime }) => {
      return (now - startTime) / 1000 < burstMaxTime;
    });
    bursts.forEach((burst) => {
      const time = (now - burst.startTime) / 1000;
      if (time < burstTime1) {
        burst.letters.forEach((letter) => {
          drawLetter1(p5, letter, burst.x, burst.y, time);
        });
      }
    });
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

  const drawLetter1 = (p5, letter, startX, startY, time) => {
    let t = time / burstTime1;
    t = Math.sqrt(t);
    const x = startX + (letter.midX - startX) * t;
    const y = startY + (letter.midY - startY) * t;
    p5.text(letter.letter, x, y);
  };

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mousePressed}
      mouseReleased={mouseReleased}
      className="Canvas"
    />
  );
}

export default Canvas;
