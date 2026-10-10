"use client";

import React, { useEffect, useRef } from "react";
import * as Tone from "tone";

export default function DrumPad() {
  const playerRef = useRef<Tone.Player | null>(null);

  const delayBusRef = useRef<Tone.FeedbackDelay | null>(null);

  const CreateDelayBus = async () => {
    let delay = new Tone.FeedbackDelay({
      delayTime: "8n",
      feedback: 0.3,
    }).toDestination();
    delayBusRef.current = delay;
  }

  // 2: useEffect: The function inside runs AFTER this component has rendered.
  useEffect(() => {
    // Create and load player
    CreateDelayBus();
    playerRef.current = new Tone.Player("/samples/kick.wav").toDestination();
    playerRef.current.connect(delayBusRef.current!)
  }, []);

  const playKick = async () => {
    await Tone.start(); // required to unlock audio

    if (playerRef.current?.loaded) {
      playerRef.current.start();
    } else {
      console.log("Sample not loaded yet");
    }
  };

  // 1: Button is returned and showed
  return (
        <button onClick={playKick} 
          className="w-screen  bg-rose-600 block mx-auto">
          Play Kick
        </button>
      );
}
