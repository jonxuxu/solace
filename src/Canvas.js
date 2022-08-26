import React from "react";
import Sketch from "react-p5";
import "./App.css";

import DrawFns from "./utils/draw";
import PoemEngine from "./utils/poem";
import Interpolator from "./utils/interpolate";

function Canvas({ awareness, onStart }) {
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
  let canAdvance = true;

  // Adjust canvas scale and translate based on screen size
  function windowResized(p5) {
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
  }

  function mousePressed(p5) {
    if (debounce) {
      return;
    }
    debounce = true;
    setTimeout(() => {
      debounce = false;
    }, 300);

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

    awareness.setLocalStateField("canvasInfo", {
      smallRipple: {
        x: p5.mouseX * canvasScale + xTranslate,
        y: p5.mouseY * canvasScale + yTranslate,
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
            x: p5.mouseX * canvasScale + xTranslate,
            y: p5.mouseY * canvasScale + yTranslate,
            holdState: holdState,
          },
        });
      } else {
        if (canAdvance) {
          poemEngine.advanceLine();
        }
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
            poem: poemEngine.currentPoem,
            line: poemEngine.currentLine,
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

  function mouseReleased() {
    clearInterval(holdTimer);
    holdState = 0;
  }

  function mouseMoved(p5) {
    // Update mouse position every frame
    if (stale > 7) {
      awareness.setLocalStateField("canvasInfo", {
        mouse: {
          x: p5.mouseX * canvasScale + xTranslate,
          y: p5.mouseY * canvasScale + yTranslate,
          holdState: holdState,
        },
      });
      stale = 0;
    }
    stale++;
  }

  function awarenessUpdate(p5, clientID, canvasInfo) {
    const { smallRipple, bigRipple, burst, mouse, removed } = canvasInfo;
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
      const letters = poemEngine.newBurst(burst);
      bursts.push({
        ...burst,
        letters,
        startTime: now,
      });
    }

    if (mouse) {
      // Add to spline if not own cursor
      if (!cursors[clientID]) {
        cursors[clientID] = {};
        if (clientID !== myClientId) {
          cursors[clientID] = {
            interpolator: new Interpolator((point) => {
              cursors[clientID].x = point[0];
              cursors[clientID].y = point[1];
            }),
          };
        }
      }

      if (clientID !== myClientId) {
        cursors[clientID].interpolator.addPoint(mouse);
      }
      cursors[clientID].holdState = mouse.holdState;
    }
  }

  function setup(p5, canvasParentRef) {
    let width = canvasParentRef.offsetWidth;
    let height = canvasParentRef.offsetHeight;
    p5.createCanvas(width, height).parent(canvasParentRef);
    p5.ellipseMode(p5.RADIUS);
    p5.textFont("Crimson Text");
    p5.textAlign(p5.LEFT, p5.TOP);
    phoneImg = p5.loadImage("./iphone2.png");

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

    poemEngine = new PoemEngine(canvasScale, xTranslate, yTranslate);

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

      p5.noStroke();
      cursors[myClientId].x = p5.mouseX * canvasScale + xTranslate;
      cursors[myClientId].y = p5.mouseY * canvasScale + yTranslate;
      DrawFns.drawCursors(p5, cursors, myClientId);

      p5.fill(0, 0); // fully transparent
      bigRipples = DrawFns.drawBigRipples(p5, bigRipples);
      smallRipples = DrawFns.drawSmallRipples(p5, smallRipples);

      p5.fill(255);
      p5.noStroke();
      DrawFns.drawBurst(p5, bursts);
    }
  }

  return (
    <Sketch
      setup={setup}
      draw={draw}
      mousePressed={mousePressed}
      mouseReleased={mouseReleased}
      mouseMoved={mouseMoved}
      className="Canvas"
      windowResized={windowResized}
    />
  );
}

export default Canvas;
