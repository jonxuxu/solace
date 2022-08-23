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

const doc = new Y.Doc();
const wsProvider = new WebsocketProvider(
  "wss://demos.yjs.dev",
  "hl22-vibes",
  doc
);

wsProvider.on("status", (event) => {
  console.log(event.status); // logs "connected" or "disconnected"
});

const awareness = wsProvider.awareness;

awareness.on("change", ({ updated }) => {
  if (updated) {
    const states = awareness.getStates();
    updated.forEach((key) => {
      // key is the clientID
      const state = states.get(key); // state is updated awareness state
      const { canvasInfo } = state;
      if (canvasInfo && canvasInfo.click) {
        playNote();
      }
    });
  }
});

function playNote() {
  const audio = new Audio(notes[Math.floor(Math.random() * notes.length)]);
  audio.play();
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(deepSynth));
  const [fade, setFade] = useState(false);

  useEffect(() => {
    audio.addEventListener("timeupdate", function () {
      var buffer = 0.35;
      if (this.currentTime > this.duration - buffer) {
        this.currentTime = 0;
        this.play();
      }
    });
    audio.volume = 0.2;
  }, []);

  useEffect(() => {
    const startPlaying = () => {
      const fadeAudio = setInterval(() => {
        if (audio.volume !== 4) {
          audio.volume += 0.02;
        }

        if (audio.volume > 0.38) {
          clearInterval(fadeAudio);
        }
      }, 200);
      audio.play();
    };
    const stopPlaying = () => {
      const fadeAudio = setInterval(() => {
        if (audio.volume !== 0) {
          audio.volume -= 0.02;
        }

        if (audio.volume < 0.02) {
          clearInterval(fadeAudio);
        }
      }, 200);
      audio.pause();
    };

    // isPlaying ? startPlaying() : stopPlaying();
  }, [isPlaying, audio]);

  return (
    <MainDiv>
      {isPlaying ? (
        <Canvas awareness={awareness} />
      ) : (
        <StartButton
          onClick={() => {
            setFade(true);
            setTimeout(() => {
              setIsPlaying(!isPlaying);
            }, 2000);
            audio.volume = 0.4;
            audio.play();
          }}
          visible={!fade}
        >
          wrap me in the deep
        </StartButton>
      )}

      {/* Background ambience */}

      {/* Our Main song, dynamic interaction */}
      <Song isPlaying={isPlaying} bpm={60}>
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
      </Song>
    </MainDiv>
  );
}

export default App;

const MainDiv = styled.div`
  background-color: black;
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
  position: relative;
`;

const StartButton = styled.button`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  text-align: center;
  font-size: 2rem;
  color: #fff;
  background-color: black;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  z-index: 1;
  font-family: "Crimson Text", serif;
  opacity: ${(props) => (props.visible ? "1" : "0")};
  transition: opacity 2s ease-in-out;
`;
