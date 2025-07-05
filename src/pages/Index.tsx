import { useState, useRef } from "react";
import GameBoard from "@/components/GameBoard";
import DragDropEditor, { DragDropEditorRef } from "@/components/DragDropEditor";
import KeyboardMappingConfig from "@/components/KeyboardMappingConfig";
import KeyboardHints from "@/components/KeyboardHints";
import { GameState, Position } from "@/types/game";
import { useKeyboardMapping } from "@/hooks/useKeyboardMapping";
import { Button } from "@/components/ui/button";
import { Settings, Keyboard } from "lucide-react";

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
    gems: generateRandomGems(6, 4), // Generate 4 random gems on a 6x6 grid
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
  const dragDropEditorRef = useRef<DragDropEditorRef>(null);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-purple-500/30 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CQ</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Code Quest</h1>
                <p className="text-purple-200 text-xs">Program your way to collect all the gems!</p>
              </div>
            </div>

            {/* Game Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-700/50 px-3 py-1.5 rounded-lg border border-purple-500/30">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">{gameState.gems.length - gameState.collectedGems.length} gems left</span>
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
                        Keyboard Shortcuts
                      </h3>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Move</span>
                        <span className="text-green-300 font-mono font-bold">M</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Turn Left</span>
                        <span className="text-green-300 font-mono font-bold">A</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Turn Right</span>
                        <span className="text-green-300 font-mono font-bold">D</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Collect</span>
                        <span className="text-green-300 font-mono font-bold">S</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Run Code</span>
                        <span className="text-green-300 font-mono font-bold">R</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">While Loop</span>
                        <span className="text-green-300 font-mono font-bold">W</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">If Statement</span>
                        <span className="text-green-300 font-mono font-bold">I</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Else Statement</span>
                        <span className="text-green-300 font-mono font-bold">L</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Reset Game</span>
                        <span className="text-green-300 font-mono font-bold">E</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-slate-700/50 rounded border border-green-500/30">
                        <span className="text-white text-xs">Stop Execution</span>
                        <span className="text-green-300 font-mono font-bold">Q</span>
                      </div>
                    </div>
                  </div>
                  {/* Arrow */}
                  <div className="absolute -top-2 right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800"></div>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </header>



      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <GameBoard gameState={gameState} setGameState={setGameState} />
          
          <div className="space-y-6">
            {/* Keyboard Configuration Panel */}
            {showKeyboardConfig && (
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
            )}
            
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
