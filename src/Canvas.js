import { PerfectCursor } from "perfect-cursors";
import { Spline } from "./Spline";
import { Vec } from "@tldraw/vec";
import React from "react";
import Sketch from "react-p5";
import "./App.css";
import poems from "./poems.json";

// constant parameters to control animation
const cursorRadius = 9;
const cursorAlpha = 100;
const bigRippleSpeed = 50;
const bigRippleMaxTime = 3;
const bigRippleWidth = 4;
const smallRippleSpeed = 20;
const smallRippleMaxTime = 3;
const smallRippleWidth = 2.5;
const burstTime1 = 1;
const burstTime2 = 3;
const MAX_INTERVAL = 300;

function getOffset(el) {
  var body, _x, _y;
  body = document.getElementsByTagName("body")[0];
  _x = 0;
  _y = 0;
  console.log(el, el.offsetLeft, el.offsetTop);
  while (el && !isNaN(el.offsetLeft) && !isNaN(el.offsetTop)) {
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;
    el = el.offsetParent;
  }
  return {
    top: _y + body.scrollTop,
    left: _x + body.scrollLeft,
  };
}

function setPoem(idx) {
  const centered = document.getElementById("poem-centered");
  while (centered.firstChild) {
    centered.removeChild(centered.firstChild);
  }
  const verses = poems[idx].verses;
  console.log(verses.length);
  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    const line = document.createElement("div");
    line.className = "poem-line";
    for (let j = 0; j < verse.length; j++) {
      const letter = document.createElement("div");
      letter.className = "poem-letter";
      if (verse[j] === " ") {
        letter.innerHTML = "&nbsp;";
      } else {
        letter.innerHTML = verse[j];
      }
      line.appendChild(letter);
    }
    centered.appendChild(line);
    console.log(line);
  }
}

function burstScale1(scale, t, endTime) {
  t = Math.min(t / (burstTime1 + burstTime2), 1);
  return Math.sqrt(1 - (1 - t) * (1 - t)) * scale;
}

