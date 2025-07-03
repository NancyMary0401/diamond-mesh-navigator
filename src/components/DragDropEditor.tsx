
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
    { id: '1', type: 'while', condition: 'off target', indentLevel: 0 },
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
    { type: 'while', label: 'while', conditions: ['off target', 'gems remain'] },
    { type: 'if', label: 'if', conditions: ['front is clear', 'gem found'] },
    { type: 'else', label: 'else', directions: [] }
  ];

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
    
    // Remove the dragged item
    newBlocks.splice(dragIndex, 1);
    
    // Insert at new position
    const adjustedDropIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newBlocks.splice(adjustedDropIndex, 0, draggedItem);
    
    setCodeBlocks(newBlocks);
    setDraggedItem(null);
    setDragOverIndex(null);
    
    // Update pseudocode
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
      condition: commandType === 'while' ? 'off target' : commandType === 'if' ? 'front is clear' : undefined
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
            onClick={() => {/* Execute logic will be implemented */}}
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

      {/* Code Blocks Area */}
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

      {/* Available Commands */}
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
