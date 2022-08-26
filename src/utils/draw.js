const bigRippleSpeed = 50;
const smallRippleSpeed = 20;
const bigRippleMaxTime = 3;
const bigRippleWidth = 4;
const smallRippleMaxTime = 3;
const smallRippleWidth = 2.5;

const burstTime1 = 1;
const burstTime2 = 3;

const cursorAlpha = 100;
const cursorRadius = 9;

function drawBigRipple(p5, ripple, time) {
  p5.strokeWeight(bigRippleWidth);
  let buffer = cursorRadius + bigRippleWidth / 2;
  let radius = time * bigRippleSpeed + buffer;
  let alpha = p5.map(time, 0, bigRippleMaxTime, cursorAlpha, 0);
  p5.stroke(255, alpha);
  p5.ellipse(ripple.x, ripple.y, radius);
}

function drawBigRipples(p5, bigRipples) {
  const now = Date.now();
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
  return newBigRipples;
}

function drawSmallRipple(p5, ripple, time) {
  p5.strokeWeight(smallRippleWidth);
  let buffer = cursorRadius + smallRippleWidth / 2;
  let radius = time * smallRippleSpeed + buffer;
  let alpha = p5.map(time, 0, smallRippleMaxTime, cursorAlpha, 0);
  p5.stroke(255, alpha);
  p5.ellipse(ripple.x, ripple.y, radius);
}

function drawSmallRipples(p5, smallRipples) {
  const now = Date.now();
  let newSmallRipples = [];
  smallRipples.forEach((ripple) => {
    let time = (now - ripple.startTime) / 1000;
    if (time < smallRippleMaxTime) {
      drawSmallRipple(p5, ripple, time);
      newSmallRipples.push(ripple);
    }
  });
  return newSmallRipples;
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

function fontSize(p5, scale) {
  return p5.map(scale, 0, 1, 32, 64);
}

function drawLetter(p5, letterInfo, burst, time) {
  const now = Date.now();
  const { letter, scale, v1X, v1Y, v2X, v2Y, endTime } = letterInfo;
  time = Math.min(time, endTime);
  const a1 = burstScale1(scale, time);
  //const a2 = burstScale2((time + burstTime2 - endTime) / burstTime2);
  const a2 = burstScale2(time / endTime);
  const posX = burst.x + a1 * v1X + a2 * v2X;
  const posY = burst.y + a1 * v1Y + a2 * v2Y;
  p5.push();
  p5.textSize(32);
  p5.text(letter, posX, posY);
  p5.pop();
}

function drawBurst(p5, bursts) {
  p5.textAlign(p5.LEFT, p5.TOP);
  const now = Date.now();
  bursts.forEach((burst) => {
    const time = (now - burst.startTime) / 1000;
    burst.letters.forEach((letter) => {
      drawLetter(p5, letter, burst, time);
    });
  });
}

function drawCursors(p5, cursors, myClientId) {
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
      cursor.interpolator.drawSpline();
    }

    p5.ellipse(cursor.x, cursor.y, radius);
  }
}

export default { drawBigRipples, drawSmallRipples, drawBurst, drawCursors };
