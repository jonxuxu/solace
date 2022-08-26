import poems from ".././poems.json";

function getOffset(el) {
  var body, _x, _y;
  body = document.getElementsByTagName("body")[0];
  _x = 0;
  _y = 0;
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

export default class PoemEngine {
  burstTime1 = 1;
  burstTime2 = 3;
  advanceTimer = null;
  currentPoem = -1;
  currentLine = -1;
  canvasScale = 1;
  xTranslate = 0;
  yTranslate = 0;

  constructor(cs, xt, yt) {
    this.canvasScale = cs;
    this.xTranslate = xt;
    this.yTranslate = yt;
  }

  burstScale1 = (scale, t, endTime) => {
    t = Math.min(t / (this.burstTime1 + this.burstTime2), 1);
    return Math.sqrt(1 - (1 - t) * (1 - t)) * scale;
  };

  setPoem = (idx) => {
    const centered = document.getElementById("poem-centered");
    while (centered.firstChild) {
      centered.removeChild(centered.firstChild);
    }
    const verses = poems[idx].verses;
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
    }
  };

  newBurst = (burst) => {
    if (this.currentPoem !== burst.poem || this.currentLine !== burst.line) {
      clearInterval(this.advanceTimer);
    }
    if (this.currentPoem !== burst.poem) {
      this.setPoem(burst.poem);
    }
    this.currentPoem = burst.poem;
    this.currentLine = burst.line;
    const lineDiv =
      document.getElementById("poem-centered").children[burst.line];
    let letters = poems[burst.poem].verses[burst.line]
      .split("")
      .map((letter, index) => {
        const letterDiv = lineDiv.children[index];
        const { top, left } = getOffset(letterDiv);
        const randomAngle = Math.random() * Math.PI * 2;
        const scale = 150 + Math.random() * 50;
        const v1X = Math.cos(randomAngle);
        const v1Y = Math.sin(randomAngle);
        const endTime = this.burstTime1 + Math.random() + this.burstTime2;
        const s1 = this.burstScale1(scale, endTime);
        const midPosX = burst.x + v1X * s1;
        const midPosY = burst.y + v1Y * s1;
        const endPosX = left * this.canvasScale + this.xTranslate;
        const endPosY = top * this.canvasScale + this.yTranslate;
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

    return letters;
  };

  advanceLine = () => {
    if (this.currentPoem === -1) {
      this.currentPoem = 0;
      this.currentLine = 0;
      this.setPoem(this.currentPoem);
    } else if (this.currentLine < poems[this.currentPoem].verses.length - 1) {
      this.currentLine++;
    } else {
      this.currentLine = 0;
      this.currentPoem = (this.currentPoem + 1) % poems.length;
      // TODO: current poem should fade away
      this.setPoem(this.currentPoem);
    }
    // must wait a few seconds before getting the next line
    this.canAdvance = false;
    this.advanceTimer = setInterval(() => {
      this.canAdvance = true;
    }, 5000);
  };
}
