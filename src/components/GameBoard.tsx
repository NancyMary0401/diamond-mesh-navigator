import React, { useEffect, useState } from "react";
import { GameState, Position } from "@/types/game";
import { Gem, Sparkles, Star, Zap, Target, Code, Cpu, Binary, Play, Pause, RotateCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GameBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

// Simple Character Component
const SimpleCharacter: React.FC<{ direction: number; isExecuting: boolean }> = ({ direction, isExecuting }) => {
  return (
    <div className="w-full h-full flex items-center justify-center text-2xl text-white font-bold">
      👤
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
              <div 
          className="relative bg-gradient-to-br from-slate-800/80 via-purple-900/40 to-slate-800/80 p-8 rounded-3xl shadow-2xl border border-purple-500/30 backdrop-blur-sm mt-20"
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
          <div 
            className="grid gap-1 bg-gradient-to-br from-slate-900/90 via-slate-800/90 to-slate-900/90 p-6 rounded-2xl border-2 border-blue-400/30 shadow-inner backdrop-blur-sm"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
              width: '432px',
              height: '432px'
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isPlayer = playerPosition.x === x && playerPosition.y === y;
            const hasGem = isGemAt(x, y);
              const isTrail = showTrail && lastPosition.x === x && lastPosition.y === y;


            return (
                <div
                key={index}
                className={`
                    relative border border-blue-300/10 bg-gradient-to-br from-slate-800/80 to-slate-700/60 rounded-lg
                    ${isPlayer ? 'bg-gradient-to-br from-blue-500/40 to-indigo-600/30 border-blue-400/60 shadow-lg shadow-blue-500/25' : ''}
                    ${hasGem ? 'bg-gradient-to-br from-purple-500/30 to-purple-600/20 border-purple-400/40' : ''}
                    ${isTrail ? 'bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-400/40' : ''}

                  transition-all duration-300
                `}
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
                      <SimpleCharacter direction={playerDirection} isExecuting={isExecuting} />
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


                </div>
            );
          })}
          </div>

          {/* Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {particles.map(renderParticle)}
          </div>
        </div>


      </div>
      
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
