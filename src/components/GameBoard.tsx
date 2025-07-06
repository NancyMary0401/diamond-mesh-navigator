import React, { useEffect, useState } from "react";
import { GameState, Position } from "@/types/game";
import { Gem, Sparkles, Star, Zap, Target, Code, Cpu, Binary, Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GameBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

// Custom Code Bot Character Component
const CustomCharacter: React.FC<{ direction: number; isExecuting: boolean }> = ({ direction, isExecuting }) => {
  return (
    <div className="relative w-10 h-10">
      {/* Main Bot Body */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-slate-600 via-blue-600 to-indigo-700 rounded-lg border-2 border-blue-400 shadow-lg"
        animate={{
          scale: isExecuting ? [1, 1.05, 1] : 1,
          boxShadow: isExecuting 
            ? ["0 0 20px rgba(59, 130, 246, 0.6)", "0 0 30px rgba(59, 130, 246, 0.9)", "0 0 20px rgba(59, 130, 246, 0.6)"]
            : "0 0 10px rgba(59, 130, 246, 0.4)"
        }}
        transition={{
          scale: { duration: 0.5, repeat: Infinity },
          boxShadow: { duration: 0.5, repeat: Infinity }
        }}
      >
        {/* Circuit Board Pattern */}
        <div className="absolute inset-1 bg-gradient-to-br from-blue-400/20 to-indigo-500/20 rounded-sm" />
        <div className="absolute top-1 left-1 w-1 h-1 bg-green-400 rounded-full" />
        <div className="absolute top-1 right-1 w-1 h-1 bg-green-400 rounded-full" />
        <div className="absolute bottom-1 left-1 w-1 h-1 bg-green-400 rounded-full" />
        <div className="absolute bottom-1 right-1 w-1 h-1 bg-green-400 rounded-full" />
        
        {/* Circuit Lines */}
        <div className="absolute top-2 left-0 w-full h-0.5 bg-blue-300/30" />
        <div className="absolute bottom-2 left-0 w-full h-0.5 bg-blue-300/30" />
        <div className="absolute left-2 top-0 w-0.5 h-full bg-blue-300/30" />
        <div className="absolute right-2 top-0 w-0.5 h-full bg-blue-300/30" />
        
        {/* Binary Eyes */}
        <div className="absolute top-2 left-2 w-2 h-2 bg-green-400 rounded-sm animate-pulse border border-green-300">
          <div className="text-[4px] text-black font-mono font-bold leading-none">10</div>
        </div>
        <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-sm animate-pulse border border-green-300">
          <div className="text-[4px] text-black font-mono font-bold leading-none">01</div>
        </div>
        
        {/* CPU Core */}
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-400 rounded-sm border border-yellow-300"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Direction Indicator */}
        <motion.div
          className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-blue-300 rounded-full"
          animate={{ rotate: direction * 90 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Antenna */}
      <motion.div
        className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-blue-400 rounded-full"
        animate={{
          y: [0, -2, 0],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div
          className="absolute -top-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-400 rounded-full"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Code Execution Effects */}
      {isExecuting && (
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            y: [0, -8, -15]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeOut"
          }}
        >
          <div className="flex flex-col items-center">
            <Code className="w-3 h-3 text-green-400" />
            <Cpu className="w-2 h-2 text-blue-400 -mt-1" />
            <Binary className="w-1 h-1 text-yellow-400 -mt-1" />
          </div>
        </motion.div>
      )}

      {/* Data Stream Trail */}
      <motion.div
        className="absolute inset-0"
        animate={{ rotate: direction * 90 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gradient-to-t from-blue-400 via-green-400 to-transparent rounded-full"
          animate={{
            height: isExecuting ? [12, 16, 12] : 12,
            opacity: isExecuting ? [0.6, 1, 0.6] : 0.8
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Data Particles */}
      {isExecuting && (
        <>
          <motion.div
            className="absolute -top-3 -left-1 w-1 h-1 bg-green-400 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, -8],
              y: [0, -8]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.3
            }}
          />
          <motion.div
            className="absolute -top-3 -right-1 w-1 h-1 bg-blue-400 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              x: [0, 8],
              y: [0, -8]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.6
            }}
          />
          <motion.div
            className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-yellow-400 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              y: [0, -10]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: 0.9
            }}
          />
        </>
      )}

      {/* Processing Bars */}
      <motion.div
        className="absolute -right-1 top-1 w-1 h-2 bg-gradient-to-b from-green-400 to-blue-400 rounded-full"
        animate={{
          scaleY: [1, 0.3, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -left-1 top-1 w-1 h-2 bg-gradient-to-b from-blue-400 to-green-400 rounded-full"
        animate={{
          scaleY: [0.3, 1, 0.3],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.6
        }}
      />
    </div>
  );
};

// Floating Action Buttons
const FloatingActions: React.FC<{ gameState: GameState; setGameState: React.Dispatch<React.SetStateAction<GameState>> }> = ({ gameState, setGameState }) => {
  return (
    <div className="absolute top-4 left-4 flex flex-col gap-3 z-30">
      <motion.button
        className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg border-2 border-green-400 flex items-center justify-center text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setGameState(prev => ({ ...prev, isExecuting: !prev.isExecuting }))}
      >
        {gameState.isExecuting ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </motion.button>
      
      <motion.button
        className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg border-2 border-blue-400 flex items-center justify-center text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setGameState(prev => ({
            ...prev,
            playerPosition: { x: 0, y: 0 },
            playerDirection: 0,
            collectedGems: [],
            isExecuting: false
          }));
        }}
      >
        <RotateCcw className="w-5 h-5" />
      </motion.button>
    </div>
  );
};

