import React, { useRef, useEffect } from "react";
import { GameState } from "@/types/game";
import { Gem, User, Ghost, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GameBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState }) => {
  const { playerPosition, playerDirection, shadowPosition, shadowDirection, gems, collectedGems, gridSize, obstacles = [] } = gameState;
  const prevPositionRef = useRef(playerPosition);
  const [isJumping, setIsJumping] = React.useState(false);

  // Detect when player moves and trigger jump animation
  useEffect(() => {
    const prevPos = prevPositionRef.current;
    const currentPos = playerPosition;
    
    if (prevPos.x !== currentPos.x || prevPos.y !== currentPos.y) {
      // Check if movement is in the direction the character is facing
      const dx = currentPos.x - prevPos.x;
      const dy = currentPos.y - prevPos.y;
      
      let isMovingForward = false;
      
      // Direction 0: Up (y decreases)
      if (playerDirection === 0 && dy < 0) isMovingForward = true;
      // Direction 1: Right (x increases)
      else if (playerDirection === 1 && dx > 0) isMovingForward = true;
      // Direction 2: Down (y increases)
      else if (playerDirection === 2 && dy > 0) isMovingForward = true;
      // Direction 3: Left (x decreases)
      else if (playerDirection === 3 && dx < 0) isMovingForward = true;
      
      // Only trigger jump animation if moving forward
      if (isMovingForward) {
        setIsJumping(true);
        const timer = setTimeout(() => setIsJumping(false), 600);
        return () => clearTimeout(timer);
      }
    }
    
    prevPositionRef.current = currentPos;
  }, [playerPosition, playerDirection]);

  const isGemAt = (x: number, y: number): boolean => {
    return gems.some(gem => gem.x === x && gem.y === y) && 
           !collectedGems.some(collected => collected.x === x && collected.y === y);
  };

  const getRotation = (direction: number): string => {
    // Ensure direction is always between 0-3
    const normalizedDirection = ((direction % 4) + 4) % 4;
    const rotations = ["rotate-0", "rotate-90", "rotate-180", "rotate-270"];
    return rotations[normalizedDirection];
  };

  // Calculate grid cell size for smooth animations
  const cellSize = 100 / gridSize; // percentage

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-cyan-400/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-4xl aspect-square z-10">
        <motion.div 
          className="grid gap-0.5 bg-slate-900/80 p-0.5 rounded-xl shadow-lg aspect-square w-full h-full"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            minWidth: '420px',
            minHeight: '420px',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
            backdropFilter: 'blur(6px)',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isPlayer = playerPosition.x === x && playerPosition.y === y;
            const isShadow = shadowPosition.x === x && shadowPosition.y === y;
            const hasGem = isGemAt(x, y);
            const hasObstacle = obstacles.some(o => o.x === x && o.y === y);

            return (
              <motion.div
                key={index}
                className={`
                  relative border border-blue-300/30 bg-slate-800/60 rounded-xl shadow-md
                  ${isPlayer ? 'bg-blue-500/40 border-blue-400/80 shadow-blue-400/30' : ''}
                  ${hasGem ? 'bg-purple-500/30 border-purple-400/60 shadow-purple-400/20' : ''}
                  ${hasObstacle ? 'bg-red-900/60 border-red-500/80' : ''}
                `}
                style={{ aspectRatio: '1/1', minWidth: 0, minHeight: 0 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.01 }}
              >
                {isPlayer && (
                  <motion.div 
                    className={`
                      absolute inset-0 flex items-center justify-center
                      transform transition-transform duration-300 drop-shadow-lg
                      ${getRotation(playerDirection)}
                    `}
                    initial={{ scale: 0, y: 0 }}
                    animate={{ 
                      scale: 1, 
                      y: isJumping ? [-20, -40, -20, 0] : 0, // Jump animation when moving, no movement when idle
                      rotate: isJumping ? 
                        (playerDirection === 0 ? [0, 10, -10, 0] : // Up
                         playerDirection === 1 ? [0, 15, -15, 0] : // Right
                         playerDirection === 2 ? [0, -10, 10, 0] : // Down
                         [0, -15, 15, 0]) : // Left
                        0 // No rotation when not jumping
                    }}
                                          transition={{ 
                        duration: isJumping ? 0.6 : 0.4, 
                        ease: isJumping ? "easeInOut" : "easeOut",
                        y: isJumping ? {
                          duration: 0.6,
                          ease: "easeInOut"
                        } : undefined,
                        rotate: isJumping ? {
                          duration: 0.6,
                          ease: "easeInOut"
                        } : undefined
                      }}
                    layoutId="player"
                  >
                    <motion.div
                      whileHover={{ scale: 1.2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <User className="w-7 h-7 text-blue-300 drop-shadow-glow" />
                    </motion.div>
                  </motion.div>
                )}
                {isShadow && (
                  // Show shadow if it's at a different position OR if it's at same position but different direction
                  (!isPlayer || (isPlayer && shadowDirection !== playerDirection)) && (
                    <motion.div 
                      className={`
                        absolute inset-0 flex items-center justify-center
                        transform transition-transform duration-300 drop-shadow-lg opacity-40 grayscale
                        ${getRotation(shadowDirection)}
                      `}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.4 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                    >
                      <User className="w-7 h-7 text-blue-200" />
                    </motion.div>
                  )
                )}
                {hasGem && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ 
                      scale: 1, 
                      rotate: 360,
                      y: [0, -5, 0]
                    }}
                    transition={{ 
                      duration: 0.8, 
                      ease: "easeOut",
                      y: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <Gem className="w-6 h-6 text-purple-300 drop-shadow-glow" />
                  </motion.div>
                )}
                {hasObstacle && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center z-10" 
                    title="Obstacle"
                    initial={{ scale: 0, rotate: 0 }}
                    animate={{ scale: 1, rotate: 360 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Square className="w-7 h-7 text-red-400 drop-shadow-glow" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Enhanced status display */}
      <motion.div 
        className="mt-6 text-center space-y-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-4">
          <motion.div 
            className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-purple-200 text-sm font-semibold drop-shadow">
              Position: ({playerPosition.x}, {playerPosition.y})
            </div>
          </motion.div>
          <motion.div 
            className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-blue-200 text-sm font-semibold drop-shadow">
              Direction: {['↑', '→', '↓', '←'][playerDirection]}
            </div>
          </motion.div>
        </div>
        <motion.div 
          className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-600/50 backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-green-200 text-sm font-semibold drop-shadow">
            Gems Collected: {collectedGems.length}/{gems.length}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GameBoard;
