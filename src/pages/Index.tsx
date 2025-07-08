import { useState } from "react";
import GameBoard from "@/components/GameBoard";
import CodeBlockEditor from "@/components/CodeBlockEditor";
import { GameState, Position } from "@/types/game";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerPosition: { x: 0, y: 0 },
    playerDirection: 0, // 0: up, 1: right, 2: down, 3: left
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

  const [pseudocode, setPseudocode] = useState([
    "while off target",
    "  if front is clear",
    "    move forward",
    "  else",
    "    turn right"
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 flex flex-col items-center justify-start">
      <div className="w-full max-w-4xl mx-auto mt-8">
        <Card className="bg-gradient-to-br from-purple-800/80 to-slate-900/80 border-none shadow-2xl mb-10">
          <CardHeader className="items-center text-center p-8 pb-4">
            <CardTitle className="text-5xl font-extrabold text-white tracking-tight mb-2 drop-shadow-lg">
              Code Quest
            </CardTitle>
            <CardDescription className="text-lg text-purple-200 mb-4">
              Program your way to collect all the gems!
            </CardDescription>
            <div className="flex items-center justify-center gap-2 mt-2">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-purple-400 animate-pulse"><path d="M12 2L22 9l-10 13L2 9l10-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
              <span className="text-white text-lg font-medium">{gameState.gems.length - gameState.collectedGems.length} gems left</span>
            </div>
          </CardHeader>
        </Card>
      </div>
      <div className="w-full max-w-7xl mx-auto flex flex-col items-center">
        <div className="flex flex-col lg:flex-row w-full min-h-[640px] bg-slate-800/40 rounded-2xl shadow-2xl overflow-hidden border border-purple-500/10">
          <div className="flex flex-col items-center justify-start p-6 bg-slate-800/60 lg:w-1/2 w-full">
            <GameBoard gameState={gameState} setGameState={setGameState} />
          </div>
          <div className="bg-gradient-to-b from-purple-500/10 via-purple-400/30 to-purple-500/10 lg:w-px w-full lg:h-auto h-2" />
          <div className="flex flex-col gap-6 p-6 justify-start bg-slate-900/70 lg:w-1/2 w-full">
            <CodeBlockEditor gameState={gameState} setGameState={setGameState} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