// Floating Info Cards
const FloatingInfo: React.FC<{ gameState: GameState }> = ({ gameState }) => {
  return (
    <div className="absolute top-4 right-4 z-30">
      <motion.div
        className="bg-gradient-to-r from-purple-600/90 to-blue-600/90 backdrop-blur-sm p-3 rounded-xl border border-purple-400/30 shadow-lg"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        whileHover={{ scale: 1.05, y: -2 }}
      >
        <div className="text-center">
          <div className="text-white text-xs font-medium mb-1">Gems Collected</div>
          <div className="text-2xl font-bold text-yellow-300">
            {gameState.collectedGems.length}/{gameState.gems.length}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Animated Background Elements
const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Code Symbols */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-blue-400/20 text-2xl"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            rotate: 0
          }}
          animate={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            rotate: 360
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {['{', '}', '[', ']', '<', '>', '/', ';'][i]}
        </motion.div>
      ))}
      
      {/* Pulsing Orbs */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={`orb-${i}`}
          className="absolute w-2 h-2 bg-purple-400/30 rounded-full blur-sm"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 0.5, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}
    </div>
  );
};

const GameBoard: React.FC<GameBoardProps> = ({ gameState, setGameState }) => {
  const { playerPosition, playerDirection, gems, collectedGems, gridSize, isExecuting } = gameState;
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, type: string}>>([]);
  const [lastPosition, setLastPosition] = useState<Position>(playerPosition);
  const [showTrail, setShowTrail] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);

  // Generate particles when gems are collected
  useEffect(() => {
    if (collectedGems.length > 0) {
      const lastCollected = collectedGems[collectedGems.length - 1];
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        x: lastCollected.x,
        y: lastCollected.y,
        type: ['sparkle', 'star', 'zap'][Math.floor(Math.random() * 3)]
      }));
      setParticles(prev => [...prev, ...newParticles]);
      
      // Clean up particles after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 2000);
    }
  }, [collectedGems]);

  // Show trail when executing
  useEffect(() => {
    if (isExecuting && playerPosition.x !== lastPosition.x || playerPosition.y !== lastPosition.y) {
      setShowTrail(true);
      setLastPosition(playerPosition);
      setTimeout(() => setShowTrail(false), 500);
    }
  }, [playerPosition, isExecuting, lastPosition]);

  const isGemAt = (x: number, y: number): boolean => {
    return gems.some(gem => gem.x === x && gem.y === y) && 
           !collectedGems.some(collected => collected.x === x && collected.y === y);
  };

  const getDirectionArrow = (direction: number): string => {
    const arrows = ["↑", "→", "↓", "←"];
    return arrows[direction];
  };

  const renderParticle = (particle: {id: number, x: number, y: number, type: string}) => {
    const icons = {
      sparkle: Sparkles,
      star: Star,
      zap: Zap
    };
    const Icon = icons[particle.type as keyof typeof icons];
    
    return (
      <motion.div
        key={particle.id}
        initial={{ 
          x: particle.x * (384 / gridSize) + (384 / gridSize) / 2,
          y: particle.y * (384 / gridSize) + (384 / gridSize) / 2,
          scale: 0,
          opacity: 1
        }}
        animate={{
          x: particle.x * (384 / gridSize) + (384 / gridSize) / 2 + (Math.random() - 0.5) * 100,
          y: particle.y * (384 / gridSize) + (384 / gridSize) / 2 + (Math.random() - 0.5) * 100,
          scale: [0, 1, 0],
          opacity: [1, 1, 0]
        }}
        transition={{
          duration: 2,
          ease: "easeOut"
        }}
        className="absolute pointer-events-none z-20"
      >
        <Icon className="w-4 h-4 text-green-400 drop-shadow-lg" />
      </motion.div>
    );
  };

  return (
    <div className="relative flex flex-col items-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Floating Action Buttons */}
      <FloatingActions gameState={gameState} setGameState={setGameState} />
      
      {/* Floating Info Cards */}
      <FloatingInfo gameState={gameState} />

      {/* Main Game Board Container */}
      <motion.div 
        className="relative bg-gradient-to-br from-slate-800/80 via-purple-900/40 to-slate-800/80 p-8 rounded-3xl shadow-2xl border border-purple-500/30 backdrop-blur-sm mt-20"
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10"
            animate={{
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
          <motion.div 
            className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(147,51,234,0.15),transparent_50%)]"
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        </div>

        {/* Grid Container */}
        <div className="relative">
          <motion.div 
            className="grid gap-1 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 p-6 rounded-2xl border-2 border-blue-400/30 shadow-inner backdrop-blur-sm"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: '432px',
              height: '432px'
          }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isPlayer = playerPosition.x === x && playerPosition.y === y;
            const hasGem = isGemAt(x, y);
              const isTrail = showTrail && lastPosition.x === x && lastPosition.y === y;
              const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

            return (
                <motion.div
                key={index}
                className={`
                    relative border border-blue-300/10 bg-gradient-to-br from-slate-800/80 to-slate-700/60 rounded-lg cursor-pointer
                    ${isPlayer ? 'bg-gradient-to-br from-blue-500/40 to-indigo-600/30 border-blue-400/60 shadow-lg shadow-blue-500/25' : ''}
                    ${hasGem ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/20 border-purple-400/40' : ''}
                    ${isTrail ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/40' : ''}
                    ${isHovered ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/60 shadow-lg shadow-yellow-500/25' : ''}
                  transition-all duration-300
                `}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ 
                    duration: 0.3, 
                    delay: index * 0.005,
                    ease: "easeOut"
                  }}
                  whileHover={{ 
                    scale: 1.1,
                    boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                    zIndex: 10
                  }}
                  onHoverStart={() => setHoveredCell({ x, y })}
                  onHoverEnd={() => setHoveredCell(null)}
                  onClick={() => {
                    // Interactive click effect
                    if (!isPlayer && !hasGem) {
                      // Create a ripple effect
                      const ripple = document.createElement('div');
                      ripple.className = 'absolute inset-0 bg-blue-400/30 rounded-lg animate-ping';
                      const cell = document.querySelector(`[data-cell="${index}"]`);
                      if (cell) {
                        cell.appendChild(ripple);
                        setTimeout(() => ripple.remove(), 1000);
                      }
                    }
                  }}
                  data-cell={index}
                >
                  {/* Cell Background Animation */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                {isPlayer && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-blue-500/30 to-blue-400/20"
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                )}
                {hasGem && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-purple-500/30 to-purple-400/20"
                        animate={{
                          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        }}
                      />
                    )}
                    {isHovered && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-500/30 to-yellow-400/20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      />
                    )}
                  </div>

                  {/* Player */}
                  {isPlayer && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0, rotate: 0 }}
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: playerDirection * 90
                      }}
                      transition={{ 
                        scale: { duration: 0.5, repeat: Infinity, repeatDelay: 1 },
                        rotate: { duration: 0.3, ease: "easeInOut" }
                      }}
                    >
                      <CustomCharacter direction={playerDirection} isExecuting={isExecuting} />
                    </motion.div>
                  )}

                  {/* Gem */}
                  {hasGem && (
                    <motion.div 
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0, y: 20 }}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        y: [0, -5, 0],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        scale: { duration: 1, repeat: Infinity },
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        rotate: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                      }}
                      whileHover={{ scale: 1.3 }}
                    >
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 bg-purple-400/40 rounded-full blur-md"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [0.6, 1, 0.6]
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        <Gem className="w-6 h-6 text-purple-300 drop-shadow-lg relative z-10" />
              </div>
                    </motion.div>
                  )}

                  {/* Trail Effect */}
                  {isTrail && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Target className="w-4 h-4 text-green-400" />
                    </motion.div>
                  )}

                  {/* Hover Indicator */}
                  {isHovered && !isPlayer && !hasGem && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                    >
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    </motion.div>
                  )}
                </motion.div>
            );
          })}
          </motion.div>

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map(renderParticle)}
          </div>
        </div>


      </motion.div>
      
      {/* Enhanced Stats Panel */}
      <motion.div 
        className="mt-8 text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <motion.div 
          className="bg-gradient-to-r from-slate-800/90 to-purple-900/90 backdrop-blur-sm p-6 rounded-2xl border border-purple-500/30 shadow-lg"
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <div className="grid grid-cols-2 gap-6">
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-purple-200 text-sm font-medium mb-2">Position</div>
              <div className="text-blue-300 text-xl font-bold font-mono">
                ({playerPosition.x}, {playerPosition.y})
              </div>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-purple-200 text-sm font-medium mb-2">Direction</div>
              <motion.div 
                className="text-blue-300 text-3xl font-bold"
                animate={{ rotate: playerDirection * 90 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {getDirectionArrow(playerDirection)}
              </motion.div>
            </motion.div>
        </div>
        </motion.div>

        {/* Enhanced Progress Bar */}
        <motion.div 
          className="bg-slate-800/90 backdrop-blur-sm p-4 rounded-xl border border-purple-500/30 shadow-lg"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center justify-between text-sm mb-3">
            <span className="text-purple-200 font-medium">Collection Progress</span>
            <span className="text-blue-300 font-bold">
              {Math.round((collectedGems.length / gems.length) * 100)}%
            </span>
        </div>
          <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${(collectedGems.length / gems.length) * 100}%` }}
              transition={{ duration: 0.8, delay: 1.5, ease: "easeOut" }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ["-100%", "100%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            </motion.div>
      </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GameBoard;
