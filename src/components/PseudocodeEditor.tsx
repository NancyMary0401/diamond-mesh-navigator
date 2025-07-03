
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw } from "lucide-react";
import { GameState, Command } from "@/types/game";
import { useToast } from "@/hooks/use-toast";

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

  const executeCommand = (command: Command): boolean => {
    setGameState(prev => {
      const newState = { ...prev };
      
      switch (command.type) {
        case 'move':
          if (command.direction === 'forward') {
            const directions = [
              { x: 0, y: -1 }, // up
              { x: 1, y: 0 },  // right
              { x: 0, y: 1 },  // down
              { x: -1, y: 0 }  // left
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
    });
    
    return true;
  };

  const executeCode = async () => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => ({ ...prev, isExecuting: true }));
    setCurrentLine(0);

    let maxIterations = 100;
    let iterations = 0;
    
    for (let i = 0; i < pseudocode.length && iterations < maxIterations; i++) {
      iterations++;
      setCurrentLine(i);
      
      const command = parseCommand(pseudocode[i]);
      if (command) {
        if (command.type === 'while' && command.condition?.includes('gems remain')) {
          // Check if gems remain
          const gemsLeft = gameState.gems.length - gameState.collectedGems.length;
          if (gemsLeft > 0) {
            i = -1; // Restart loop
            continue;
          }
        } else {
          executeCommand(command);
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setGameState(prev => ({ ...prev, isExecuting: false }));
    setCurrentLine(-1);
    
    // Check win condition
    if (gameState.gems.length === gameState.collectedGems.length) {
      toast({
        title: "Congratulations!",
        description: "You collected all the gems!",
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
        </div>
      </div>
    </div>
  );
};

export default PseudocodeEditor;
