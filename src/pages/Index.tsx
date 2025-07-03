
import { useState } from "react";
import GameBoard from "@/components/GameBoard";
import PseudocodeEditor from "@/components/PseudocodeEditor";
import { GameState, Position } from "@/types/game";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerPosition: { x: 0, y: 0 },
    playerDirection: 0, // 0: up, 1: right, 2: down, 3: left
    gems: [
      { x: 2, y: 1 },
      { x: 4, y: 3 },
      { x: 1, y: 4 },
      { x: 3, y: 2 }
    ],
    collectedGems: [],
    isExecuting: false,
    gridSize: 6
  });

  const [pseudocode, setPseudocode] = useState([
    "while gems remain",
    "  move forward",
    "  if gem found",
    "    collect gem",
    "  turn right"
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Code Quest
          </h1>
          <p className="text-purple-200">
            Program your way to collect all the gems!
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
            <span className="text-white">{gameState.gems.length - gameState.collectedGems.length} gems left</span>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <GameBoard gameState={gameState} setGameState={setGameState} />
          <PseudocodeEditor 
            pseudocode={pseudocode}
            setPseudocode={setPseudocode}
            gameState={gameState}
            setGameState={setGameState}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
