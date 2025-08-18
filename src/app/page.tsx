"use client";
import React, { useState, useEffect, useRef } from "react";

// Confetti Piece Component
const ConfettiPiece = ({ x, y, color, width, height, animationDelay }) => {
  // This outer div handles the vertical falling motion and horizontal drift
  const outerStyle = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    transition: "top 5s ease-in, left 4s ease-out", // Slower fall and added horizontal movement
  };

  // This inner div handles the fluttering and rotating animation
  const innerStyle = {
    width: `${width}px`,
    height: `${height}px`,
    backgroundColor: color,
    // CSS variables are used to randomize the animation for each piece
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
  const [participants, setParticipants] = useState([
    { name: "Alice", tickets: 2 },
    { name: "Bob", tickets: 1 },
    { name: "Charlie", tickets: 5 },
  ]);
  const [newName, setNewName] = useState("");
  const [newTickets, setNewTickets] = useState(1);
  const [winner, setWinner] = useState(null);
  const [isRaffling, setIsRaffling] = useState(false);
  const [shufflingName, setShufflingName] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  const winnerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Refs for Tone.js sound objects
  const drumSynth = useRef(null);
  const winnerSynth = useRef(null);
  const drumLoop = useRef(null);

  // Effect to load Tone.js and initialize synths
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js";
    script.async = true;
    script.onload = () => {
      // Initialize synths once Tone.js is loaded
      drumSynth.current = new window.Tone.MembraneSynth().toDestination();
      winnerSynth.current = new window.Tone.PolySynth(
        window.Tone.Synth,
      ).toDestination();
    };
    document.body.appendChild(script);

    // Cleanup script on component unmount
    return () => {
      if (window.Tone && window.Tone.Transport.state === "started") {
        window.Tone.Transport.stop();
        window.Tone.Transport.cancel();
      }
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (winner && winnerRef.current) {
      winnerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [winner]);

  const addParticipant = (e) => {
    e.preventDefault();
    if (newName.trim() && newTickets > 0) {
      setParticipants([
        ...participants,
        { name: newName.trim(), tickets: parseInt(newTickets, 10) },
      ]);
      setNewName("");
      setNewTickets(1);
    }
  };

  const removeParticipant = (index) => {
    const newParticipants = [...participants];
    newParticipants.splice(index, 1);
    setParticipants(newParticipants);
  };

  const startRaffle = async () => {
    if (participants.length === 0 || !drumSynth.current || !winnerSynth.current)
      return;

    // Start audio context
    if (window.Tone.context.state !== "running") {
      await window.Tone.start();
    }

    setIsRaffling(true);
    setWinner(null);
    setShowConfetti(false);
    setConfettiPieces([]);

    // Start drum roll sound
    drumLoop.current = new window.Tone.Loop((time) => {
      drumSynth.current.triggerAttackRelease("C2", "16n", time);
    }, "16n").start(0);
    window.Tone.Transport.start();

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

        // Stop drum roll
        if (drumLoop.current) {
          drumLoop.current.stop();
          window.Tone.Transport.stop();
          window.Tone.Transport.cancel();
        }

        const finalWinnerIndex = Math.floor(Math.random() * allTickets.length);
        const finalWinner = allTickets[finalWinnerIndex];
        setWinner(finalWinner);
        setShufflingName("");
        setIsRaffling(false);
        triggerConfetti();

        // Play winner sound
        const now = window.Tone.now();
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

  const triggerConfetti = () => {
    setShowConfetti(true);
    const newPieces = Array.from({ length: 200 }).map(() => ({
      x: Math.random() * window.innerWidth,
      y: -20,
      width: 8 + Math.random() * 8,
      height: 5 + Math.random() * 5,
      color: `hsl(${Math.random() * 360}, 90%, 60%)`,
      id: Math.random(),
      animationDelay: Math.random() * 4,
    }));
    setConfettiPieces(newPieces);

    setTimeout(() => {
      setConfettiPieces((pieces) =>
        pieces.map((p) => ({
          ...p,
          y: window.innerHeight + 20,
          // Add horizontal drift for a spreading effect
          x: p.x + (Math.random() - 0.5) * 300,
        })),
      );
    }, 100);

    setTimeout(() => {
      setShowConfetti(false);
      setConfettiPieces([]);
    }, 6000);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const newParticipants = text
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
          .filter(Boolean); // Filter out any null/invalid rows

        setParticipants((prev) => [...prev, ...newParticipants]);
      } catch (error) {
        console.error("Error parsing CSV file:", error);
        // You could show an error message to the user here
      }
    };
    reader.readAsText(file);
    // Clear the file input value so the same file can be uploaded again
    event.target.value = null;
  };

  const getTotalTickets = () => {
    return participants.reduce((total, p) => total + p.tickets, 0);
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-8 flex flex-col items-center">
      {showConfetti && (
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-50 overflow-hidden">
          {confettiPieces.map((piece) => (
            <ConfettiPiece
              key={piece.id}
              x={piece.x}
              y={piece.y}
              width={piece.width}
              height={piece.height}
              color={piece.color}
              animationDelay={piece.animationDelay}
            />
          ))}
        </div>
      )}

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
                    onChange={(e) => setNewTickets(e.target.value)}
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
                  onClick={() => fileInputRef.current.click()}
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
                        key={i}
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
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #ec4899; border-radius: 20px; border: 3px solid #1f2937; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        @keyframes jump-in { 0% { transform: scale(0.5) translateY(50px); opacity: 0; } 80% { transform: scale(1.1) translateY(-10px); opacity: 1; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        .animate-jump-in { animation: jump-in 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
        @keyframes winner-text-anim { 0%, 100% { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #fff, 0 0 20px #fde047, 0 0 30px #fde047, 0 0 40px #fde047, 0 0 55px #fde047; } 50% { text-shadow: none; } }
        .animate-winner-text { animation: winner-text-anim 2s infinite; }
        @keyframes flutter { 0% { transform: rotateY(0) rotateX(0); } 100% { transform: rotateY(var(--flutter-rotate-y-end)) rotateX(var(--flutter-rotate-x-end)); } }
      `}</style>
    </div>
  );
}
