import { useState } from "react";
import GameConsoleLayout from "@/components/GameConsoleLayout";
import type { Block } from "@/components/CodeBlockEditor";
import { motion } from "motion/react";
import { RefreshCw } from "lucide-react";

let blockIdCounter = 1000;
function generateBlockId() {
  return `block-${blockIdCounter++}`;
}

const GRID_SIZE = 14;
const NUM_GEMS = 6;
const NUM_OBSTACLES = 18;

function randomInt(n) {
  return Math.floor(Math.random() * n);
}

function randomGridState() {
  // Place player at (0,0)
  const playerPosition = { x: 0, y: 0 };
  // Place gems
  const gems = [];
  const occupied = new Set([`0,0`]);
  while (gems.length < NUM_GEMS) {
    const x = randomInt(GRID_SIZE);
    const y = randomInt(GRID_SIZE);
    const key = `${x},${y}`;
    if (!occupied.has(key)) {
      gems.push({ x, y });
      occupied.add(key);
    }
  }
  // Place obstacles, but not on player or gems
  const obstacles = [];
  let tries = 0;
  while (obstacles.length < NUM_OBSTACLES && tries < 500) {
    const x = randomInt(GRID_SIZE);
    const y = randomInt(GRID_SIZE);
    const key = `${x},${y}`;
    if (!occupied.has(key)) {
      obstacles.push({ x, y });
      occupied.add(key);
    }
    tries++;
  }
  return {
    playerPosition,
    playerDirection: 0,
    shadowPosition: { x: -1, y: -1 },
    shadowDirection: 0,
    gems,
    obstacles,
    collectedGems: [],
    isExecuting: false,
    gridSize: GRID_SIZE,
  };
}

const Index = () => {
  const [gameState, setGameState] = useState(randomGridState());
  const [blocks, setBlocks] = useState<Block[]>([]);

  const addMoveForwardBlock = () => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: "move",
      option: "forward",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };
  const addMoveBackwardBlock = () => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: "move",
      option: "backward",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };
  const addTurnLeftBlock = () => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: "turn",
      option: "left",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };
  const addTurnRightBlock = () => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: "turn",
      option: "right",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };
  const addJumpBlock = () => {
    const newBlock: Block = {
      id: generateBlockId(),
      type: "jump",
      option: "",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  const handleNewGame = () => {
    setGameState(randomGridState());
    setBlocks([]);
  };

  return (
    <motion.div 
      className="relative min-h-screen animate-bg bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/6 left-1/6 w-2 h-2 bg-blue-400/30 rounded-full"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/40 rounded-full"
          animate={{ 
            y: [0, -15, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 4, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400/25 rounded-full"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [1, 1.8, 1]
          }}
          transition={{ 
            duration: 5, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
      </div>

      <motion.div 
        className="flex justify-center py-4 relative z-10"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <motion.button
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 text-white font-bold text-lg shadow-lg border-2 border-blue-400/60 flex items-center gap-3"
          onClick={handleNewGame}
          whileHover={{ 
            scale: 1.05, 
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.4)',
            background: 'linear-gradient(to right, #1d4ed8, #2563eb)'
          }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: ['0 4px 15px rgba(59, 130, 246, 0.3)', '0 8px 20px rgba(59, 130, 246, 0.4)', '0 4px 15px rgba(59, 130, 246, 0.3)']
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut"
          }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="w-5 h-5" />
          </motion.div>
          <span className="drop-shadow-glow">New Game</span>
        </motion.button>
      </motion.div>
      
      <GameConsoleLayout
        gameState={gameState}
        setGameState={setGameState}
        blocks={blocks}
        setBlocks={setBlocks}
        addMoveForwardBlock={addMoveForwardBlock}
        addMoveBackwardBlock={addMoveBackwardBlock}
        addTurnLeftBlock={addTurnLeftBlock}
        addTurnRightBlock={addTurnRightBlock}
        addJumpBlock={addJumpBlock}
      />
    </motion.div>
  );
};

export default Index;
