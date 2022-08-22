import React, { useState, useEffect } from "react";
import { Song, Track, Instrument, Effect } from "reactronica";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import "./App.css";
import Canvas from "./Canvas"

const deepSynth = "/deepAmbience.wav";

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

awareness.on("change", () => {
  // Map each awareness state to a dom-string
  console.log(Array.from(awareness.getStates().values()));
});

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
  }, []);

  useEffect(() => {
    isPlaying ? audio.play() : audio.pause();
    awareness.setLocalStateField("playMusic", {
      value: isPlaying ? 1 : 0,
    });
  }, [isPlaying, audio]);

  return (
    <div className="App">
      <header className="App-header">
				<Canvas />

        <p>Deep Vibes</p>
        <p>
          <button type="button" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Stop" : "Play"}
          </button>
        </p>
      </header>

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
