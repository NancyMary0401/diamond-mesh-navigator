import React from "react";
import { GameState } from "@/types/game";
import { Gem, User, Ghost } from "lucide-react";


interface GameBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { playerPosition, playerDirection, shadowPosition, shadowDirection, gems, collectedGems, gridSize } = gameState;

  const isGemAt = (x: number, y: number): boolean => {
    return gems.some(gem => gem.x === x && gem.y === y) && 
           !collectedGems.some(collected => collected.x === x && collected.y === y);
  };

  const getRotation = (direction: number): string => {
    const rotations = ["rotate-0", "rotate-90", "rotate-180", "rotate-270"];
    return rotations[direction];
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950">
      <div className="relative w-full max-w-md aspect-square">
        <div 
          className="grid gap-1 bg-slate-900/80 p-1 rounded-xl shadow-lg aspect-square w-full h-full"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            minWidth: '320px',
            minHeight: '320px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            backdropFilter: 'blur(6px)',
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isPlayer = playerPosition.x === x && playerPosition.y === y;
            const isShadow = shadowPosition.x === x && shadowPosition.y === y;
            const hasGem = isGemAt(x, y);

            return (
              <div
                key={index}
                className={`
                  relative border border-blue-300/30 bg-slate-800/60 rounded-xl shadow-md
                  ${isPlayer ? 'bg-blue-500/40 border-blue-400/80 shadow-blue-400/30' : ''}
                  ${hasGem ? 'bg-purple-500/30 border-purple-400/60 shadow-purple-400/20' : ''}
                  transition-all duration-300 hover:scale-105 hover:z-10
                `}
                style={{ aspectRatio: '1/1', minWidth: 0, minHeight: 0 }}
              >
                {isPlayer && (
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transform transition-transform duration-300 drop-shadow-lg
                    ${getRotation(playerDirection)}
                  `}>
                    <User className="w-7 h-7 text-blue-300 drop-shadow-glow animate-bounce" />
                  </div>
                )}
                {isShadow && (
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transform transition-transform duration-300 drop-shadow-lg opacity-40 grayscale
                    ${getRotation(shadowDirection)}
                  `}>
                    <User className="w-7 h-7 text-blue-200" />
                  </div>
                )}
                {hasGem && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gem className="w-6 h-6 text-purple-300 animate-pulse drop-shadow-glow" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-6 text-center">
        <div className="text-purple-200 text-base font-semibold drop-shadow">Position: ({playerPosition.x}, {playerPosition.y})</div>
        <div className="text-blue-200 text-base font-semibold drop-shadow">Direction: {['↑', '→', '↓', '←'][playerDirection]}</div>
      </div>

    </div>
  );
};

export default GameBoard;
