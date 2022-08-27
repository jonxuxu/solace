import React, { useEffect } from "react";
import Sketch from "react-p5";
import "./App.css";

import DrawFns from "./utils/draw";
import PoemEngine from "./utils/poem";
import Interpolator from "./utils/interpolate";
import MouseTracker from "./utils/mouse";

const holdTime = 1000;

function Canvas({ wsProvider, yMap, awareness, onStart }) {
  let gameState = "start";
  let needsRotate = false;

  // Start screen
  let startFade = 0;
  let phoneImg = null;

  let bigRipples = [];
  let smallRipples = [];
  let bursts = [];
  let showFirstLines = true;
  let burstOpacity = 255;

  // Charge animation
  let holdState = 0;
  let holdTimer = null;

  const myClientId = awareness.clientID;
  let cursors = { [myClientId]: { x: 0, y: 0, holdState: 0 } };

  let stale = 0;
  let debounce = false;
  let canvasScale = 1;
  let xTranslate = 0;
  let yTranslate = 0;

	let mouseTracker = new MouseTracker(awareness, selfClick, selfHoldStart, holdEnd, null, selfBurst);
  let poemEngine = new PoemEngine(canvasScale, xTranslate, yTranslate, yMap);
  let prevLines = 0;
  let prevPoem = 0;
	let fadingPoem = null;

  useEffect(() => {
		wsProvider.on('synced', () => {
			console.log('synced');
			const current = poemEngine.ready();
			prevPoem = current.poem;
			prevLines = current.line;
			console.log(prevPoem, prevLines);

			yMap.observe((yMapEvent) => {
				if (yMapEvent.keysChanged.has("currentPoem")) {
					console.log('poem changed');
					// New poem, clear bursts and prev lines
					const decreaseInterval = setInterval(() => {
						if (burstOpacity > 5) {
							burstOpacity -= 5;
						} else {
							clearInterval(decreaseInterval);
							showFirstLines = false;
							burstOpacity = 255;
							bursts = [];
							poemEngine.setPoem(yMap.get("currentPoem"));
						}
					}, [50]);
				}
				if (yMapEvent.keysChanged.has("currentLine")) {
					poemEngine.lineUpdated();
				}
			});
		})
  }, []);

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
		const { x, y } = mouseInfo;
		const now = Date.now();
		bigRipples.push({ x, y, clientID, startTime: now });
		bigRipples.push({ x, y, clientID, startTime: now + 100 });
		bigRipples.push({ x, y, clientID, startTime: now + 200 });
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
		poemEngine.tryAdvanceLine(yMap);
		const burst = {
			x: mouseInfo.x,
			y: mouseInfo.y,
			poem: yMap.get("currentPoem"),
			line: yMap.get("currentLine"),
			startTime: Date.now(),
			clientID,
		}
		if (burst.line > -1) {
			burst.letters = poemEngine.newBurst(burst);
			bursts.push(burst);
		}
	}

	function otherBurst(p5, clientID, mouseInfo) {
		const burst = {
			x: mouseInfo.x,
			y: mouseInfo.y,
			poem: yMap.get("currentPoem"),
			line: yMap.get("currentLine"),
			startTime: Date.now(),
			clientID,
		}
		if (burst.line > -1) {
			burst.letters = poemEngine.newBurst(burst);
			bursts.push(burst);
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

    resizeWindow(p5);
    needsRotate = height > width;
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
      cursors[myClientId].x = p5.mouseX * canvasScale + xTranslate;
      cursors[myClientId].y = p5.mouseY * canvasScale + yTranslate;
      DrawFns.drawCursors(p5, cursors, myClientId);

      // Draw ripples
      p5.fill(0, 0); // fully transparent
      bigRipples = DrawFns.drawBigRipples(p5, bigRipples);
      smallRipples = DrawFns.drawSmallRipples(p5, smallRipples);

      // Draw bursts
      p5.fill(burstOpacity);
      p5.noStroke();
      DrawFns.drawBursts(p5, bursts, prevLines);
      if (showFirstLines) {
        let c = p5.color(255, 204, 0, burstOpacity);
        p5.fill(c);
        poemEngine.drawPrevLines(p5, prevPoem, prevLines);
      }
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
