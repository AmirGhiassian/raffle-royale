"use client";
import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import Image from "next/image";

// Define the types for our data structures
type Participant = {
  name: string;
  tickets: number;
};

type ConfettiPieceData = {
  id: number;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
  animationDelay: number;
};

// Define the types for the component's props
type ConfettiPieceProps = {
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
  animationDelay: number;
};

// Confetti Piece Component with TypeScript props
const ConfettiPiece = ({
  x,
  y,
  color,
  width,
  height,
  animationDelay,
}: ConfettiPieceProps) => {
  // This outer div handles the vertical falling motion and horizontal drift
  const outerStyle: React.CSSProperties = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    transition: "top 5s ease-in, left 4s ease-out",
  };

  // This inner div handles the fluttering and rotating animation
  const innerStyle: React.CSSProperties & { [key: string]: string | number } = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: color,
    "--flutter-rotate-y-end": `${720 + Math.random() * 360}deg`,
    "--flutter-rotate-x-end": `${360 + Math.random() * 360}deg`,
    "--flutter-duration": `${1.5 + Math.random() * 1}s`,
    animation: `flutter var(--flutter-duration) ease-in-out infinite`,
    animationDelay: `${animationDelay}s`,
  };

  return (
    <div style={outerStyle}>
      <div style={innerStyle} />
    </div>
  );
};

