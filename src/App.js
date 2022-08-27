import React, { useState, useEffect } from "react";
import { Song, Track, Instrument, Effect } from "reactronica";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import "./App.css";
import Canvas from "./Canvas";
import styled from "styled-components";

const deepSynth = "/deepAmbience.wav";
const notes = [
  "/gsharp.wav",
  "/asharp.wav",
  "/b.wav",
  "/csharp.wav",
  "/dsharp.wav",
  "/e.wav",
  "/fsharp.wav",
];
const gong = "/gong.mp3";

const doc = new Y.Doc();
const wsProvider = new WebsocketProvider(
  "wss://demos.yjs.dev",
  "hl22-vibes",
  doc
);

const awareness = wsProvider.awareness;

function playNote() {
  const audio = new Audio(notes[Math.floor(Math.random() * notes.length)]);
  audio.volume = 1;
  audio.play();
}

function playGong() {
  const audio = new Audio(gong);
  audio.volume = 0.5;
  audio.play();
}

function App() {
  const [audio] = useState(new Audio(deepSynth));

  useEffect(() => {
    audio.addEventListener("timeupdate", function () {
      var buffer = 0.35;
      if (this.currentTime > this.duration - buffer) {
        this.currentTime = 0;
        this.play();
      }
    });
    audio.volume = 0;

    doc.getMap("gameDoc").observe((yMapEvent) => {
      if (yMapEvent.keysChanged.has("note")) {
        playNote();
      } else if (yMapEvent.keysChanged.has("gong")) {
        playGong();
      }
    });
  }, []);

  return (
    <MainDiv>
      <Poem>
        <div id="poem-centered"></div>
      </Poem>
      <GameCanvas
        wsProvider={wsProvider}
        yMap={doc.getMap("gameDoc")}
        awareness={awareness}
        onStart={() => {
          audio.volume = 0;
          audio.play();

          const fadeAudio = setInterval(() => {
            audio.volume += 0.01;
            if (audio.volume > 0.18) {
              clearInterval(fadeAudio);
            }
          }, 400);
        }}
      />
      {/* Background ambience */}

      {/* Our Main song, dynamic interaction */}
      {/* <Song isPlaying={isPlaying} bpm={60}> */}
      {/* <Track steps={["G3", null, null, "A3"]}>
          <Instrument type="synth" />
          <Effect type="feedbackDelay" wet={0.3} />
        </Track> */}

      {/* <Track steps={[{ name: "C3", duration: 30, velocity: 1 }]}>
          <Instrument
            type="sampler"
            samples={{
              C3: deepSynth,
            }}
            // onLoad={(buffers) => {
            //   console.log('loaded');
            //   console.log(buffers);
            // }}
          ></Instrument>
        </Track> */}
      {/* </Song> */}
    </MainDiv>
  );
}

export default App;

const MainDiv = styled.div`
  background-color: black;
  width: 100%;
  height: 100%;
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
`;

const Poem = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -2;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  font-family: "Crimson Text", serif;
`;

const GameCanvas = styled(Canvas)`
  width: 100%;
  height: 100%;
`;
