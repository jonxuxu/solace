import { PerfectCursor } from "perfect-cursors";
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
const burstTime1 = 1;
const burstTime2 = 3;

const poem = [
	"I am a poem",
	"ABCDE",
	"This is the third line of the poem",
];

function burstScale1(scale, t) {
	t = Math.min(t / (burstTime1 + burstTime2), 1);
	return Math.sqrt(1-(1-t)*(1-t)) * scale;
}

function burstScale2(t) {
	if (t < 0)
		return 0;
	else
		return -(Math.cos(Math.PI * t) - 1) / 2;
		//return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function Canvas({ awareness }) {
  let bigRipples = [];
  let smallRipples = [];
  let mousePaths = {};
	let bursts = [];

  let cursors = {};
  let holdState = 0;
  let holdTimer = null;
  const clientId = awareness.clientID;

  function mousePressed(p5) {
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
					/*
          bigRipple: {
            x: p5.mouseX,
            y: p5.mouseY,
            timestamp: Date.now(), // only used to ensure uniqueness
          },
					*/
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

  function mouseReleased() {
    clearInterval(holdTimer);
    holdState = 0;
  };

  function mouseMoved(p5) {
    awareness.setLocalStateField("canvasInfo", {
      mouse: {
        x: p5.mouseX,
        y: p5.mouseY,
        holdState: holdState,
      },
    });
  };
	
	function drawLetter(p5, letterInfo, burst, time) {
		const { letter, index, scale, v1X, v1Y, v2X, v2Y, endTime } = letterInfo;
		time = Math.min(time, endTime);
		const a1 = burstScale1(scale, time);
		//const a2 = burstScale2((time + burstTime2 - endTime) / burstTime2);
		const a2 = burstScale2(time / endTime);
		const posX = burst.x + a1 * v1X + a2 * v2X;
		const posY = burst.y + a1 * v1Y + a2 * v2Y;
		p5.text(letter, posX, posY);
	}

	function awarenessUpdate(p5, clientID, canvasInfo) {
		const { smallRipple, bigRipple, burst, mouse } = canvasInfo;
		const now = Date.now();
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
			let letters = poem[burst.line].split("").map((letter, index) => {
				const randomAngle = Math.random() * Math.PI * 2;
				const scale = 100 + Math.random() * 50;
				const v1X = Math.cos(randomAngle);
				const v1Y = Math.sin(randomAngle);
				const endTime = burstTime1 + Math.random() + burstTime2;
				const s1 = burstScale1(scale, endTime);
				const midPosX = burst.x + v1X * s1;
				const midPosY = burst.y + v1Y * s1;
				// TODO: set endPos properly
				const endPosX = 500 + 10 * index;
				const endPosY = 500 + 20 * burst.line;
				const v2X = endPosX - midPosX;
				const v2Y = endPosY - midPosY;

				return {
					letter,
					index,
					scale,
					v1X,
					v1Y,
					v2X,
					v2Y,
					endTime,
				};
			}).filter((letter) => {
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
				function updateMyCursor(point) {
					cursors[clientID].x = point[0];
					cursors[clientID].y = point[1];
				}
				cursors[clientID].pc = new PerfectCursor(updateMyCursor);
			}
			cursors[clientID].pc.addPoint([mouse.x, mouse.y]);
			cursors[clientID].holdState = mouse.holdState;

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
	};

  function setup(p5, canvasParentRef) {
    let width = canvasParentRef.offsetWidth;
    let height = canvasParentRef.offsetHeight;
    let cnv = p5.createCanvas(width, height).parent(canvasParentRef);
    p5.ellipseMode(p5.RADIUS);
		awareness.on("change", ({ updated }) => {
			if (updated) {
				const states = awareness.getStates();
				updated.forEach((clientID) => {
					const canvasInfo = states.get(clientID).canvasInfo;
					if (canvasInfo) {
						awarenessUpdate(p5, clientID, canvasInfo);
					}
				});
			}
		});
  };

  function draw(p5) {
    const now = Date.now();
    p5.background(0);

    p5.noStroke();
    for (const [key, value] of Object.entries(cursors)) {
      let color = p5.color(
        255,
        cursorAlpha + ((255 - cursorAlpha) * value.holdState) / 100
      );
      let radius = cursorRadius + (cursorRadius * value.holdState) / 100;

      p5.fill(color);
      p5.ellipse(value.x, value.y, radius);
    }

    p5.fill(0, 0);	// fully transparent
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
    bursts.forEach((burst) => {
      const time = (now - burst.startTime) / 1000;
			burst.letters.forEach((letter) => {
				drawLetter(p5, letter, burst, time);
			});
    });
  };

  function drawBigRipple(p5, ripple, time) {
    let buffer = cursorRadius + bigRippleWidth / 2;
    let radius = time * bigRippleSpeed + buffer;
    let alpha = p5.map(time, 0, bigRippleMaxTime, cursorAlpha, 0);
    p5.stroke(255, alpha);
    p5.ellipse(ripple.x, ripple.y, radius);
  };

  function drawSmallRipple(p5, ripple, time) {
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
      mouseReleased={mouseReleased}
      mouseMoved={mouseMoved}
      className="Canvas"
    />
  );
}

export default Canvas;
