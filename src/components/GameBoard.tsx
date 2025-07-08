
import React from "react";
import { GameState, Position } from "@/types/game";
import { Gem, User } from "lucide-react";

interface GameBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { playerPosition, playerDirection, gems, collectedGems, gridSize } = gameState;

  const isGemAt = (x: number, y: number): boolean => {
    return gems.some(gem => gem.x === x && gem.y === y) && 
           !collectedGems.some(collected => collected.x === x && collected.y === y);
  };

  const getRotation = (direction: number): string => {
    const rotations = ["rotate-0", "rotate-90", "rotate-180", "rotate-270"];
    return rotations[direction];
  };

  return (
    <div className="flex flex-col items-center w-full h-full flex-1">
      <div className="bg-slate-800 p-2 rounded-2xl shadow-2xl border border-purple-500/30 w-full h-full flex-1">
        <div 
          className="grid gap-1 bg-slate-900 p-1 rounded-xl border-2 border-blue-400/50 w-full h-full aspect-square max-w-lg"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: '100%',
            height: '100%',
            minWidth: '320px',
            minHeight: '320px',
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isPlayer = playerPosition.x === x && playerPosition.y === y;
            const hasGem = isGemAt(x, y);

            return (
              <div
                key={index}
                className={`
                  relative border border-blue-300/20 bg-slate-800/50 rounded-sm
                  ${isPlayer ? 'bg-blue-500/30 border-blue-400' : ''}
                  ${hasGem ? 'bg-purple-500/20' : ''}
                  transition-all duration-300
                `}
              >
                {isPlayer && (
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transform transition-transform duration-300
                    ${getRotation(playerDirection)}
                  `}>
                    <User className="w-6 h-6 text-blue-400" />
                  </div>
                )}
                {hasGem && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gem className="w-5 h-5 text-purple-400 animate-pulse" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-purple-200 text-sm">
          Position: ({playerPosition.x}, {playerPosition.y})
        </div>
        <div className="text-blue-200 text-sm">
          Direction: {['↑', '→', '↓', '←'][playerDirection]}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
