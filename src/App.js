import React, { useState, useEffect } from "react";
import { Song, Track, Instrument, Effect } from "reactronica";
import "./App.css";

const deepSynth = "/deepAmbience.wav";

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
  }, [isPlaying]);

  return (
    <div className="App">
      <header className="App-header">
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
        {/* <Track steps={["C3", "G3", "E3", "A3"]}>
          <Instrument type="synth" />
          // Distortion effect
          <Effect type="distortion" wet={0.2} />
          // Add more to chain effects together
          <Effect type="feedbackDelay" wet={0.3} />
          <Effect type="autoFilter" />
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
