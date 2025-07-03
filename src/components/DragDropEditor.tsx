import React, { useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square, RotateCcw, Trash2, GripVertical } from "lucide-react";
import { GameState, Command } from "@/types/game";
import { useToast } from "@/hooks/use-toast";

interface DragDropEditorProps {
  pseudocode: string[];
  setPseudocode: React.Dispatch<React.SetStateAction<string[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

interface CodeBlock {
  id: string;
  type: 'move' | 'turn' | 'collect' | 'while' | 'if' | 'else';
  direction?: string;
  condition?: string;
  indentLevel: number;
}

const DragDropEditor: React.FC<DragDropEditorProps> = ({
  pseudocode,
  setPseudocode,
  gameState,
  setGameState
}) => {
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
  const { toast } = useToast();

  const dragRef = useRef<HTMLDivElement>(null);

  const availableCommands = [
    { type: 'move', label: 'move', directions: ['forward', 'backward'] },
    { type: 'turn', label: 'turn', directions: ['right', 'left'] },
    { type: 'collect', label: 'collect', directions: [] },
    { type: 'while', label: 'while', conditions: ['gems remain', 'off target'] },
    { type: 'if', label: 'if', conditions: ['front is clear', 'gem found'] },
    { type: 'else', label: 'else', directions: [] }
  ];

  const parseCommand = (block: CodeBlock): Command | null => {
    switch (block.type) {
      case 'move':
        return { type: 'move', direction: block.direction as 'forward' | 'left' | 'right' };
      case 'turn':
        return { type: 'turn', direction: block.direction as 'forward' | 'left' | 'right' };
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
        } else if (command.direction === 'backward') {
          const directions = [
            { x: 0, y: 1 },  // up -> down
            { x: -1, y: 0 }, // right -> left
            { x: 0, y: -1 }, // down -> up
            { x: 1, y: 0 }   // left -> right
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
      toast({
        title: "Congratulations!",
        description: "You collected all the gems!",
      });
    }
  };

  const handleDragStart = (e: DragEvent, block: CodeBlock) => {
    setDraggedItem(block);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const dragIndex = codeBlocks.findIndex(block => block.id === draggedItem.id);
    const newBlocks = [...codeBlocks];
    
    newBlocks.splice(dragIndex, 1);
    
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newBlocks.splice(adjustedDropIndex, 0, draggedItem);
    
    setCodeBlocks(newBlocks);
    setDraggedItem(null);
    setDragOverIndex(null);
    
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
    const newBlock: CodeBlock = {
      id: Date.now().toString(),
      type: commandType as any,
      indentLevel: 0,
      direction: commandType === 'move' ? 'forward' : commandType === 'turn' ? 'right' : undefined,
      condition: commandType === 'while' ? 'gems remain' : commandType === 'if' ? 'front is clear' : undefined
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
      collectedGems: [],
      isExecuting: false
    }));
    setCurrentLine(-1);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Visual Programming</h2>
        <div className="flex gap-2">
          <Button
            onClick={executeCode}
            disabled={gameState.isExecuting}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Play className="w-4 h-4 mr-1" />
            Run
          </Button>
          <Button
            onClick={resetGame}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 mb-4 min-h-[300px]">
        <div className="space-y-2">
          {codeBlocks.map((block, index) => (
            <div
              key={block.id}
              draggable
              onDragStart={(e) => handleDragStart(e, block)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                flex items-center gap-2 p-3 rounded-lg border transition-all cursor-move
                ${dragOverIndex === index ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600 bg-slate-700/50'}
                ${currentLine === index ? 'ring-2 ring-yellow-400' : ''}
                hover:bg-slate-700/70
              `}
              style={{ marginLeft: `${block.indentLevel * 24}px` }}
            >
              <GripVertical className="w-4 h-4 text-gray-400" />
              
              <div className="flex items-center gap-2 flex-1">
                <span className={`
                  font-mono text-sm px-2 py-1 rounded
                  ${block.type === 'while' || block.type === 'if' || block.type === 'else' ? 'bg-green-500/20 text-green-400' : ''}
                  ${block.type === 'move' || block.type === 'turn' ? 'bg-blue-500/20 text-blue-400' : ''}
                  ${block.type === 'collect' ? 'bg-purple-500/20 text-purple-400' : ''}
                `}>
                  {block.type}
                </span>

                {(block.type === 'move' || block.type === 'turn') && (
                  <Select 
                    value={block.direction} 
                    onValueChange={(value) => updateBlockDirection(block.id, value)}
                  >
                    <SelectTrigger className="w-24 h-8 bg-slate-800 border-slate-600">
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
                    <SelectTrigger className="w-32 h-8 bg-slate-800 border-slate-600">
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

              <div className="flex items-center gap-1">
                <Button
                  onClick={() => adjustIndentation(block.id, -1)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                  disabled={block.indentLevel === 0}
                >
                  ←
                </Button>
                <Button
                  onClick={() => adjustIndentation(block.id, 1)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-300"
                >
                  →
                </Button>
                <Button
                  onClick={() => removeBlock(block.id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-purple-200">Available Commands:</h3>
        <div className="grid grid-cols-3 gap-2">
          {availableCommands.map((command) => (
            <Button
              key={command.type}
              onClick={() => addCommand(command.type)}
              variant="outline"
              size="sm"
              className={`
                ${command.type === 'while' || command.type === 'if' || command.type === 'else' ? 'text-green-400 border-green-400/30' : ''}
                ${command.type === 'move' || command.type === 'turn' ? 'text-blue-400 border-blue-400/30' : ''}
                ${command.type === 'collect' ? 'text-purple-400 border-purple-400/30' : ''}
              `}
            >
              {command.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DragDropEditor;
