// Version 14: oneShot field added to prevent overlapping for sample tracks

"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import BPMSlider from "./BPMSlider";

const SAMPLE_LIST = ["kick.wav", "snare.wav", "hihat.wav", "Loop_rivers_103_8m_Gbm.wav", "SaxTest.mp3",]

// Order of notes shown in piano-roll (one octave)
const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

type TrackType = "sample" | "synth" | "instrument";

type Track = {
  id: number;
  name: string;
  type: TrackType;
  sample?: string; // only for sample tracks

  // steps: either single-row (sample) or multi-row (synth/instrument piano-roll)
  steps: boolean[] | boolean[][];
  stepsRef: React.RefObject<boolean[] | boolean[][]>;
  currentStep: React.RefObject<number>;
  subdivision: "1n" | "2n" | "4n" | "8n" | "16n" | "32n";
  measureCount: number;
  

  // audio nodes
  volume: Tone.Volume;
  player?: Tone.Player;
  playerRef?: React.RefObject<Tone.Player | null>;

  synth?: Tone.Synth;
  instrument?: Tone.Sampler;
  instrumentType?: string;

  // pitch controls (kept for convenience)
  octave: string;
  octaveRef: React.RefObject<string>;
  note?: string; // legacy single-note UI value (optional)

  sequence?: Tone.Sequence;
  color: string;

  oneShot?: boolean;   // if true, do NOT let sample overlap
};

