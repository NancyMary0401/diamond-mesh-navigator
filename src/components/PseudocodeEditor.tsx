import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw } from "lucide-react";
import { GameState, Command, Position } from "@/types/game";
import { useToast } from "@/hooks/use-toast";

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

interface PseudocodeEditorProps {
  pseudocode: string[];
  setPseudocode: React.Dispatch<React.SetStateAction<string[]>>;
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const PseudocodeEditor: React.FC<PseudocodeEditorProps> = ({
  pseudocode,
  setPseudocode,
  gameState,
  setGameState
}) => {
  const [currentLine, setCurrentLine] = useState(-1);
  const { toast } = useToast();

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

  const parseCommand = (line: string): Command | null => {
    const trimmed = line.trim().toLowerCase();
    
    if (trimmed.includes('move forward')) {
      return { type: 'move', direction: 'forward' };
    }
    if (trimmed.includes('turn right')) {
      return { type: 'turn', direction: 'right' };
    }
    if (trimmed.includes('turn left')) {
      return { type: 'turn', direction: 'left' };
    }
    if (trimmed.includes('collect')) {
      return { type: 'collect' };
    }
    if (trimmed.includes('while')) {
      return { type: 'while', condition: trimmed };
    }
    if (trimmed.includes('if')) {
      return { type: 'if', condition: trimmed };
    }
    
    return null;
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
    if (condition.includes('gems remain')) {
      const gemsLeft = currentState.gems.length - currentState.collectedGems.length;
      console.log(`Checking gems remain: ${gemsLeft} gems left`);
      return gemsLeft > 0;
    }
    if (condition.includes('gem found')) {
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
    return false;
  };

  const executeCode = async () => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => ({ ...prev, isExecuting: true }));
    
    let currentState = { ...gameState };
    let maxIterations = 100; // Reduced to prevent infinite loops
    let iterations = 0;
    
    console.log('Starting code execution');
    
    // Execute each line of pseudocode sequentially
    for (let lineIndex = 0; lineIndex < pseudocode.length && iterations < maxIterations; lineIndex++) {
      setCurrentLine(lineIndex);
      
      const line = pseudocode[lineIndex];
      console.log(`Executing line ${lineIndex}: ${line}`);
      
      const command = parseCommand(line);
      
      if (command) {
        if (command.type === 'while') {
          // Handle while loop
          const whileCondition = command.condition || '';
          console.log(`While loop started with condition: ${whileCondition}`);
          
          while (checkCondition(whileCondition, currentState) && iterations < maxIterations) {
            iterations++;
            console.log(`While loop iteration ${iterations}`);
            
            // Execute commands inside the while loop (next lines with indentation)
            for (let whileLineIndex = lineIndex + 1; whileLineIndex < pseudocode.length; whileLineIndex++) {
              const whileLine = pseudocode[whileLineIndex];
              
              // Stop if we reach a line that's not indented (end of while block)
              if (!whileLine.startsWith('  ') && whileLine.trim() !== '') {
                break;
              }
              
              if (whileLine.trim() === '') continue;
              
              setCurrentLine(whileLineIndex);
              console.log(`Executing while loop line ${whileLineIndex}: ${whileLine}`);
              
              const whileCommand = parseCommand(whileLine);
              
              if (whileCommand) {
                if (whileCommand.type === 'if') {
                  // Handle if statement inside while
                  if (checkCondition(whileCommand.condition || '', currentState)) {
                    console.log('If condition true, executing next command');
                    // Execute the next indented command
                    const nextLineIndex = whileLineIndex + 1;
                    if (nextLineIndex < pseudocode.length) {
                      const nextLine = pseudocode[nextLineIndex];
                      if (nextLine.startsWith('    ')) { // More indented = inside if
                        setCurrentLine(nextLineIndex);
                        const ifCommand = parseCommand(nextLine);
                        if (ifCommand) {
                          console.log(`Executing if command: ${ifCommand.type}`);
                          currentState = executeCommand(ifCommand, currentState);
                          setGameState(currentState);
                          await new Promise(resolve => setTimeout(resolve, 800));
                        }
                        whileLineIndex++; // Skip the next line since we executed it
                      }
                    }
                  }
                } else {
                  // Execute regular command
                  console.log(`Executing while command: ${whileCommand.type}`);
                  currentState = executeCommand(whileCommand, currentState);
                  setGameState(currentState);
                  await new Promise(resolve => setTimeout(resolve, 800));
                }
              }
            }
            
            // Check if we should continue the while loop
            if (!checkCondition(whileCondition, currentState)) {
              console.log('While condition became false, exiting loop');
              break;
            }
          }
          
          // Skip to the end of the while block
          let nextLineIndex = lineIndex + 1;
          while (nextLineIndex < pseudocode.length && pseudocode[nextLineIndex].startsWith('  ')) {
            nextLineIndex++;
          }
          lineIndex = nextLineIndex - 1; // -1 because the for loop will increment
          
        } else if (command.type === 'if') {
          // Handle standalone if statement
          if (checkCondition(command.condition || '', currentState)) {
            console.log('If condition true, executing next command');
            // Execute the next indented command
            const nextLineIndex = lineIndex + 1;
            if (nextLineIndex < pseudocode.length) {
              const nextLine = pseudocode[nextLineIndex];
              if (nextLine.startsWith('  ')) {
                setCurrentLine(nextLineIndex);
                const ifCommand = parseCommand(nextLine);
                if (ifCommand) {
                  console.log(`Executing if command: ${ifCommand.type}`);
                  currentState = executeCommand(ifCommand, currentState);
                  setGameState(currentState);
                  await new Promise(resolve => setTimeout(resolve, 800));
                }
                lineIndex++; // Skip the next line since we executed it
              }
            }
          }
        } else {
          // Execute regular command
          console.log(`Executing command: ${command.type} ${command.direction || ''}`);
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
    
    // Check win condition
    const finalGemsLeft = currentState.gems.length - currentState.collectedGems.length;
    if (finalGemsLeft === 0) {
      toast({
        title: "🎉 Congratulations!",
        description: "You collected all the gems! You're a programming master!",
        className: "bg-gradient-to-r from-purple-600 to-blue-600 border-purple-500/50 text-white",
      });
    }
  };

  const addCommand = (command: string) => {
    setPseudocode(prev => [...prev, command]);
  };

  const removeCommand = (index: number) => {
    setPseudocode(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-purple-500/30">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Pseudocode</h2>
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

      <div className="bg-slate-900 p-4 rounded-lg border border-slate-600 mb-4">
        <div className="space-y-2">
          {pseudocode.map((line, index) => (
            <div
              key={index}
              className={`
                flex items-center justify-between p-2 rounded text-sm font-mono
                ${currentLine === index ? 'bg-yellow-500/20 border border-yellow-500' : 'bg-slate-700/50'}
                ${line.trim().startsWith('while') || line.trim().startsWith('if') ? 'text-green-400' : ''}
                ${line.trim().includes('move') || line.trim().includes('turn') ? 'text-blue-400' : ''}
                ${line.trim().includes('collect') ? 'text-purple-400' : ''}
              `}
            >
              <span className="text-white">{line}</span>
              <Button
                onClick={() => removeCommand(index)}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-purple-200">Available Commands:</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => addCommand("move forward")}
            variant="outline"
            size="sm"
            className="text-blue-400 border-blue-400/30"
          >
            move forward
          </Button>
          <Button
            onClick={() => addCommand("turn right")}
            variant="outline"
            size="sm"
            className="text-blue-400 border-blue-400/30"
          >
            turn right
          </Button>
          <Button
            onClick={() => addCommand("turn left")}
            variant="outline"
            size="sm"
            className="text-blue-400 border-blue-400/30"
          >
            turn left
          </Button>
          <Button
            onClick={() => addCommand("collect gem")}
            variant="outline"
            size="sm"
            className="text-purple-400 border-purple-400/30"
          >
            collect gem
          </Button>
          <Button
            onClick={() => addCommand("while gems remain")}
            variant="outline"
            size="sm"
            className="text-green-400 border-green-400/30 col-span-2"
          >
            while gems remain
          </Button>
          <Button
            onClick={() => addCommand("if gem found")}
            variant="outline"
            size="sm"
            className="text-green-400 border-green-400/30 col-span-2"
          >
            if gem found
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PseudocodeEditor;
