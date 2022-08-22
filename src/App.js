import React, { useState, useEffect } from "react";
import { Song, Track, Instrument, Effect } from "reactronica";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import "./App.css";
import Canvas from "./Canvas";

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
  "ws://44.207.249.52:1234",
  "my-roomname",
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
      if (canvasInfo) {
        playNote();
      }
    });
  }
});

function playNote() {
  const audio = new Audio(notes[Math.floor(Math.random() * notes.length)]);
	audio.addEventListener("canplaythrough", (event) => {
		audio.play();
	});
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio(deepSynth));

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
    isPlaying ? audio.play() : audio.pause();
  }, [isPlaying, audio]);

  return (
    <div className="App">
      <Canvas awareness={awareness} />
      {!isPlaying && (
        <button onClick={() => setIsPlaying(!isPlaying)} className="Start">
          Start
        </button>
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
    </div>
  );
}

export default App;
