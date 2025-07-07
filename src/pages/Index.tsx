import { useState } from "react";
import GameBoard from "@/components/GameBoard";
import DragDropEditor from "@/components/DragDropEditor";
import KeyboardControls from "@/components/KeyboardControls";
import CommandHistory from "@/components/CommandHistory";
import { GameState, Position } from "@/types/game";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

// Function to generate random position
const getRandomPosition = (gridSize: number): Position => {
  return {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize)
  };
};

// Function to generate random positions with bot near player
const getRandomPositions = (gridSize: number): { player: Position; bot: Position } => {
  const playerPos = getRandomPosition(gridSize);
  
  // Generate bot position within 2-4 cells of player
  let botPos: Position;
  let attempts = 0;
  
  do {
    const distance = 2 + Math.floor(Math.random() * 3); // 2-4 cells away
    const direction = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
    
    botPos = { ...playerPos };
    
    switch (direction) {
      case 0: // up
        botPos.y = Math.max(0, playerPos.y - distance);
        break;
      case 1: // right
        botPos.x = Math.min(gridSize - 1, playerPos.x + distance);
        break;
      case 2: // down
        botPos.y = Math.min(gridSize - 1, playerPos.y + distance);
        break;
      case 3: // left
        botPos.x = Math.max(0, playerPos.x - distance);
        break;
    }
    
    attempts++;
  } while (
    // Ensure bot is not too close (at least 2 cells) and not too far (max 4 cells)
    (Math.abs(playerPos.x - botPos.x) + Math.abs(playerPos.y - botPos.y) < 2) ||
    (Math.abs(playerPos.x - botPos.x) + Math.abs(playerPos.y - botPos.y) > 4) ||
    attempts > 10
  );
  
  return { player: playerPos, bot: botPos };
};

const Index = () => {
  // Generate initial random positions
  const initialPositions = getRandomPositions(15);
  
  const [gameState, setGameState] = useState<GameState>({
    player: {
      position: initialPositions.player,
      direction: Math.floor(Math.random() * 4), // Random direction
      health: 1, // Player dies in 1 shot
      isAlive: true
    },
    gems: [
      { x: 2, y: 1 },
      { x: 5, y: 3 },
      { x: 1, y: 5 },
      { x: 6, y: 2 },
      { x: 3, y: 6 },
      { x: 7, y: 4 },
      { x: 4, y: 8 },
      { x: 9, y: 1 },
      { x: 0, y: 9 },
      { x: 8, y: 7 }
    ],
    collectedGems: [],
    dropZones: [
      { x: 10, y: 10 },
      { x: 11, y: 11 },
      { x: 12, y: 12 },
      { x: 13, y: 13 },
      { x: 14, y: 14 },
      { x: 0, y: 14 },
      { x: 14, y: 0 },
      { x: 7, y: 14 },
      { x: 14, y: 7 },
      { x: 3, y: 12 }
    ],
    score: 0,
    isExecuting: false,
    gridSize: 15,
    dropZoneIndex: 0,
    bot: {
      position: initialPositions.bot,
      direction: Math.floor(Math.random() * 4), // Random direction
      collectedGems: [],
      isCarryingGem: false,
      targetGem: null,
      dropTarget: null,
      state: 'searching',
      health: 2, // Bot takes 2 shots to kill
      isAlive: true
    },
    bullets: []
  });

  const [pseudocode, setPseudocode] = useState([
    "while off target",
    "  if front is clear",
    "    move forward",
    "  else",
    "    turn right"
  ]);

  const [commandHistory, setCommandHistory] = useState<Array<{
    id: string;
    type: 'move' | 'collect' | 'drop' | 'shoot';
    direction?: 'up' | 'down' | 'left' | 'right';
    timestamp: number;
    scoreChange?: number;
    blocked?: boolean;
    zoneProgress?: string;
    hit?: boolean;
    target?: string;
  }>>([]);

  const resetGame = () => {
    // Generate new random positions for reset
    const newPositions = getRandomPositions(15);
    
    setGameState({
      player: {
        position: newPositions.player,
        direction: Math.floor(Math.random() * 4), // Random direction
        health: 1, // Player dies in 1 shot
        isAlive: true
      },
      gems: [
        { x: 2, y: 1 },
        { x: 5, y: 3 },
        { x: 1, y: 5 },
        { x: 6, y: 2 },
        { x: 3, y: 6 },
        { x: 7, y: 4 },
        { x: 4, y: 8 },
        { x: 9, y: 1 },
        { x: 0, y: 9 },
        { x: 8, y: 7 }
      ],
      collectedGems: [],
      dropZones: [
        { x: 10, y: 10 },
        { x: 11, y: 11 },
        { x: 12, y: 12 },
        { x: 13, y: 13 },
        { x: 14, y: 14 },
        { x: 0, y: 14 },
        { x: 14, y: 0 },
        { x: 7, y: 14 },
        { x: 14, y: 7 },
        { x: 3, y: 12 }
      ],
      score: 0,
      isExecuting: false,
      gridSize: 15,
      dropZoneIndex: 0,
      bot: {
        position: newPositions.bot,
        direction: Math.floor(Math.random() * 4), // Random direction
        collectedGems: [],
        isCarryingGem: false,
        targetGem: null,
        dropTarget: null,
        state: 'searching',
        health: 2, // Bot takes 2 shots to kill
        isAlive: true
      },
      bullets: []
    });
    setCommandHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">


        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Game Board Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-white text-lg font-semibold">
                  Score: {gameState.score}
                </div>
                <div className="text-purple-300 text-sm">
                  Drop Zone: {gameState.dropZoneIndex + 1}/{gameState.dropZones.length}
                </div>
                <div className="text-blue-300 text-sm">
                  🎲 Random Spawn | 🤖 Competitive Bot
                </div>
              </div>
              <Button
                onClick={resetGame}
                variant="outline"
                size="sm"
                className="border-red-400 text-red-400 hover:bg-red-400/10"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset Game
              </Button>
            </div>
            <GameBoard 
              gameState={gameState} 
              setGameState={setGameState}
              onCommandGenerated={(command) => setCommandHistory(prev => [...prev, command])}
            />
          </div>

          {/* Live Commands Section */}
          <div className="lg:col-span-1">
            <CommandHistory 
              commands={commandHistory}
              onClearHistory={() => setCommandHistory([])}
            />
          </div>
        </div>

        {/* Code Editor Section */}
        <div className="mt-6">
          <DragDropEditor 
            pseudocode={pseudocode}
            setPseudocode={setPseudocode}
            gameState={gameState}
            setGameState={setGameState}
          />
        </div>

        <div className="mt-8">
          <KeyboardControls 
            gameState={gameState} 
            setGameState={setGameState}
            onCommandGenerated={(command) => setCommandHistory(prev => [...prev, command])}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
