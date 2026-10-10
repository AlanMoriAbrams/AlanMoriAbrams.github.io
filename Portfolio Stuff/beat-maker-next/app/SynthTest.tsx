"use client";

import React, { useEffect, useRef } from "react";
import * as Tone from "tone";

export default function SynthTest() {
  const synthRef = useRef<any>(null);

  useEffect(() => {
    // Create synth on the client
    synthRef.current = new Tone.MembraneSynth().toDestination();
  }, []);

  const playSynth = async () => {
    await Tone.start();
    synthRef.current?.triggerAttackRelease("C4", "16n");
  };

  return (
    <button
      onClick={playSynth}
      className="bg-rose-600 block mx-auto p-2 rounded text-white"
    >
      Play Synth
    </button>
  );
}
