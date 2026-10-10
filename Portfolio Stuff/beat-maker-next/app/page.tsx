import DrumPad from "./components/DrumPad";
import StepSequencer from "./components/StepSequencer";
import SynthTest from "./SynthTest";

export default function Home() {
  return (  
    <div className="min-h-screen flex">
      <StepSequencer />
    </div>
  );
}
