import { useState, useRef, useEffect } from "react";
import GameBoard from "@/components/GameBoard";
import DragDropEditor, { DragDropEditorRef } from "@/components/DragDropEditor";
import KeyboardMappingConfig from "@/components/KeyboardMappingConfig";
import KeyboardHints from "@/components/KeyboardHints";
import { GameState, Position } from "@/types/game";
import { useKeyboardMapping } from "@/hooks/useKeyboardMapping";
import { Button } from "@/components/ui/button";
import { Settings, Keyboard, Trophy, Star, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "motion/react";

// Function to generate random gem positions
const generateRandomGems = (gridSize: number, numGems: number): Position[] => {
  const gems: Position[] = [];
  const positions = new Set<string>();
  
  while (gems.length < numGems) {
    const x = Math.floor(Math.random() * gridSize);
    const y = Math.floor(Math.random() * gridSize);
    const positionKey = `${x},${y}`;
    
    // Don't place gems at the starting position (0,0) or duplicate positions
    if (x === 0 && y === 0) continue;
    if (positions.has(positionKey)) continue;
    
    positions.add(positionKey);
    gems.push({ x, y });
  }
  
  return gems;
};

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => ({
    playerPosition: { x: 0, y: 0 },
    playerDirection: 0, // 0: up, 1: right, 2: down, 3: left
    gems: generateRandomGems(6, 6), // Generate 6 random gems on a 6x6 grid
    collectedGems: [],
    isExecuting: false,
    gridSize: 6
  }));

  const [pseudocode, setPseudocode] = useState([
    "while off target",
    "  if front is clear",
    "    move forward",
    "  else",
    "    turn right"
  ]);

  const [showKeyboardConfig, setShowKeyboardConfig] = useState(false);
  const [showVictoryPopup, setShowVictoryPopup] = useState(false);
  const [gemCount, setGemCount] = useState(6);
  const dragDropEditorRef = useRef<DragDropEditorRef>(null);

  // Check for victory condition
  useEffect(() => {
    if (gameState.collectedGems.length === gameState.gems.length && gameState.gems.length > 0) {
      setShowVictoryPopup(true);
    }
  }, [gameState.collectedGems.length, gameState.gems.length]);

  // Function to reset game with new gem count
  const resetGameWithNewGems = (newGemCount: number) => {
    setGemCount(newGemCount);
    setGameState(prev => ({
      ...prev,
      playerPosition: { x: 0, y: 0 },
      playerDirection: 0,
      gems: generateRandomGems(prev.gridSize, newGemCount),
      collectedGems: [],
      isExecuting: false
    }));
    setShowVictoryPopup(false);
  };

  // Keyboard mapping hook
  const {
    config,
    isMappingMode,
    pendingAction,
    lastPressedKey,
    updateMapping,
    removeMapping,
    resetToDefaults,
    toggleEnabled,
    toggleHints,
    startMapping,
    cancelMapping
  } = useKeyboardMapping({
    gameState,
    setGameState,
    onExecuteCode: () => {
      dragDropEditorRef.current?.executeCode();
    },
    onStopExecution: () => {
      setGameState(prev => ({ ...prev, isExecuting: false }));
    },
    onResetGame: () => {
      dragDropEditorRef.current?.resetGame();
    },
    onAddCommand: (commandType: string) => {
      dragDropEditorRef.current?.addCommand(commandType);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-purple-500/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CD</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CoDrag</h1>
                <p className="text-purple-200 text-xs">Program your way to collect all the gems!</p>
              </div>
            </div>

            {/* Game Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">{gameState.gems.length - gameState.collectedGems.length} gems left</span>
              </div>
              
              {/* Gem Count Selector */}
              <div className="flex items-center gap-2">
                <span className="text-purple-200 text-sm">Gems:</span>
                <Select value={gemCount.toString()} onValueChange={(value) => resetGameWithNewGems(parseInt(value))}>
                  <SelectTrigger className="w-20 h-8 bg-slate-700/50 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-purple-500/30">
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="6">6</SelectItem>
                    <SelectItem value="8">8</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="12">12</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Keyboard Controls */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowKeyboardConfig(!showKeyboardConfig)}
                variant="outline"
                size="sm"
                className="border-blue-500/50 text-black hover:bg-blue-500/20 hover:text-black"
              >
                <Settings className="w-4 h-4 mr-2" />
                Keyboard Controls
              </Button>
              {config.isEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-green-500/50 text-black hover:bg-green-500/20 hover:text-black relative group"
                >
                <Keyboard className="w-4 h-4 mr-2" />
                Keyboard Hints
                
                {/* Hover Overlay */}
                <div className="absolute top-full right-0 mt-2 bg-slate-800/95 backdrop-blur-sm border border-green-500/30 rounded-lg shadow-2xl z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto min-w-[600px]">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-green-200 text-sm font-medium flex items-center gap-2">
                        <Keyboard className="w-4 h-4" />
                        Current Keyboard Shortcuts
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {Object.entries(config.mappings).map(([key, action]) => {
                        const actionLabels: Record<string, string> = {
                          moveForward: 'Move',
                          turnLeft: 'Turn Left',
                          turnRight: 'Turn Right',
                          collectGem: 'Collect',
                          whileLoop: 'While Loop',
                          ifStatement: 'If Statement',
                          elseStatement: 'Else Statement',
                          resetGame: 'Reset Game',
                          executeCode: 'Run Code',
                          stopExecution: 'Stop Execution',
                          toggleMapping: 'Toggle Mapping'
                        };
                        
                        return (
                          <div key={key} className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                            <span className="text-white text-xs">{actionLabels[action]}</span>
                            <span className="text-green-300 font-mono font-bold">{key.toUpperCase()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute -top-2 right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                </div>
              </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <GameBoard gameState={gameState} setGameState={setGameState} />
          
          <div className="space-y-6">
            <DragDropEditor 
              ref={dragDropEditorRef}
              pseudocode={pseudocode}
              setPseudocode={setPseudocode}
              gameState={gameState}
              setGameState={setGameState}
            />
          </div>
        </div>
      </div>

      {/* Keyboard Controls at Bottom */}
      {showKeyboardConfig && (
        <div className="bg-slate-800/50 border-t border-purple-500/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto p-4">
            <KeyboardMappingConfig
              config={config}
              isMappingMode={isMappingMode}
              pendingAction={pendingAction}
              onUpdateMapping={updateMapping}
              onRemoveMapping={removeMapping}
              onResetToDefaults={resetToDefaults}
              onToggleEnabled={toggleEnabled}
              onToggleHints={toggleHints}
              onStartMapping={startMapping}
              onCancelMapping={cancelMapping}
            />
          </div>
        </div>
      )}

      {/* Enhanced Victory Popup */}
      <Dialog open={showVictoryPopup} onOpenChange={setShowVictoryPopup}>
        <DialogContent className="bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-blue-900/95 border-4 border-purple-500/50 text-white backdrop-blur-sm p-0 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating Code Symbols */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-blue-400/20 text-2xl font-mono"
                initial={{
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                  rotate: 0,
                  scale: 0
                }}
                animate={{
                  x: Math.random() * 400,
                  y: Math.random() * 300,
                  rotate: 360,
                  scale: [0, 1, 0]
                }}
                transition={{
                  duration: 6 + Math.random() * 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 2
                }}
              >
                {['{', '}', '[', ']', '<', '>', '/', ';'][i]}
              </motion.div>
            ))}
            
            {/* Bursting Particles */}
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={`burst-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full"
                initial={{
                  x: 200,
                  y: 150,
                  scale: 0,
                  opacity: 1
                }}
                animate={{
                  x: 200 + (Math.random() - 0.5) * 300,
                  y: 150 + (Math.random() - 0.5) * 200,
                  scale: [0, 1, 0],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 1.5 + Math.random() * 1,
                  ease: "easeOut",
                  delay: Math.random() * 0.3
                }}
                style={{
                  backgroundColor: ['#8B5CF6', '#6366F1', '#A855F7', '#3B82F6', '#1D4ED8', '#7C3AED', '#4F46E5', '#06B6D4', '#10B981', '#F59E0B'][Math.floor(Math.random() * 10)]
                }}
              />
            ))}
          </div>

          <div className="relative z-10 p-8">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-3 text-center mb-6">
                <motion.div
                  animate={{ 
                    rotate: [0, -5, 5, -5, 0],
                    scale: [1, 1.1, 1],
                    y: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-yellow-400/30 rounded-full blur-lg"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-xl relative z-10" />
                  </div>
                </motion.div>
                
                <motion.span 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 bg-clip-text text-transparent"
                >
                  🎉 VICTORY! 🎉
                </motion.span>
                
                <motion.div
                  animate={{ 
                    rotate: [0, 5, -5, 5, 0],
                    scale: [1, 1.1, 1],
                    y: [0, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <div className="relative">
                    <motion.div
                      className="absolute inset-0 bg-yellow-400/30 rounded-full blur-lg"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                    <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-xl relative z-10" />
                  </div>
                </motion.div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="text-center space-y-6">
              {/* Animated Stars */}
              <motion.div 
                className="flex justify-center items-center gap-3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ 
                      rotate: [0, 360],
                      scale: [1, 1.2, 1],
                      y: [0, -10, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.1
                    }}
                  >
                    <Star className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
                  </motion.div>
                ))}
              </motion.div>
              
              {/* Programming-themed Success Message */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="space-y-3"
              >
                <div className="text-2xl font-bold text-green-400">
                  Code Execution: SUCCESS! ✅
                </div>
                <p className="text-purple-200 text-lg">
                  Congratulations! You've collected all {gameState.gems.length} gems!
                </p>
                <p className="text-slate-300 text-sm">
                  You've successfully programmed your way to victory. Ready for another challenge?
                </p>
              </motion.div>
              
              {/* Animated Stats */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="flex justify-center"
              >
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    className="bg-gradient-to-r from-purple-600/50 to-blue-600/50 p-4 rounded-xl border border-purple-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-sm text-purple-200">Gems Collected</div>
                    <div className="text-2xl font-bold text-yellow-300">{gameState.gems.length}</div>
                  </motion.div>
                  <motion.div
                    className="bg-gradient-to-r from-green-600/50 to-emerald-600/50 p-4 rounded-xl border border-green-400/30"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="text-sm text-green-200">Success Rate</div>
                    <div className="text-2xl font-bold text-green-300">100%</div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Enhanced Buttons */}
              <motion.div 
                className="flex flex-col sm:flex-row gap-3 justify-center pt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.6 }}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => resetGameWithNewGems(gemCount)}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white border-2 border-purple-400/50 shadow-lg hover:shadow-xl"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Play Again
                  </Button>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    onClick={() => setShowVictoryPopup(false)}
                    variant="outline"
                    className="border-purple-500/50 text-purple-200 hover:bg-purple-500/20 border-2 shadow-lg hover:shadow-xl"
                  >
                    Continue
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Keyboard Hints - Hidden since we now have hover tooltip */}
      {/* <KeyboardHints 
        mappings={config.mappings}
        isVisible={config.showHints && config.isEnabled}
        lastPressedKey={lastPressedKey}
      /> */}
    </div>
  );
};

export default Index;
