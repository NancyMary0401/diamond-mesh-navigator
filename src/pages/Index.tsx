import { useState, useRef } from "react";
import GameBoard from "@/components/GameBoard";
import CodeBlockEditor from "@/components/CodeBlockEditor";
import ChatComponent from "@/components/ChatComponent";
import TopBar from "@/components/TopBar";

// Import Block type and generateBlockId from CodeBlockEditor
import type { Block } from "@/components/CodeBlockEditor";
// We'll redefine generateBlockId here for now
let blockIdCounter = 1000;
function generateBlockId() {
  return `block-${blockIdCounter++}`;
}

const Index = () => {
  const [gameState, setGameState] = useState({
    playerPosition: { x: 0, y: 0 },
    playerDirection: 0,
    shadowPosition: { x: 0, y: 0 },
    shadowDirection: 0,
    gems: [
      { x: 2, y: 1 },
      { x: 7, y: 3 },
      { x: 1, y: 8 },
      { x: 9, y: 2 },
      { x: 5, y: 7 },
      { x: 8, y: 9 }
    ],
    collectedGems: [],
    isExecuting: false,
    gridSize: 10
  });
  const [showChat, setShowChat] = useState(false);

  // --- LIFTED CODE BLOCK STATE ---
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Function to add a move forward block
  const addMoveForwardBlock = () => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: "move",
      option: "forward",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  return (
    <div className="relative min-h-screen animate-bg bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex flex-col">
      {/* Glassy TopBar */}
      <TopBar gemsLeft={gameState.gems.length - gameState.collectedGems.length} />
      {/* Main content: GameBoard and Code Editor side by side, perfectly aligned */}
      <div className="flex flex-1 pt-20 max-w-screen-2xl mx-auto w-full items-stretch justify-center gap-8">
        {/* GameBoard Card */}
        <div className="glass rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col justify-center h-full min-h-[500px]">
          <GameBoard gameState={gameState} setGameState={setGameState} />
        </div>
        {/* Code Editor Card, no tabs */}
        <div className="glass rounded-3xl shadow-2xl p-6 max-w-xl w-full flex flex-col justify-center h-full min-h-[500px]">
          <CodeBlockEditor
            gameState={gameState}
            setGameState={setGameState}
            blocks={blocks}
            setBlocks={setBlocks}
          />
        </div>
      </div>
      {/* Floating Chat Open Button */}
      <button
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 shadow-2xl flex items-center justify-center text-white text-3xl hover:scale-105 transition-all"
        onClick={() => setShowChat(v => !v)}
        aria-label="Open Chat"
      >
        <span className="material-icons">chat</span>
      </button>
      {/* Floating ChatComponent (draggable, only if open) */}
      {showChat && (
        <ChatComponent
          floating
          gameState={gameState}
          setGameState={setGameState}
          addMoveForwardBlock={addMoveForwardBlock}
        />
      )}
    </div>
  );
};

export default Index;
