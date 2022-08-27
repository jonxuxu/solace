import poems from ".././poems.json";

const BURST_TIMEOUT = 5000;

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
  canAdvance = false;
  advanceTimer = null;
  canvasScale = 1;
  xTranslate = 0;
  yTranslate = 0;
  yMap = null;

  constructor(cs, xt, yt, ym) {
    this.canvasScale = cs;
    this.xTranslate = xt;
    this.yTranslate = yt;
    this.yMap = ym;
    this.advanceTimer = setTimeout(() => {
      this.canAdvance = true;
    }, BURST_TIMEOUT);

    ym.observe((yMapEvent) => {
      if (yMapEvent.keysChanged.has("currentPoem")) {
        this.poemUpdated();
      }
      if (yMapEvent.keysChanged.has("currentLine")) {
        this.lineUpdated();
      }
    });
  }

  ready() {
    console.log("ready");
    // Init shared values if not already set
    if (this.yMap.get("currentLine") === undefined) {
      this.yMap.set("currentLine", -1);
    }
    if (this.yMap.get("currentPoem") === undefined) {
      this.yMap.set("currentPoem", 0);
    }

    // Draw all the earlier lines
    this.setPoem(this.yMap.get("currentPoem"));
  }

  lineUpdated() {
    // must wait a few seconds before getting the next line
    this.canAdvance = false;
    this.advanceTimer = setTimeout(() => {
      this.canAdvance = true;
    }, BURST_TIMEOUT);
  }

  poemUpdated() {
    // TODO
  }

  resizeCanvas(cs, xt, yt) {
    this.canvasScale = cs;
    this.xTranslate = xt;
    this.yTranslate = yt;
  }

  burstScale1 = (scale, t, endTime) => {
    t = Math.min(t / (this.burstTime1 + this.burstTime2), 1);
    return Math.sqrt(1 - (1 - t) * (1 - t)) * scale;
  };

  setPoem = (idx) => {
    console.log("setPoem", idx);
    const centered = document.getElementById("poem-centered");
    centered.style.fontSize = `${32 / this.canvasScale}px`;
    while (centered.firstChild) {
      centered.removeChild(centered.firstChild);
    }
    console.log(idx);
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
    // console.log(this.yMap.get("currentPoem"), this.yMap.get("currentLine"));
    const lineDiv =
      document.getElementById("poem-centered").children[
        this.yMap.get("currentLine")
      ];
    let letters = poems[this.yMap.get("currentPoem")].verses[
      this.yMap.get("currentLine")
    ]
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
    const currentPoem = this.yMap.get("currentPoem");
    const currentLine = this.yMap.get("currentLine");
    console.log("advancing from " + currentLine + " to " + (currentLine + 1));
    // set default poem if not defined in shared map
    if (currentLine < poems[currentPoem].verses.length - 1) {
      this.yMap.set("currentLine", currentLine + 1);
    } else {
      this.yMap.set("currentLine", -1);
      this.yMap.set("currentPoem", (currentPoem + 1) % poems.length);
      // TODO: current poem should fade away
      this.yMap.set("currentPoem", currentPoem);
    }
  };

  drawPrevLines = (p5, prevLines) => {
    const currentPoem = this.yMap.get("currentPoem");
    const currentLine = this.yMap.get("currentLine");
    const poemDiv = document.getElementById("poem-centered");
    if (poemDiv.children.length > 0) {
      p5.fill(255);
      p5.noStroke();
      p5.textSize(32);

      for (let i = 0; i <= prevLines; i++) {
        const { top, left } = getOffset(poemDiv.children[i].children[0]);
        const x = left * this.canvasScale + this.xTranslate;
        const y = top * this.canvasScale + this.yTranslate;
        p5.text(poems[currentPoem].verses[i], x, y);
      }
    }
  };
}