// Main App Component
export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([
    { name: "Alice", tickets: 2 },
    { name: "Bob", tickets: 1 },
    { name: "Charlie", tickets: 5 },
  ]);
  const [newName, setNewName] = useState("");
  const [newTickets, setNewTickets] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);
  const [isRaffling, setIsRaffling] = useState(false);
  const [shufflingName, setShufflingName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPieceData[]>([]);
  const leftConfettiDiv = useRef<HTMLDivElement>(null);
  const rightConfettiDiv = useRef<HTMLDivElement>(null);

  const winnerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refs for Tone.js sound objects (using 'any' as it's a CDN script)
  const drumSynth = useRef<any>(null);
  const winnerSynth = useRef<any>(null);
  const drumLoop = useRef<any>(null);

  // Effect to load Tone.js and initialize synths
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js";
    script.async = true;
    script.onload = () => {
      const Tone = (window as any).Tone;
      if (Tone) {
        drumSynth.current = new Tone.MembraneSynth().toDestination();
        winnerSynth.current = new Tone.PolySynth(Tone.Synth).toDestination();
      }
    };
    document.body.appendChild(script);

    // Cleanup script on component unmount
    return () => {
      const Tone = (window as any).Tone;
      if (Tone && Tone.Transport.state === "started") {
        Tone.Transport.stop();
        Tone.Transport.cancel();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (winner && winnerRef.current) {
      winnerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [winner]);

  const addParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newTickets > 0) {
      setParticipants([
        ...participants,
        { name: newName.trim(), tickets: parseInt(String(newTickets), 10) },
      ]);
      setNewName("");
      setNewTickets(1);
    }
  };

  const removeParticipant = (index: number) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };
/* 
// If you want to trigger confetti, move this logic inside a function after the winner is picked, e.g.:
const triggerConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { x: 0, y: 0 }, // top left corner
    gravity: 0.5,
    colors: ['#FF69B4', '#FFC67D', '#8BC34A'],
    duration: 4000, // 4 seconds
  });
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { x: 1, y: 0 }, // top right corner
    gravity: 0.5,
    colors: ['#FF69B4', '#FFC67D', '#8BC34A'],
    duration: 4000, // 4 seconds
  });
};
*/



const triggerConfetti = () => {
  confetti({
    spread: 380,
    particleCount: 1500,
    angle: 45,
    startVelocity: 100,
    origin: { x: 0, y: 1},
    gravity: 1.5,
    colors: ['#FF69B4', '#FFC67D', '#8BC34A'],
  });
  confetti({
    spread: 380,
    particleCount: 1500,
    angle: -45,
    startVelocity: 100,
    origin: { x: 1, y: 1 },
    gravity: 1.5,
    colors: ['#FF69B4', '#FFC67D', '#8BC34A'],
  });
};
const startRaffle = async () => {
  const Tone = (window as any).Tone;
  if (
    participants.length === 0 ||
      !drumSynth.current ||
      !winnerSynth.current ||
      !Tone
    )
      return;

    // Start audio context
    if (Tone.context.state !== "running") {
      await Tone.start();
    }

    setIsRaffling(true);
    setWinner(null);
    setShowConfetti(false);
    setConfettiPieces([]);

    // Start drum roll sound
    drumLoop.current = new Tone.Loop((time: number) => {
      drumSynth.current.triggerAttackRelease("C2", "16n", time);
    }, "16n").start(0);
    Tone.Transport.start();

    const allTickets = participants.flatMap((p) =>
      Array(p.tickets).fill(p.name),
    );
    if (allTickets.length === 0) {
      setIsRaffling(false);
      return;
    }

    let shuffleCount = 0;
    const maxShuffles = 30 + Math.floor(Math.random() * 15);


    const shuffleInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * allTickets.length);
      setShufflingName(allTickets[randomIndex]);
      shuffleCount++;

      if (shuffleCount > maxShuffles) {
        clearInterval(shuffleInterval);

        if (drumLoop.current) {
          drumLoop.current.stop();
          Tone.Transport.stop();
          Tone.Transport.cancel();
        }

        const finalWinnerIndex = Math.floor(Math.random() * allTickets.length);
        const finalWinner = allTickets[finalWinnerIndex];
        setWinner(finalWinner);
        setShufflingName("");
        setIsRaffling(false);

triggerConfetti();


        const now = Tone.now();
        winnerSynth.current.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
        winnerSynth.current.triggerAttackRelease(
          ["G4", "B4", "D5"],
          "8n",
          now + 0.2,
        );
        winnerSynth.current.triggerAttackRelease(
          ["C5", "E5", "G5"],
          "4n",
          now + 0.4,
        );
      }
    }, 120);
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const newParticipants: Participant[] = text
          .split("\n")
          .map((row) => {
            const columns = row.split(",");
            if (columns.length !== 2) return null;

            const name = columns[0].trim();
            const tickets = parseInt(columns[1].trim(), 10);

            if (name && !isNaN(tickets) && tickets > 0) {
              return { name, tickets };
            }
            return null;
          })
          .filter((p): p is Participant => p !== null);

        setParticipants((prev) => [...prev, ...newParticipants]);
      } catch (error) {
        console.error("Error parsing CSV file:", error);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const getTotalTickets = () => {
    return participants.reduce((total, p) => total + p.tickets, 0);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-8 flex flex-col items-center">
      <div ref={leftConfettiDiv} id="left-confetti-canvas" className="fixed top-0 left-0 w-1/2 h-full pointer-events-none z-50 overflow-hidden"></div>
      <div ref={rightConfettiDiv} id="right-confetti-canvas" className="fixed top-0 right-0 w-1/2 h-full pointer-events-none z-50 overflow-hidden"></div>

      <div className="w-full max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
            Raffle Royale
          </h1>
          <p className="text-gray-400 mt-2">Who will be the lucky winner?</p>
        </header>

        <main className="bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
              {/* Add Participants Form */}
              <div>
                <h2 className="text-2xl font-semibold mb-4 border-b-2 border-purple-500 pb-2">
                  Add Participants
                </h2>
                <form onSubmit={addParticipant} className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Participant's Name"
                    className="bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    required
                  />
                  <input
                    type="number"
                    value={newTickets}
                    onChange={(e) => setNewTickets(Number(e.target.value))}
                    min="1"
                    className="bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-transform transform hover:scale-105 shadow-lg"
                  >
                    Add Entry
                  </button>
                </form>
              </div>
              {/* CSV Upload Section */}
              <div>
                <h3 className="text-xl font-semibold mb-3">Or Upload CSV</h3>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Import from CSV
                </button>
              </div>
            </div>

            {/* Right side: Participant list */}
            <div className="flex flex-col">
              <h2 className="text-2xl font-semibold mb-4 border-b-2 border-pink-500 pb-2">
                Entries ({getTotalTickets()})
              </h2>
              <div className="flex-grow overflow-y-auto max-h-80 bg-gray-900/50 rounded-lg p-2 pr-4 custom-scrollbar">
                {participants.length > 0 ? (
                  <ul className="space-y-2">
                    {participants.map((p, i) => (
                      <li
                        key={`${p.name}-${i}`}
                        className="flex justify-between items-center bg-gray-700 p-3 rounded-lg animate-fade-in"
                      >
                        <span className="font-medium">{p.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm bg-pink-500 text-white font-bold rounded-full px-3 py-1">
                            {p.tickets} {p.tickets > 1 ? "tickets" : "ticket"}
                          </span>
                          <button
                            onClick={() => removeParticipant(i)}
                            className="text-gray-400 hover:text-red-500 transition"
                            aria-label={`Remove ${p.name}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400 text-center py-8">
                    No participants yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Raffle Controls and Display */}
          <div className="mt-8 pt-6 border-t-2 border-gray-700 text-center">
            <button
              onClick={startRaffle}
              disabled={isRaffling || participants.length === 0}
              className="bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-4 px-10 rounded-full text-xl hover:from-green-500 hover:to-blue-600 transition-all transform hover:scale-110 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isRaffling ? "Picking..." : "Start Raffle!"}

            </button>

            <div className="mt-8 min-h-[100px] flex items-center justify-center">
              {isRaffling && (
                <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-500 animate-pulse">
                  {shufflingName}
                </div>
              )}
              {winner && (
                <div ref={winnerRef} className="text-center animate-jump-in">
                  <h3 className="text-xl text-gray-300">The winner is...</h3>
                  <p className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-yellow-300 to-orange-400 mt-2 animate-winner-text">
                    {winner}!
                                            <Image src="/ticket.png" alt="Raffle Royale Logo" width={300} height={300} className="mx-auto" />
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
