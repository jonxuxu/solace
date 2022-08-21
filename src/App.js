import React, { useState } from "react";
import { Song, Track, Instrument, Effect } from "reactronica";
import "./App.css";

const snareSample = "/snare-top-off17.wav";
const kickSample = "/st2_kick_one_shot_low_punch_basic.wav";
const deepSynth = "/deepAmbience.wav";

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [samples, setSamples] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <p>Hello Vite + React + Reactronica!</p>
        <p>
          <button type="button" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? "Stop" : "Play"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (samples) {
                console.log("Clear samples");
                setSamples(null);
              } else {
                console.log("Add samples");
                setSamples({
                  C3: deepSynth,
                });
              }
            }}
          >
            {samples ? "Remove" : "Add"} samples
          </button>
        </p>
      </header>

      <Song isPlaying={isPlaying} bpm={60}>
        {/* <Track steps={["C3", "G3", "E3", "A3"]}>
          <Instrument type="synth" />
          // Distortion effect
          <Effect type="distortion" wet={0.2} />
          // Add more to chain effects together
          <Effect type="feedbackDelay" wet={0.3} />
          <Effect type="autoFilter" />
        </Track> */}

        <Track steps={[{ name: "C3", duration: 30, velocity: 1 }]}>
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
        </Track>
      </Song>
    </div>
  );
}

export default App;