export default function ModularSequencer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [trackCounter, setTrackCounter] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [isPlaying, setIsPlaying] = useState(false);
  const ignoreDrawsRef = useRef(false);

  const togglePlay = async () => {
    if (!isPlaying) {
      await Tone.start();
      ignoreDrawsRef.current = false;
      Tone.getTransport().start();
      setIsPlaying(true);
    } 
    else {
      Tone.getTransport().stop();
      setIsPlaying(false);

      tracks.forEach((track) => {
        // Stop sample player
        track.player?.stop();

        // Stop all one-shot overlapping players stored in track
        if ((track as any).overlapPlayers) {
          (track as any).overlapPlayers.forEach((p: Tone.Player) => {
            try { p.stop(); } catch {}
            try { p.dispose(); } catch {}
          });
          (track as any).overlapPlayers = [];
        }

        // Stop synth and instrument notes
        //track.synth?.releaseAll();
        track.instrument?.releaseAll();

        // Reset current step for visuals
        track.currentStep.current = 0;
      });

      setTracks((prev) => [...prev]);
    }
  };

  const getStepsPerMeasure = (subdivision: string) => {
    const num = parseInt(subdivision); // "16n" -> 16
    return num > 0 ? num : 16;
  };

  // helper to create 2D steps for piano roll
  const createPianoSteps = (subdivision: string, measureCount = 1) => {
    const stepsPerMeasure = getStepsPerMeasure(subdivision);
    const total = stepsPerMeasure * measureCount;
    // rows = NOTES.length, each row an array of booleans length total
    return NOTES.map(() => Array(total).fill(false));
  };

  // --- Add Track ---
  const addTrack = async (
    type: TrackType = "sample",
    subdivision: Track["subdivision"] = "16n"
    ) => {
    await Tone.start();

    const id = trackCounter;
    const stepsPerMeasure = getStepsPerMeasure(subdivision);
    const stepsLength = stepsPerMeasure;

    const volumeNode = new Tone.Volume(0).toDestination();

    let player: Tone.Player | undefined;
    let playerRef: React.RefObject<Tone.Player> | undefined;
    let synth: Tone.Synth | undefined;
    let instrument: Tone.Sampler | undefined;
    let instrumentType: string | undefined;

    let steps: boolean[] | boolean[][];
    if (type === "sample") {
      steps = Array(stepsLength).fill(false);
    } else {
      // synth or instrument -> piano-roll for single octave
      steps = createPianoSteps(subdivision, 1);
    }

    const stepsRef = { current: steps } as React.RefObject<boolean[] | boolean[][]>;
    const currentStep = { current: 0 };

    const octaveRef = { current: "4" } as React.RefObject<string>;

    if (type === "sample") {
      const sample = SAMPLE_LIST[0];
      player = new Tone.Player(`/samples/${sample}`);
      player.connect(volumeNode);
      player.autostart = false;
      playerRef = { current: player };
    } 
    else if (type === "synth") {
      synth = new Tone.Synth();
      synth.connect(volumeNode);
    } 
    else if (type === "instrument") {
        instrumentType = "Piano";
        instrument = new Tone.Sampler({
          urls: {
            A2: "A2.mp3",
            C3: "C3.mp3",
            A4: "A4.mp3",
            C6: "C6.mp3"
          },
          baseUrl: "/piano/",
          release: 1,
          attack: 0.01,
          curve: "exponential",
        })
        instrument.connect(volumeNode);
      }

    const newTrack: Track = {
      id,
      name: `Track ${id + 1}`,
      type,
      steps,
      stepsRef,
      currentStep,
      subdivision,
      measureCount: 1,
      volume: volumeNode,
      player,
      playerRef,
      synth,
      instrument,
      instrumentType,
      octave: "4",
      octaveRef,
      sequence: undefined,
      color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
      oneShot: true,
    };

    //newTrack.stepsRef.current = newTrack.steps;

    setTracks((prev) => [...prev, newTrack]);
    setTrackCounter((prev) => prev + 1);
  };

  // toggle a step:
  // - for sample: toggleStep(trackId, stepIndex)
  // - for synth/instrument: toggleStep(trackId, noteIndex, stepIndex)
  const toggleStep = (trackId: number, a: number, b?: number) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;

        // sample track: a = stepIndex
        if (track.type === "sample") {
          const stepIndex = a;
          const newSteps = [...(track.steps as boolean[])];
          newSteps[stepIndex] = !newSteps[stepIndex];
          track.stepsRef.current = newSteps;
          return { ...track, steps: newSteps };
        } 
        else {
          // synth/instrument: a = noteIndex, b = stepIndex
          const noteIndex = a;
          const stepIndex = b as number;
          const oldSteps = track.steps as boolean[][];
          const newSteps = oldSteps.map((row) => [...row]);
          newSteps[noteIndex][stepIndex] = !newSteps[noteIndex][stepIndex];
          track.stepsRef.current = newSteps;
          return { ...track, steps: newSteps };
        }
      })
    );
  };

  const changeSubdivision = (trackId: number, subdivision: Track["subdivision"]) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;

        // dispose old sequence
        if (track.sequence) {
          try {
            track.sequence.dispose();
          } catch (e) {}
        }

        // compute new total steps
        const stepsPerMeasure = getStepsPerMeasure(subdivision);
        const newTotal = stepsPerMeasure * track.measureCount;

        if (track.type === "sample") {
          const newSteps = Array(newTotal).fill(false);
          return {
            ...track,
            subdivision,
            steps: newSteps,
            stepsRef: { current: newSteps },
            sequence: undefined,
            oneShot: true
          };
        } else {
          // piano-roll: create new 2D grid (notes x newTotal)
          const newSteps = NOTES.map(() => Array(newTotal).fill(false));
          return {
            ...track,
            subdivision,
            steps: newSteps,
            stepsRef: { current: newSteps },
            sequence: undefined,
          };
        }
      })
    );
  };

  const changeMeasureCount = (trackId: number, newMeasureCount: number) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id !== trackId) return track;

        const stepsPerMeasure = getStepsPerMeasure(track.subdivision);
        const newTotalSteps = newMeasureCount * stepsPerMeasure;

        if (track.sequence) track.sequence.dispose();

        if (track.type === "sample") {
          return {
            ...track,
            measureCount: newMeasureCount,
            steps: Array(newTotalSteps).fill(false),
            stepsRef: { current: Array(newTotalSteps).fill(false) },
            sequence: undefined,
            oneShot: true
          };
        } else {
          // piano-roll -> create new rows for notes
          return {
            ...track,
            measureCount: newMeasureCount,
            steps: NOTES.map(() => Array(newTotalSteps).fill(false)),
            stepsRef: { current: NOTES.map(() => Array(newTotalSteps).fill(false)) },
            sequence: undefined,
          };
        }
      })
    );
  };

  const changeSample = async (trackId: number, sample: string) => {
    await Tone.start();
    const newBuffer = await new Tone.ToneAudioBuffer(`/samples/${sample}`);
  
    // Use current tracks state to find the track first
    const track = tracks.find(t => t.id === trackId && t.type === "sample");
    if (!track) return;
  
    // If there's an existing player instance (playerRef or player), update its buffer in-place.
    const existingPlayer = track.playerRef?.current ?? track.player;
    if (existingPlayer) {
      try {
        // stop any playback briefly to avoid weird behaviour (optional)
        try { existingPlayer.stop(); } catch {}
        existingPlayer.buffer = newBuffer;
        existingPlayer.autostart = false;
      } catch (e) {
        console.warn("failed to swap buffer in-place", e);
      }
  
      // update state only to store the sample string (no sequence dispose)
      setTracks(prev => prev.map(t => (t.id === trackId ? { ...t, sample } : t)));
      return;
    }
  
    // Fallback: no existing player -> create a player but DO NOT dispose sequence here
    const newPlayer = new Tone.Player();
    newPlayer.connect(track.volume);
    newPlayer.buffer = newBuffer;
    newPlayer.autostart = false;
  
    setTracks(prev =>
      prev.map(t => {
        if (t.id !== trackId) return t;
        // don't dispose sequence here; just replace player refs
        return { ...t, sample, player: newPlayer, playerRef: { current: newPlayer } };
      })
    );
  };
  

  const changeOctave = (trackId: number, octave: string) => {
    setTracks((prev) =>
      prev.map((track) => {
        if (track.id !== trackId) return track;
        track.octaveRef.current = octave;
        return { ...track, octave };
      })
    );
  };

  const changeInstrument = async (trackId: number, type: string) => {
    setTracks(prev =>
      prev.map(track => {
        if (track.id !== trackId || track.type !== "instrument") return track;
        // dispose old
        track.instrument?.dispose();
  
        let instrumentType = type;
        let instrument: Tone.Sampler;
  
        switch (type) {
          case "Piano":
            instrument = new Tone.Sampler({
              urls: { A2: "A2.mp3", C3: "C3.mp3", A4: "A4.mp3", C6: "C6.mp3" },
              baseUrl: "/piano/",
              release: 1,
              attack: 0.01,
            });
            break;
  
          case "Grand Piano":
            instrument = new Tone.Sampler({
              urls: {
                C0: "GrandPiano_C0.wav",
                C1: "GrandPiano_C1.wav",
                C2: "GrandPiano_C2.wav",
                C3: "GrandPiano_C3.wav",
                C4: "GrandPiano_C4.wav",
                C5: "GrandPiano_C5.wav",
                C6: "GrandPiano_C6.wav",
                C7: "GrandPiano_C7.wav",
              },
              baseUrl: "/grandPiano/",
              release: 1,
              attack: 0.01,
            });
            break;

            case "Meow Pad":
            instrument = new Tone.Sampler({
              urls: {
                C2: "Meow_C2.wav",
                C3: "Meow_C3.wav",
                C4: "Meow_C4.wav",
              },
              baseUrl: "/meowPad/",
              release: 1,
              attack: 0.01,
            });
            break;
  
          default:
            instrument = new Tone.Sampler({
              urls: { A2: "A2.mp3", C3: "C3.mp3", A4: "A4.mp3", C6: "C6.mp3" },
              baseUrl: "/piano/",
              release: 1,
              attack: 0.01,
            });
        }
        instrument.connect(track.volume); 

        if (track.sequence) track.sequence.dispose();

        return { ...track, instrumentType, instrument, sequence: undefined };
      })
    );
  };
  

  const changeVolume = (trackId: number, sliderValue: number) => {
    setTracks((prevTracks) =>
      prevTracks.map((track) => {
        if (track.id === trackId) {
          track.volume.volume.value = sliderValue / 2 - 50;
        }
        return track;
      })
    );
  };

  const removeTrack = (trackId: number) => {
    setTracks(prev => {
      // Find the track we are removing
      const track = prev.find(t => t.id === trackId);
      if (!track) return prev;
  
      // --- Stop and dispose audio nodes ---
      try { track.sequence?.dispose(); } catch {}
      try { track.player?.stop(); } catch {}
      try { track.player?.dispose(); } catch {}
  
      if (track.playerRef?.current) {
        try { track.playerRef.current.stop(); } catch {}
        try { track.playerRef.current.dispose(); } catch {}
      }
  
      if (track.synth) {
        try { track.synth.dispose(); } catch {}
      }
  
      if (track.instrument) {
        try { track.instrument.releaseAll?.(); } catch {}
        try { track.instrument.dispose(); } catch {}
      }
  
      // --- Clean up any overlapping sample players (non-oneShot mode) ---
      if ((track as any).overlapPlayers) {
        (track as any).overlapPlayers.forEach((p: Tone.Player) => {
          try { p.stop(); } catch {}
          try { p.dispose(); } catch {}
        });
      }
  
      // --- Dispose volume node ---
      try { track.volume.dispose(); } catch {}
  
      // --- Remove from list ---
      return prev.filter(t => t.id !== trackId);
    });
  };

  
  const chunkSteps = (steps: boolean[], measureCount: number, subdivision: string) => {
    const stepsPerMeasure = getStepsPerMeasure(subdivision);
    const chunks: boolean[][] = [];

    for (let m = 0; m < measureCount; m++) {
      const start = m * stepsPerMeasure;
      const end = start + stepsPerMeasure;
      chunks.push(steps.slice(start, end));
    }

    return chunks;
  };

  // BPM
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm;
  }, [bpm]);

  // Main effect: ensure sequences exist for every track and use the track.stepsRef for audio scheduling.
  useEffect(() => {
    tracks.forEach((track) => {
      // If sequence exists, leave it (we recreate only when sequence === undefined)
      if (!track.sequence) {
        const length = (() => {
          if (track.type === "sample") return (track.steps as boolean[]).length;
          const anyRow = (track.steps as boolean[][])[0];
          return anyRow ? anyRow.length : 0;
        })();

        const seq = new Tone.Sequence(
          (time, stepIndex) => {
            // Scheduling audio:
            try {
              if (track.type === "sample") {
                const steps = track.stepsRef.current as boolean[];
                if (steps && steps[stepIndex]) {
                  // Determine the active player source
                  const basePlayer =
                    track.playerRef?.current?.buffer
                      ? track.playerRef.current
                      : track.player;
        
                  if (!basePlayer) return;
        
                  if (track.oneShot) {
                    try { basePlayer.stop(); } catch {}
                    basePlayer.start(time);
                  } 
                  else {
                    const hit = new Tone.Player(basePlayer.buffer);
                    hit.connect(track.volume);
                    hit.start(time);
                    hit.onstop = () => { hit.dispose(); } 
                  }
                }
              }
              else if (track.type === "synth") {
                const grid = track.stepsRef.current as boolean[][];
                if (Array.isArray(grid)) {
                  for (let noteIndex = 0; noteIndex < grid.length; noteIndex++) {
                    const row = grid[noteIndex];
                    if (row && row[stepIndex]) {
                      const noteName = NOTES[noteIndex] + track.octaveRef.current;
                      track.synth?.triggerAttackRelease(noteName, track.subdivision, time);
                    }
                  }
                }
              } else if (track.type === "instrument") {
                const grid = track.stepsRef.current as boolean[][];
                if (Array.isArray(grid) && track.instrument) {
                  for (let noteIndex = 0; noteIndex < grid.length; noteIndex++) {
                    const row = grid[noteIndex];
                    if (row && row[stepIndex]) {
                      const noteName = NOTES[noteIndex] + track.octaveRef.current;
                      track.instrument.triggerAttackRelease(noteName, track.subdivision, time);
                    }
                  }
                }
              }
            } catch (e) {
              console.warn("schedule error", e);
            }

            // VISUAL update (only update if this step exists on this track length)
            Tone.getDraw().schedule(() => {
              const stepsRef = track.stepsRef.current;
              const stepExists =
                track.type === "sample"
                  ? (stepsRef as boolean[]).length > stepIndex
                  : Array.isArray(stepsRef) && (stepsRef as boolean[][])[0]?.length > stepIndex;

              if (stepExists) {
                track.currentStep.current = stepIndex;
                setTracks((prev) => [...prev]);
              }
            }, time);
          },
          Array.from({ length }, (_, i) => i),
          track.subdivision
        );

        seq.start(0);
        track.sequence = seq;
      }
    });
  }, [tracks]);

  // Cleanup
  useEffect(() => {
    return () => {
      tracks.forEach((t) => {
        try {
          t.sequence?.dispose();
          t.player?.dispose();
          t.instrument?.dispose?.();
        } catch (e) {}
      });
      Tone.getTransport().stop();
      Tone.getTransport().cancel(0);
    };
  }, []);

  const tileShouldHighlight = (tileIndex: number, track: Track) => {
    return tileIndex === track.currentStep.current;
  };

  return (
    <div className="w-screen flex justify-center pt-5">
      <div className="flex flex-col items-center pt-3 gap-10">
        <BPMSlider bpm={bpm} onChange={setBpm} />

        {/* PLAY, ADD TRACK BUTTONS */}
        <div className="flex w-screen justify-center gap-3">
          <button
            onClick={togglePlay}
            className={`w-[400px] py-1 text-white text-2xl font-bold rounded cursor-pointer ${
              isPlaying ? "bg-red-700" : "bg-green-600"
            }`}
          >
            {isPlaying ? "Stop" : "Play"}
          </button>

          <button
            onClick={() => addTrack("sample", "4n")}
            className="w-[400px] py-1 bg-indigo-700 text-white text-2xl font-bold rounded cursor-pointer"
          >
            + Add Sample
          </button>

          <button
            onClick={() => addTrack("synth", "4n")}
            className="w-[400px] py-1 bg-indigo-700 text-white text-2xl font-bold rounded cursor-pointer"
          >
            + Add Synth
          </button>

          <button
            onClick={() => addTrack("instrument", "4n")}
            className="w-[400px] py-1 bg-indigo-700 text-white text-2xl font-bold rounded cursor-pointer"
          >
            + Add Instrument
          </button>
        </div>

        <div className="flex w-screen justify-left bg-gray-600 px-10 gap-10">
          <span className="font-bold">Delay Bus</span>
          <span className="font-bold">Volume:</span>
        </div>

         {/* Track Headers ( Depending on track type, show specific dropdowns / options ) */}
        {tracks.map((track) => (
          <div key={track.id} className="flex w-screen flex-col items-center gap-3">
            <div className="flex w-full gap-3 font-bold items-center bg-zinc-800 rounded px-2 py-2">
              <span className="ml-10">[{track.name}] : {String(track.type)}</span>

               {/* Change Volume button, applies to all tracks */}
              <span>Volume: {Math.floor(track.volume.volume.value + 50) * 2}</span>
              <input
                type="range"
                min={0}
                max={100}
                value={(track.volume.volume.value + 50) * 2}
                onChange={(e) => changeVolume(track.id, Number(e.target.value))}
                className="w-50 h-1 bg-gray-600 rounded cursor-pointer appearance-none mt-0"
              />

               {/* Change Sample Button ( Sample tracks only ) */}
              {track.type === "sample" && (
                <>
                  <span>Sample:</span>
                  <select
                    value={track.sample}
                    onChange={(e) => changeSample(track.id, e.target.value)}
                    className="bg-purple-700 cursor-pointer"
                  >
                    {SAMPLE_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {track.type === "sample" && (
                <>
                  <label className="ml-3 flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={track.oneShot}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setTracks(prev =>
                          prev.map(t => {
                            if (t.id !== track.id) return t;

                            // dispose existing sequence so it gets recreated with fresh settings
                            try { t.sequence?.dispose(); } catch {}

                            return {
                              ...t,
                              oneShot: newValue,
                              sequence: undefined
                            };
                          })
                        );
                      }}
                    />
                    Prevent Overlap
                  </label>
                </>
              )}

               {/* Change Instrument Button (instrument tracks only ) */}
              {track.type === "instrument" && (
                <>
                  <span>Instrument:</span>
                  <select
                    value={track.instrumentType}
                    onChange={(e) => changeInstrument(track.id, e.target.value)}
                    className="bg-purple-700 cursor-pointer"
                  >
                    {["Piano", "Grand Piano", "Meow Pad"].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </>
              )}

              {/* Octave control for piano-roll tracks */}
              {(track.type === "synth" || track.type === "instrument") && (
                <>
                  <span>Octave:</span>
                  <select
                    value={track.octave}
                    onChange={(e) => changeOctave(track.id, e.target.value)}
                    className="bg-purple-700 cursor-pointer"
                  >
                    {["0", "1", "2", "3", "4", "5", "6", "7"].map((octave) => (
                      <option key={octave} value={octave}>
                        {octave}
                      </option>
                    ))}
                  </select>
                </>
              )}

               {/* Subdivision Dropdown, applies to all tracsk */}
              <span>Subdivision:</span>
              <select
                value={track.subdivision}
                className="bg-orange-700"
                onChange={(e) =>
                  changeSubdivision(track.id, e.target.value as Track["subdivision"])
                }
              >
                <option value="1n">Whole Note</option>
                <option value="2n">Half Note</option>
                <option value="4n">Quarter Note</option>
                <option value="8n">Eighth Note</option>
                <option value="16n">Sixteenth Note</option>
                <option value="32n">Thirty-Second Note</option>
              </select>

               {/* Measure Dropdown, applies to all tracks */}
              <span>Measures:</span>
              <select
                value={track.measureCount}
                onChange={(e) => changeMeasureCount(track.id, Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>

              <button onClick={() => removeTrack(track.id)}
              className="bg-red-700 text-white px-5 rounded cursor-pointer">
                Remove Track
              </button>
            </div>

            {/* GRID RENDERING, Check if either a sample for simple single row steps, else create piano roll */}
            {track.type === "sample" ? (
              // keep previous single-row rendering for samples (chunked by measures)
              chunkSteps(track.steps as boolean[], track.measureCount, track.subdivision).map(
                (row, rowIndex) => (
                  <div key={rowIndex} className="flex w-screen justify-center px-10 gap-1.5">
                    {row.map((active, i) => {
                      const globalIndex = rowIndex * row.length + i;
                      return (
                        <div
                          key={globalIndex}
                          onClick={() => toggleStep(track.id, globalIndex)}
                          className={`h-16 rounded border border-gray-800 flex items-center justify-center select-none 
                                      cursor-pointer text-2xl font-bold hover:bg-gray-900 
                            ${active ? "bg-indigo-900" : "bg-gray-700"} 
                            ${tileShouldHighlight(globalIndex, track)
                              ? "outline outline-6 outline-cyan-400"
                              : "outline-none"}`}
                          style={{ width: `${100 / row.length}%` }}
                        >
                          {globalIndex + 1}
                        </div>
                      );
                    })}
                  </div>
                )
              )
            ) : (
              // Piano-roll: render a row per note (notes vertically)
              (() => {
                const grid = track.steps as boolean[][];
                const totalSteps = grid[0]?.length ?? 0;

                return (
                  <div className="flex flex-col w-full px-0 gap-1">
                    {NOTES.map((noteLabel, noteIndex) => {
                      const row = grid[noteIndex] || Array(totalSteps).fill(false);
                      return (
                        <div key={noteLabel} className="flex w-screen items-center gap-2">
                          {/* note label */}
                          <div className="px-3 w-10 text-right pr-2 font-mono">{noteLabel + track.octave}</div>

                          {/* step tiles */}
                          <div className="flex flex-row gap-1.5 w-screen mr-10">
                            {row.map((active, stepIndex) => {
                              const globalIndex = stepIndex;
                              return (
                                <div
                                  key={stepIndex}
                                  onClick={() => toggleStep(track.id, noteIndex, stepIndex)}
                                  className={`h-10 rounded border border-gray-800 flex items-center 
                                              justify-center select-none cursor-pointer text-sm font-bold hover:bg-gray-900
                                    ${active ? "bg-indigo-900" : "bg-gray-700"}
                                    ${tileShouldHighlight(globalIndex, track)
                                      ? "outline outline-4 outline-cyan-400"
                                      : "outline-none"}`}
                                  style={{
                                    width: `${100 / totalSteps}%`,
                                  }}
                                >
                                  {globalIndex + 1}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