function burstScale2(t) {
  if (t < 0) return 0;
  else return -(Math.cos(Math.PI * t) - 1) / 2;
  //return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function Canvas({ awareness }) {
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

  let currentPoem = -1;

  function mousePressed(p5) {
    if (debounce) {
      return;
    }
    debounce = true;
    setTimeout(() => {
      debounce = false;
    }, 300);
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
            poem: 0,
            line: 0,
            timestamp: Date.now(), // only used to ensure uniqueness
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
    awareness.setLocalStateField("canvasInfo", {
      mouse: {
        x: p5.mouseX,
        y: p5.mouseY,
        holdState: holdState,
      },
    });
  }

  function drawLetter(p5, letterInfo, burst, time) {
    const { letter, scale, v1X, v1Y, v2X, v2Y, endTime } = letterInfo;
    time = Math.min(time, endTime);
    const a1 = burstScale1(scale, time);
    //const a2 = burstScale2((time + burstTime2 - endTime) / burstTime2);
    const a2 = burstScale2(time / endTime);
    const posX = burst.x + a1 * v1X + a2 * v2X;
    const posY = burst.y + a1 * v1Y + a2 * v2Y;
    p5.push();
    p5.textSize(32 * canvasScale);
    p5.text(letter, posX, posY);
    p5.pop();
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
      if (currentPoem != burst.poem) {
        currentPoem = burst.poem;
        setPoem(currentPoem);
      }
      console.log(document.getElementById("poem-centered").children);
      const lineDiv =
        document.getElementById("poem-centered").children[burst.line];
      //const lineDiv = document.querySelector(`#poem-centered :nth-child(${burst.line})`);
      let letters = poems[burst.poem].verses[burst.line]
        .split("")
        .map((letter, index) => {
          const letterDiv = lineDiv.children[index];
          const { top, left } = getOffset(letterDiv);
          const randomAngle = Math.random() * Math.PI * 2;
          const scale = 150 + Math.random() * 50;
          const v1X = Math.cos(randomAngle);
          const v1Y = Math.sin(randomAngle);
          const endTime = burstTime1 + Math.random() + burstTime2;
          const s1 = burstScale1(scale, endTime);
          const midPosX = burst.x + v1X * s1;
          const midPosY = burst.y + v1Y * s1;
          const endPosX = left * canvasScale + xTranslate;
          const endPosY = top * canvasScale + yTranslate;
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
      // Add to spline if not own cursor
      if (!cursors[clientID]) {
        cursors[clientID] = {};
        if (clientID !== myClientId) {
          cursors[clientID] = {
            state: "idle",
            queue: [],
            timestamp: performance.now(),
            timeoutId: null,
            prevPoint: [0, 0],
            spline: new Spline(),
          };
        }
      }

      if (clientID !== myClientId) {
        addPoint(clientID, mouse);
      }
      cursors[clientID].holdState = mouse.holdState;
      // Remove cursors that are no longer in the awareness
      if (removed) {
        removed.forEach((clientID) => {
          delete cursors[clientID];
        });
      }
    }
  }

  function addPoint(clientID, mouse) {
    const cursor = cursors[clientID];
    clearTimeout(cursor.timeoutId);
    const now = performance.now();
    const duration = Math.min(now - cursor.timestamp, MAX_INTERVAL);
    const point = [mouse.x, mouse.y];
    if (!cursor.prevPoint) {
      cursor.spline.clear();
      cursor.prevPoint = point;
      cursor.spline.addPoint(point);
      cursor.x = point[0];
      cursor.y = point[1];
      cursor.state = "stopped";
      return;
    }
    if (cursor.state === "stopped") {
      if (Vec.dist(cursor.prevPoint, point) < 4) {
        cursor.x = point[0];
        cursor.y = point[1];
        return;
      }
      cursor.spline.clear();
      cursor.spline.addPoint(cursor.prevPoint);
      cursor.spline.addPoint(cursor.prevPoint);
      cursor.spline.addPoint(point);
      cursor.state = "idle";
    } else {
      cursor.spline.addPoint(point);
    }
    if (duration < 16) {
      cursor.prevPoint = point;
      cursor.timestamp = now;
      cursor.x = point[0];
      cursor.y = point[1];
      return;
    }
    const animation = {
      start: cursor.spline.points.length - 3,
      from: cursor.prevPoint,
      to: point,
      duration,
    };
    cursor.prevPoint = point;
    cursor.timestamp = now;
    switch (cursor.state) {
      case "idle": {
        cursor.state = "animating";
        cursor.currAnimation = animation;
        break;
      }
      case "animating": {
        cursor.queue.push(animation);
        break;
      }
    }
    cursors[clientID] = cursor;
  }

  function setup(p5, canvasParentRef) {
    let width = canvasParentRef.offsetWidth;
    let height = canvasParentRef.offsetHeight;
    p5.createCanvas(width, height).parent(canvasParentRef);
    p5.ellipseMode(p5.RADIUS);
    p5.textFont("Crimson Text");
    p5.textAlign(p5.LEFT, p5.TOP);

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
    // Scale p5 canvas based on 1920x1080
    if (height / width > 1080 / 1920) {
      canvasScale = 1080 / height;
      xTranslate = 960 - (width * canvasScale) / 2;
    } else {
      canvasScale = 1920 / width;
      yTranslate = 540 - (height * canvasScale) / 2;
    }
  }

  function draw(p5) {
    const now = Date.now();
    p5.background(0);
    p5.scale(1 / canvasScale);
    p5.translate(-xTranslate, -yTranslate);

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

    p5.noStroke();
    cursors[myClientId].x = p5.mouseX * canvasScale + xTranslate;
    cursors[myClientId].y = p5.mouseY * canvasScale + yTranslate;
    for (const [key, cursor] of Object.entries(cursors)) {
      // Calculate color and size from charge state
      let color = p5.color(
        255,
        cursorAlpha + ((255 - cursorAlpha) * cursor.holdState) / 100
      );
      let radius = cursorRadius + (cursorRadius * cursor.holdState) / 100;
      p5.fill(color);

      // Calculate x,y from spline. Adapted animateNext to be called on each render frame instead on every cursor update

      if (key != myClientId) {
        drawSpline(key);
      } else {
        cursors[key].x = p5.mouseX * canvasScale + xTranslate;
        cursors[key].y = p5.mouseY * canvasScale + yTranslate;
      }
      p5.ellipse(cursor.x, cursor.y, radius);
    }

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
    // TODO: delete burst and replace with full line of text after animation finishes
    bursts.forEach((burst) => {
      const time = (now - burst.startTime) / 1000;
      burst.letters.forEach((letter) => {
        drawLetter(p5, letter, burst, time);
      });
    });
  }

  function drawSpline(key) {
    console.log("updateSpline");
    if (cursors[key].state == "animating") {
      const t =
        (performance.now() - cursors[key].animationStart) /
        cursors[key].currAnimation.duration;
      if (t <= 1) {
        if (cursors[key].spline.points.length > 0) {
          try {
            const point = cursors[key].spline.getSplinePoint(
              t + cursors[key].currAnimation.start
            );
            cursors[key].x = point[0];
            cursors[key].y = point[1];
          } catch (e) {
            console.warn(e);
          }
          return;
        }
      } else {
        const next = cursors[key].queue.shift();
        if (next) {
          cursors[key].state = "animating";
          cursors[key].currAnimation = next;
        } else {
          cursors[key].state = "idle";
          cursors[key].timeoutId = setTimeout(() => {
            cursors[key].state = "stopped";
          }, MAX_INTERVAL);
        }
      }
    }
  }

  function drawBigRipple(p5, ripple, time) {
    let buffer = cursorRadius + bigRippleWidth / 2;
    let radius = time * bigRippleSpeed + buffer;
    let alpha = p5.map(time, 0, bigRippleMaxTime, cursorAlpha, 0);
    p5.stroke(255, alpha);
    p5.ellipse(ripple.x, ripple.y, radius);
  }

  function drawSmallRipple(p5, ripple, time) {
    let buffer = cursorRadius + smallRippleWidth / 2;
    let radius = time * smallRippleSpeed + buffer;
    let alpha = p5.map(time, 0, smallRippleMaxTime, cursorAlpha, 0);
    p5.stroke(255, alpha);
    p5.ellipse(ripple.x, ripple.y, radius);
  }

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
