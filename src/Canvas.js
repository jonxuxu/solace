import React from "react";
import Sketch from "react-p5";
import "./App.css";

import DrawFns from "./utils/draw";
import PoemEngine from "./utils/poem";
import Interpolator from "./utils/interpolate";
import MouseTracker from "./utils/mouse";

const holdTime = 1;

function Canvas({ yMap, awareness, onStart }) {
  let gameState = "start";
  let needsRotate = false;

  // Start screen
  let startFade = 0;
  let phoneImg = null;

  let bigRipples = [];
  let smallRipples = [];
  let bursts = [];

  // Charge animation
  let holdState = 0;
  let holdTimer = null;

  const myClientId = awareness.clientID;
  let cursors = { [myClientId]: { x: 0, y: 0 } };

  let stale = 0;
  let debounce = false;
  let canvasScale = 1;
  let xTranslate = 0;
  let yTranslate = 0;

  let poemEngine = null;
	let mouseTracker = new MouseTracker(awareness, selfClick, selfHoldStart, holdEnd, null, selfBurst);

  // Adjust canvas scale and translate based on screen size
  function resizeWindow(p5) {
    const width = p5.windowWidth;
    const height = p5.windowHeight;

    // Scale p5 canvas based on 1920x1080
    if (height / width > 1080 / 1920) {
      canvasScale = 1080 / height;
      xTranslate = 960 - (width * canvasScale) / 2;
    } else {
      canvasScale = 1920 / width;
      yTranslate = 540 - (height * canvasScale) / 2;
    }

    needsRotate = height > width;
    p5.resizeCanvas(width, height);
    poemEngine.resizeCanvas(canvasScale, xTranslate, yTranslate);
		mouseTracker.resizeCanvas(canvasScale, xTranslate, yTranslate);
  }

	function rippleOnClick(p5, clientID, mouseInfo) {
		smallRipples.push({
			x: mouseInfo.x,
			y: mouseInfo.y,
			startTime: Date.now(),
			clientID,
		});
	}

	function selfClick(p5, _, mouseInfo) {
    if (gameState === "start") {
      onStart();
      const fadeInterval = setInterval(() => {
        startFade += 5;
        if (startFade >= 255) {
          clearInterval(fadeInterval);
          startFade = 1;
          gameState = "play";
        }
      }, 50);
      return;
    }
		rippleOnClick(p5, myClientId, mouseInfo);
	}

	function otherClick(p5, clientID, mouseInfo) {
		rippleOnClick(p5, clientID, mouseInfo);
	}

	function selfHoldStart(p5, clientID, mouseInfo) {
		cursors[clientID].holdStart = Date.now();
		holdTimer = setTimeout(() => {
			mouseTracker.onBurst(p5);
		}, holdTime);
	}

	function otherHoldStart(p5, clientID, mouseInfo) {
    if (!cursors[clientID]) {
			cursors[clientID] = { x: mouseInfo.x, y: mouseInfo.y };
		}
		cursors[clientID].holdStart = Date.now();
	}

	function holdEnd(p5, clientID, mouseInfo) {
		if (!cursors[clientID]) {
			cursors[clientID] = { x: mouseInfo.x, y: mouseInfo.y };
		}
		cursors[clientID].holdStart = null;
	}

	/*
    // Linearly increment the hold state until it reaches 100 in 2 seconds
    holdTimer = setInterval(() => {
      if (holdState < 100) {
        holdState += 10;
        // TODO: redundant fix
        awareness.setLocalStateField("canvasInfo", {
          mouse: {
            x: p5.mouseX * canvasScale + xTranslate,
            y: p5.mouseY * canvasScale + yTranslate,
            holdState: holdState,
          },
        });
      } else {
        // Pop a burst of poem line
        poemEngine.advanceLine(yMap);
        clearInterval(holdTimer);
        holdState = 0;
        awareness.setLocalStateField("canvasInfo", {
          bigRipple: {
            x: p5.mouseX * canvasScale + xTranslate,
            y: p5.mouseY * canvasScale + yTranslate,
            timestamp: Date.now(), // only used to ensure uniqueness
          },
          burst: {
            x: p5.mouseX * canvasScale + xTranslate,
            y: p5.mouseY * canvasScale + yTranslate,
            timestamp: Date.now(), // only used to ensure uniqueness
          },
          mouse: {
            x: p5.mouseX * canvasScale + xTranslate,
            y: p5.mouseY * canvasScale + yTranslate,
            holdState: holdState,
          },
        });
      }
    }, 100);
  }
*/

  function mouseMoved(p5, clientID, mouseInfo) {
    if (!cursors[clientID]) {
			cursors[clientID] = {
				interpolator: new Interpolator((point) => {
					cursors[clientID].x = point[0];
					cursors[clientID].y = point[1];
				}),
			};
		}
    cursors[clientID].interpolator.addPoint(mouseInfo);
  }

	function selfBurst(p5, clientID, mouseInfo) {
		bursts.push({
			x: mouseInfo.x,
			y: mouseInfo.y,
			startTime: Date.now(),
			clientID,
		});
	}

  function awarenessUpdate(p5, clientID, canvasInfo) {
    const { smallRipple, bigRipple, burst, mouse, removed } = canvasInfo;
    const now = Date.now();
    if (burst) {
      const letters = poemEngine.newBurst(burst);
      bursts.push({
        ...burst,
        letters,
        startTime: now,
      });
    }
  }

  function setup(p5, canvasParentRef) {
    let width = canvasParentRef.offsetWidth;
    let height = canvasParentRef.offsetHeight;
    p5.createCanvas(width, height).parent(canvasParentRef);
    p5.ellipseMode(p5.RADIUS);
    p5.textFont("Crimson Text");
    phoneImg = p5.loadImage("./iphone2.png");

		// wait until connected?
		mouseTracker.setupReceivers(p5, otherClick, otherHoldStart, holdEnd, mouseMoved, otherBurst);

    poemEngine = new PoemEngine(canvasScale, xTranslate, yTranslate, yMap, p5);
    resizeWindow(p5);
    needsRotate = height > width;

    awareness.on("change", ({ updated, removed }) => {
      if (updated) {
        const states = awareness.getStates();
        updated.forEach((clientID) => {
          const canvasInfo = states.get(clientID).canvasInfo;
          if (canvasInfo) {
            awarenessUpdate(p5, clientID, canvasInfo);
          }
        });
        // Remove cursors that are no longer in the awareness
        if (removed) {
          removed.forEach((clientID) => {
            delete cursors[clientID];
          });
        }
      }
    });
  }

  function draw(p5) {
    p5.background(0);

    if (needsRotate) {
      p5.fill(255);
      p5.image(phoneImg, p5.width / 2 - 80, p5.height / 2 - 100);
      p5.textSize(20);
      p5.textAlign(p5.CENTER);
      p5.text(
        "Rotate your phone for the best experience",
        p5.width / 2,
        p5.height / 2 + 50
      );
      return;
    }

    if (gameState === "start") {
      p5.fill(255 - startFade);
      p5.textSize(32);
      p5.textAlign(p5.CENTER);
      p5.text("Solace", p5.width / 2, p5.height / 2);
    } else if (gameState === "play") {
      p5.scale(1 / canvasScale);
      p5.translate(-xTranslate, -yTranslate);

      // Draw cursors
      p5.noStroke();
			if (cursors[myClientId]) {
				cursors[myClientId].x = p5.mouseX * canvasScale + xTranslate;
				cursors[myClientId].y = p5.mouseY * canvasScale + yTranslate;
				DrawFns.drawCursors(p5, cursors, myClientId);
			}

      // Draw ripples
      p5.fill(0, 0); // fully transparent
      bigRipples = DrawFns.drawBigRipples(p5, bigRipples);
      smallRipples = DrawFns.drawSmallRipples(p5, smallRipples);

      // Draw bursts
      p5.fill(255);
      p5.noStroke();
      DrawFns.drawBurst(p5, bursts);
    }
  }

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mouseTracker.mousePressed}
      mouseReleased={mouseTracker.mouseReleased}
      mouseMoved={mouseTracker.mouseMoved}
		  mouseDragged={mouseTracker.mouseMoved}
      className="Canvas"
      windowResized={resizeWindow}
    />
  );
}

export default Canvas;
