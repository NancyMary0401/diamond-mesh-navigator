import React, { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, RotateCcw, Trash2, GripVertical, Trophy, Star, Sparkles } from "lucide-react";
import { GameState, Command, Position } from "@/types/game";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "motion/react";

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

interface DragDropEditorProps {
  pseudocode: string[];
  setPseudocode: React.Dispatch<React.SetStateAction<string[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

export interface DragDropEditorRef {
  executeCode: () => void;
  resetGame: () => void;
  addCommand: (commandType: string) => void;
}

interface CodeBlock {
  id: string;
  type: 'move' | 'turn' | 'collect' | 'while' | 'if' | 'else';
  direction?: string;
  condition?: string;
  indentLevel: number;
}

const DragDropEditor = forwardRef<DragDropEditorRef, DragDropEditorProps>(({
  pseudocode,
  setPseudocode,
  gameState,
  setGameState
}, ref) => {
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([
    { id: '1', type: 'while', condition: 'gems remain', indentLevel: 0 },
    { id: '2', type: 'if', condition: 'front is clear', indentLevel: 1 },
    { id: '3', type: 'move', direction: 'forward', indentLevel: 2 },
    { id: '4', type: 'else', indentLevel: 1 },
    { id: '5', type: 'turn', direction: 'right', indentLevel: 2 }
  ]);
  
  const [draggedItem, setDraggedItem] = useState<CodeBlock | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [currentLine, setCurrentLine] = useState(-1);
  const [draggedCommand, setDraggedCommand] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [confetti, setConfetti] = useState<Array<{id: number, x: number, y: number, color: string}>>([]);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const { toast } = useToast();

  const dragRef = useRef<HTMLDivElement>(null);

  // Expose functions through ref
  useImperativeHandle(ref, () => ({
    executeCode,
    resetGame,
    addCommand
  }));

  const availableCommands = [
    { type: 'move', label: 'move', directions: ['forward'] },
    { type: 'turn', label: 'turn', directions: ['right', 'left'] },
    { type: 'collect', label: 'collect', directions: [] },
    { type: 'while', label: 'while', conditions: ['gems remain', 'off target'] },
    { type: 'if', label: 'if', conditions: ['front is clear', 'gem found'] },
    { type: 'else', label: 'else', directions: [] }
  ];

  const parseCommand = (block: CodeBlock): Command | null => {
    switch (block.type) {
      case 'move':
        return { type: 'move', direction: block.direction as 'forward' };
      case 'turn':
        return { type: 'turn', direction: block.direction as 'left' | 'right' };
      case 'collect':
        return { type: 'collect' };
      case 'while':
        return { type: 'while', condition: block.condition };
      case 'if':
        return { type: 'if', condition: block.condition };
      default:
        return null;
    }
  };

  const executeCommand = (command: Command, currentState: GameState): GameState => {
    const newState = { ...currentState };
    
    switch (command.type) {
      case 'move':
        if (command.direction === 'forward') {
          const directions = [
            { x: 0, y: -1 }, // up (0)
            { x: 1, y: 0 },  // right (1)
            { x: 0, y: 1 },  // down (2)
            { x: -1, y: 0 }  // left (3)
          ];
          const dir = directions[newState.playerDirection];
          const newX = newState.playerPosition.x + dir.x;
          const newY = newState.playerPosition.y + dir.y;
          
          if (newX >= 0 && newX < newState.gridSize && newY >= 0 && newY < newState.gridSize) {
            newState.playerPosition = { x: newX, y: newY };
          }
        }
        break;
        
      case 'turn':
        if (command.direction === 'right') {
          newState.playerDirection = (newState.playerDirection + 1) % 4;
        } else if (command.direction === 'left') {
          newState.playerDirection = (newState.playerDirection + 3) % 4;
        }
        break;
        
      case 'collect':
        const gemIndex = newState.gems.findIndex(gem => 
          gem.x === newState.playerPosition.x && gem.y === newState.playerPosition.y
        );
        if (gemIndex !== -1 && !newState.collectedGems.some(collected => 
          collected.x === newState.playerPosition.x && collected.y === newState.playerPosition.y
        )) {
          newState.collectedGems = [...newState.collectedGems, newState.gems[gemIndex]];
        }
        break;
    }
    
    return newState;
  };

  const checkCondition = (condition: string, currentState: GameState): boolean => {
    if (condition?.includes('gems remain')) {
      const gemsLeft = currentState.gems.length - currentState.collectedGems.length;
      console.log(`Checking gems remain: ${gemsLeft} gems left`);
      return gemsLeft > 0;
    }
    if (condition?.includes('gem found')) {
      const gemAtPosition = currentState.gems.some(gem => 
        gem.x === currentState.playerPosition.x && 
        gem.y === currentState.playerPosition.y &&
        !currentState.collectedGems.some(collected => 
          collected.x === gem.x && collected.y === gem.y
        )
      );
      console.log(`Checking gem found at (${currentState.playerPosition.x}, ${currentState.playerPosition.y}): ${gemAtPosition}`);
      return gemAtPosition;
    }
    if (condition?.includes('front is clear')) {
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];
      const dir = directions[currentState.playerDirection];
      const frontX = currentState.playerPosition.x + dir.x;
      const frontY = currentState.playerPosition.y + dir.y;
      
      const frontIsClear = frontX >= 0 && frontX < currentState.gridSize && 
                          frontY >= 0 && frontY < currentState.gridSize;
      console.log(`Checking front is clear: ${frontIsClear}`);
      return frontIsClear;
    }
    return false;
  };

  const createConfetti = () => {
    const colors = ['#8B5CF6', '#6366F1', '#A855F7', '#3B82F6', '#1D4ED8', '#7C3AED', '#4F46E5', '#06B6D4'];
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setConfetti(newConfetti);
  };

  const triggerCelebration = () => {
    setShowCelebration(true);
    createConfetti();
    
    // Auto-hide celebration after 5 seconds
    setTimeout(() => {
      setShowCelebration(false);
      setConfetti([]);
    }, 5000);
  };

  const executeCode = async () => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => ({ ...prev, isExecuting: true }));
    
    let currentState = { ...gameState };
    let maxIterations = 100;
    let iterations = 0;
    
    console.log('Starting code execution');
    
    for (let blockIndex = 0; blockIndex < codeBlocks.length && iterations < maxIterations; blockIndex++) {
      setCurrentLine(blockIndex);
      
      const block = codeBlocks[blockIndex];
      console.log(`Executing block ${blockIndex}:`, block);
      
      const command = parseCommand(block);
      
      if (command) {
        if (command.type === 'while') {
          const whileCondition = command.condition || '';
          console.log(`While loop started with condition: ${whileCondition}`);
          
          while (checkCondition(whileCondition, currentState) && iterations < maxIterations) {
            iterations++;
            console.log(`While loop iteration ${iterations}`);
            
            for (let whileBlockIndex = blockIndex + 1; whileBlockIndex < codeBlocks.length; whileBlockIndex++) {
              const whileBlock = codeBlocks[whileBlockIndex];
              
              if (whileBlock.indentLevel <= block.indentLevel) {
                break;
              }
              
              setCurrentLine(whileBlockIndex);
              console.log(`Executing while loop block ${whileBlockIndex}:`, whileBlock);
              
              const whileCommand = parseCommand(whileBlock);
              
              if (whileCommand) {
                if (whileCommand.type === 'if') {
                  if (checkCondition(whileCommand.condition || '', currentState)) {
                    console.log('If condition true, executing next command');
                    const nextBlockIndex = whileBlockIndex + 1;
                    if (nextBlockIndex < codeBlocks.length && codeBlocks[nextBlockIndex].indentLevel > whileBlock.indentLevel) {
                      setCurrentLine(nextBlockIndex);
                      const ifCommand = parseCommand(codeBlocks[nextBlockIndex]);
                      if (ifCommand) {
                        console.log(`Executing if command:`, ifCommand);
                        currentState = executeCommand(ifCommand, currentState);
                        setGameState(currentState);
                        await new Promise(resolve => setTimeout(resolve, 800));
                      }
                      whileBlockIndex++;
                    }
                  } else {
                    // Skip to else block if it exists
                    let elseBlockIndex = whileBlockIndex + 1;
                    while (elseBlockIndex < codeBlocks.length && codeBlocks[elseBlockIndex].indentLevel > whileBlock.indentLevel) {
                      elseBlockIndex++;
                    }
                    if (elseBlockIndex < codeBlocks.length && codeBlocks[elseBlockIndex].type === 'else') {
                      const nextElseBlockIndex = elseBlockIndex + 1;
                      if (nextElseBlockIndex < codeBlocks.length && codeBlocks[nextElseBlockIndex].indentLevel > codeBlocks[elseBlockIndex].indentLevel) {
                        setCurrentLine(nextElseBlockIndex);
                        const elseCommand = parseCommand(codeBlocks[nextElseBlockIndex]);
                        if (elseCommand) {
                          console.log(`Executing else command:`, elseCommand);
                          currentState = executeCommand(elseCommand, currentState);
                          setGameState(currentState);
                          await new Promise(resolve => setTimeout(resolve, 800));
                        }
                      }
                      whileBlockIndex = elseBlockIndex + 1;
                    }
                  }
                } else {
                  console.log(`Executing while command:`, whileCommand);
                  currentState = executeCommand(whileCommand, currentState);
                  setGameState(currentState);
                  await new Promise(resolve => setTimeout(resolve, 800));
                }
              }
            }
            
            if (!checkCondition(whileCondition, currentState)) {
              console.log('While condition became false, exiting loop');
              break;
            }
          }
          
          let nextBlockIndex = blockIndex + 1;
          while (nextBlockIndex < codeBlocks.length && codeBlocks[nextBlockIndex].indentLevel > block.indentLevel) {
            nextBlockIndex++;
          }
          blockIndex = nextBlockIndex - 1;
          
        } else if (command.type === 'if') {
          if (checkCondition(command.condition || '', currentState)) {
            console.log('If condition true, executing next command');
            const nextBlockIndex = blockIndex + 1;
            if (nextBlockIndex < codeBlocks.length && codeBlocks[nextBlockIndex].indentLevel > block.indentLevel) {
              setCurrentLine(nextBlockIndex);
              const ifCommand = parseCommand(codeBlocks[nextBlockIndex]);
              if (ifCommand) {
                console.log(`Executing if command:`, ifCommand);
                currentState = executeCommand(ifCommand, currentState);
                setGameState(currentState);
                await new Promise(resolve => setTimeout(resolve, 800));
              }
              blockIndex++;
            }
          }
        } else {
          console.log(`Executing command:`, command);
          currentState = executeCommand(command, currentState);
          setGameState(currentState);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      iterations++;
    }

    setGameState(prev => ({ ...prev, isExecuting: false }));
    setCurrentLine(-1);
    
    console.log('Code execution finished');
    
    const finalGemsLeft = currentState.gems.length - currentState.collectedGems.length;
    if (finalGemsLeft === 0) {
      triggerCelebration();
    }
  };

  const handleMotionDrop = (event: any, info: any, dropIndex: number) => {
    if (!draggedItem) return;

    // Get the programming area element
    const programmingArea = document.querySelector('[data-programming-area]') as HTMLElement;
    if (programmingArea) {
      const rect = programmingArea.getBoundingClientRect();
      const dropX = info.point.x;
      const dropY = info.point.y;
      
      // Add a small buffer zone around the programming area for better detection
      const buffer = 10;
      const isOutside = dropX < (rect.left - buffer) || 
                       dropX > (rect.right + buffer) || 
                       dropY < (rect.top - buffer) || 
                       dropY > (rect.bottom + buffer);
      
      if (isOutside) {
        // Delete the block if dropped outside
        const newBlocks = codeBlocks.filter(block => block.id !== draggedItem.id);
        setCodeBlocks(newBlocks);
        setDraggedItem(null);
        setDragOverIndex(null);
        setIsDraggingBlock(false);
        updatePseudocode(newBlocks);
        
        // Show feedback
        toast({
          title: "Command Removed",
          description: `"${draggedItem.type}" command has been deleted`,
          className: "bg-red-600 border-red-500/50 text-white",
        });
        return;
      }
    }

    // Normal reordering logic
    const dragIndex = codeBlocks.findIndex(block => block.id === draggedItem.id);
    const newBlocks = [...codeBlocks];
    
    newBlocks.splice(dragIndex, 1);
    
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newBlocks.splice(adjustedDropIndex, 0, draggedItem);
    
    setCodeBlocks(newBlocks);
    setDraggedItem(null);
    setDragOverIndex(null);
    setIsDraggingBlock(false);
    
    updatePseudocode(newBlocks);
  };

  const updatePseudocode = (blocks: CodeBlock[]) => {
    const newPseudocode = blocks.map(block => {
      const indent = '  '.repeat(block.indentLevel);
      switch (block.type) {
        case 'move':
          return `${indent}move ${block.direction}`;
        case 'turn':
          return `${indent}turn ${block.direction}`;
        case 'collect':
          return `${indent}collect gem`;
        case 'while':
          return `${indent}while ${block.condition}`;
        case 'if':
          return `${indent}if ${block.condition}`;
        case 'else':
          return `${indent}else`;
        default:
          return `${indent}${block.type}`;
      }
    });
    setPseudocode(newPseudocode);
  };

  const addCommand = (commandType: string) => {
    let type: CodeBlock['type'];
    let direction: string | undefined;
    let condition: string | undefined;

    // Handle different command types
    if (commandType === 'move') {
      type = 'move';
      direction = 'forward';
    } else if (commandType === 'turn-left') {
      type = 'turn';
      direction = 'left';
    } else if (commandType === 'turn-right') {
      type = 'turn';
      direction = 'right';
    } else if (commandType === 'collect') {
      type = 'collect';
    } else if (commandType === 'while') {
      type = 'while';
      condition = 'gems remain';
    } else if (commandType === 'if') {
      type = 'if';
      condition = 'front is clear';
    } else if (commandType === 'else') {
      type = 'else';
    } else {
      type = commandType as any;
      direction = commandType === 'turn' ? 'right' : undefined;
      condition = commandType === 'while' ? 'gems remain' : commandType === 'if' ? 'front is clear' : undefined;
    }

    const newBlock: CodeBlock = {
      id: Date.now().toString(),
      type,
      indentLevel: 0,
      direction,
      condition
    };
    
    const newBlocks = [...codeBlocks, newBlock];
    setCodeBlocks(newBlocks);
    updatePseudocode(newBlocks);
  };

  const removeBlock = (id: string) => {
    const newBlocks = codeBlocks.filter(block => block.id !== id);
    setCodeBlocks(newBlocks);
    updatePseudocode(newBlocks);
  };

  const updateBlockDirection = (id: string, direction: string) => {
    const newBlocks = codeBlocks.map(block => 
      block.id === id ? { ...block, direction } : block
    );
    setCodeBlocks(newBlocks);
    updatePseudocode(newBlocks);
  };

  const updateBlockCondition = (id: string, condition: string) => {
    const newBlocks = codeBlocks.map(block => 
      block.id === id ? { ...block, condition } : block
    );
    setCodeBlocks(newBlocks);
    updatePseudocode(newBlocks);
  };

  const adjustIndentation = (id: string, change: number) => {
    const newBlocks = codeBlocks.map(block => 
      block.id === id ? { ...block, indentLevel: Math.max(0, block.indentLevel + change) } : block
    );
    setCodeBlocks(newBlocks);
    updatePseudocode(newBlocks);
  };

  const resetGame = () => {
    setGameState(prev => ({
      ...prev,
      playerPosition: { x: 0, y: 0 },
      playerDirection: 0,
      gems: generateRandomGems(prev.gridSize, 4), // Generate new random gems
      collectedGems: [],
      isExecuting: false
    }));
    setCurrentLine(-1);
  };

  const clearAllCommands = () => {
    setCodeBlocks([]);
    updatePseudocode([]);
  };

  return (
    <div 
      className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-purple-500/30 relative overflow-hidden"
      onDragOver={e => {
        if (isDraggingBlock) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onDrop={e => {
        if (isDraggingBlock && draggedItem) {
          e.preventDefault();
          e.stopPropagation();
          
          // Get drop coordinates
          const dropX = e.clientX;
          const dropY = e.clientY;
          
          // Get programming area bounds
          const programmingArea = document.querySelector('[data-programming-area]') as HTMLElement;
          if (programmingArea) {
            const rect = programmingArea.getBoundingClientRect();
            const buffer = 15; // Larger buffer for global drop
            
            const isOutside = dropX < (rect.left - buffer) || 
                             dropX > (rect.right + buffer) || 
                             dropY < (rect.top - buffer) || 
                             dropY > (rect.bottom + buffer);
            
            if (isOutside) {
              // Delete the block if dropped outside
              const newBlocks = codeBlocks.filter(block => block.id !== draggedItem.id);
              setCodeBlocks(newBlocks);
              setDraggedItem(null);
              setDragOverIndex(null);
              setIsDraggingBlock(false);
              updatePseudocode(newBlocks);
              
              // Show feedback
              toast({
                title: "Command Removed",
                description: `"${draggedItem.type}" command has been deleted`,
                className: "bg-red-600 border-red-500/50 text-white",
              });
            }
          }
        }
      }}
    >
      {/* Confetti Animation */}
      <AnimatePresence>
        {confetti.map((piece) => (
          <motion.div
            key={piece.id}
            initial={{ x: piece.x, y: piece.y, rotate: 0, scale: 1 }}
            animate={{ 
              y: window.innerHeight + 100, 
              x: piece.x + (Math.random() - 0.5) * 200,
              rotate: 360,
              scale: 0
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              ease: "easeOut"
            }}
            className="absolute pointer-events-none z-50"
            style={{ left: piece.x, top: piece.y }}
          >
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: piece.color }}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Celebration Modal */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-gradient-to-br from-slate-800 via-purple-900 to-blue-900 p-8 rounded-3xl text-center shadow-2xl border-4 border-purple-500/50 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 1
                }}
                className="mb-4"
              >
                <Trophy className="w-16 h-16 text-purple-400 mx-auto drop-shadow-lg" />
              </motion.div>
              
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent"
              >
                🎉 CONGRATULATIONS! 🎉
              </motion.h2>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-purple-200 mb-6"
              >
                You collected all the gems! You're a programming master!
              </motion.p>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center gap-4"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Star className="w-8 h-8 text-purple-400" />
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: [0, -360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Sparkles className="w-8 h-8 text-blue-400" />
                </motion.div>
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <Star className="w-8 h-8 text-purple-400" />
                </motion.div>
              </motion.div>
              
              <motion.button
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                onClick={() => setShowCelebration(false)}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-full hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Continue Playing!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h2 className="text-xl font-bold text-white">Visual Programming</h2>
          <span className="text-sm text-purple-300 bg-purple-500/20 px-3 py-1.5 rounded-full border border-purple-500/30">
            {codeBlocks.length} commands
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={executeCode}
            disabled={gameState.isExecuting}
            className="bg-green-600 hover:bg-green-700 h-9 px-4"
            size="sm"
          >
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
            className="h-9 px-4"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={clearAllCommands}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/20 h-9 px-4"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div
        data-programming-area
        className={`bg-slate-900 p-4 rounded-lg border border-slate-600 mb-4 min-h-[300px] transition-all ${draggedCommand ? 'ring-2 ring-blue-400' : ''} ${isDraggingBlock ? 'ring-2 ring-red-400' : ''}`}
        onDragOver={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={e => {
          e.preventDefault();
          e.stopPropagation();
          if (draggedCommand) {
            addCommand(draggedCommand);
            setDraggedCommand(null);
          }
        }}
        onDragEnter={e => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={e => {
          e.preventDefault();
          e.stopPropagation();
          // Only clear if we're actually leaving the drop zone
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDraggedCommand(null);
          }
        }}
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {codeBlocks.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-600 rounded-lg">
              <div className="text-lg mb-2">No commands yet</div>
              <div className="text-sm">Drag commands from below to start programming!</div>
            </div>
          ) : (
            codeBlocks.map((block, index) => (
              <motion.div
                key={block.id}
                drag
                onDragStart={() => {
                  setDraggedItem(block);
                  setIsDraggingBlock(true);
                }}
                onDragEnd={(event, info) => handleMotionDrop(event, info, index)}
                className={`
                  flex items-center gap-4 p-4 rounded-lg border transition-all cursor-move group
                  ${dragOverIndex === index ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600 bg-slate-700/50'}
                  ${currentLine === index ? 'ring-2 ring-yellow-400' : ''}
                  hover:bg-slate-700/70 hover:border-slate-500
                `}
                style={{ marginLeft: `${block.indentLevel * 24}px` }}
              >
                <GripVertical className="w-5 h-5 text-gray-400 group-hover:text-gray-300 transition-colors flex-shrink-0" />
                
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <span className={`
                    font-mono text-sm px-3 py-2 rounded-md font-medium flex-shrink-0 min-w-[60px] text-center
                    ${block.type === 'while' || block.type === 'if' || block.type === 'else' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                    ${block.type === 'move' || block.type === 'turn' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                    ${block.type === 'collect' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                  `}>
                    {block.type}
                  </span>

                  {(block.type === 'move' || block.type === 'turn') && (
                    <Select 
                      value={block.direction} 
                      onValueChange={(value) => updateBlockDirection(block.id, value)}
                    >
                      <SelectTrigger className="w-32 h-9 bg-slate-800 border-slate-600 text-white shadow-sm flex-shrink-0" >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {availableCommands.find(cmd => cmd.type === block.type)?.directions.map(dir => (
                          <SelectItem key={dir} value={dir} className="text-white hover:bg-slate-700">
                            {dir}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {(block.type === 'while' || block.type === 'if') && (
                    <Select 
                      value={block.condition} 
                      onValueChange={(value) => updateBlockCondition(block.id, value)}
                    >
                      <SelectTrigger className="w-40 h-9 bg-slate-800 border-slate-600 text-white shadow-sm flex-shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-600">
                        {availableCommands.find(cmd => cmd.type === block.type)?.conditions?.map(condition => (
                          <SelectItem key={condition} value={condition} className="text-white hover:bg-slate-700">
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                  <Button
                    onClick={() => adjustIndentation(block.id, -1)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-500/20 rounded-md"
                    disabled={block.indentLevel === 0}
                    title="Decrease indentation"
                  >
                    ←
                  </Button>
                  <Button
                    onClick={() => adjustIndentation(block.id, 1)}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-300 hover:bg-gray-500/20 rounded-md"
                    title="Increase indentation"
                  >
                    →
                  </Button>
                  <Button
                    onClick={() => {
                      removeBlock(block.id);
                      toast({
                        title: "Command Removed",
                        description: `"${block.type}" command has been deleted`,
                        className: "bg-red-600 border-red-500/50 text-white",
                      });
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md"
                    title="Delete command"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
          ))
          )}
        </div>
        {draggedCommand && (
          <div className="mt-4 p-4 text-center text-blue-400 bg-blue-400/10 rounded-lg border-2 border-dashed border-blue-400/50 animate-pulse">
            <div className="text-lg font-semibold mb-2">Drop here to add</div>
            <div className="text-xl font-bold mb-2">{draggedCommand}</div>
            <div className="text-sm text-blue-300">You can add unlimited commands!</div>
          </div>
        )}
        {isDraggingBlock && (
          <div className="mt-4 p-4 text-center text-red-400 bg-red-400/10 rounded-lg border-2 border-dashed border-red-400/50 animate-pulse">
            <div className="text-lg font-semibold mb-2">🗑️ Drag outside to delete</div>
            <div className="text-xl font-bold mb-2">{draggedItem?.type}</div>
            <div className="text-sm text-red-300">Drop outside the programming area to remove this command</div>
            <div className="text-sm text-red-300 mt-1">💡 Move slowly for better detection</div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="text-sm font-medium text-purple-200">Available Commands:</h3>
          <span className="text-xs text-slate-400">Drag unlimited commands to build your program!</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {availableCommands.map((command) => (
            <motion.div
              key={command.type}
              draggable
              onDragStart={() => {
                setDraggedCommand(command.type);
              }}
              onDragEnd={() => {
                setDraggedCommand(null);
              }}
              className={`
                flex items-center justify-center px-3 py-3 rounded-lg border cursor-grab select-none transition-all duration-200
                ${command.type === 'while' || command.type === 'if' || command.type === 'else' ? 'text-green-400 border-green-400/30 hover:bg-green-400/10' : ''}
                ${command.type === 'move' || command.type === 'turn' ? 'text-blue-400 border-blue-400/30 hover:bg-blue-400/10' : ''}
                ${command.type === 'collect' ? 'text-purple-400 border-purple-400/30 hover:bg-purple-400/10' : ''}
                bg-slate-700 hover:bg-slate-600 active:bg-slate-800 hover:scale-105
              `}
              style={{ userSelect: 'none' }}
            >
              <span className="font-medium text-sm">{command.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default DragDropEditor;
