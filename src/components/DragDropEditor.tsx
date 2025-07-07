import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  GripVertical, 
  ChevronRight, 
  ChevronDown,
  Lightbulb,
  Code,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Gem,
  Eye,
  Brain,
  Zap,
  Target,
  Zap as Fire,
  Shield,
  Crosshair
} from "lucide-react";
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
  type: 'move' | 'turn' | 'collect' | 'while' | 'if' | 'else' | 'fire' | 'reload' | 'switch_weapon';
  direction?: string;
  condition?: string;
  indentLevel: number;
  weaponType?: string;
  ammoCount?: number;
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
  const [draggedCommand, setDraggedCommand] = useState<string | null>(null);
  const { toast } = useToast();

  const dragRef = useRef<HTMLDivElement>(null);

  const availableCommands = [
    { 
      type: 'move', 
      label: 'Move', 
      icon: <ArrowUp className="w-4 h-4" />,
      description: 'Move the character in a direction',
      directions: ['forward'],
      concept: 'Movement'
    },
    { 
      type: 'turn', 
      label: 'Turn', 
      icon: <RotateCcw className="w-4 h-4" />,
      description: 'Change the character direction',
      directions: ['right', 'left'],
      concept: 'Movement'
    },
    { 
      type: 'collect', 
      label: 'Collect', 
      icon: <Gem className="w-4 h-4" />,
      description: 'Pick up a gem at current position',
      directions: [],
      concept: 'Actions'
    },
    { 
      type: 'fire', 
      label: 'Fire Weapon', 
      icon: <Fire className="w-4 h-4" />,
      description: 'Shoot in current direction',
      directions: [],
      concept: 'Combat'
    },
    { 
      type: 'reload', 
      label: 'Reload', 
      icon: <Shield className="w-4 h-4" />,
      description: 'Reload current weapon',
      directions: [],
      concept: 'Combat'
    },
    { 
      type: 'switch_weapon', 
      label: 'Switch Weapon', 
      icon: <Target className="w-4 h-4" />,
      description: 'Change to different weapon',
      directions: ['pistol', 'rifle', 'shotgun', 'sniper'],
      concept: 'Combat'
    },
    { 
      type: 'while', 
      label: 'While Loop', 
      icon: <Zap className="w-4 h-4" />,
      description: 'Repeat commands while condition is true',
      conditions: ['gems remain', 'off target', 'ammo > 0', 'enemy detected'],
      concept: 'Loops'
    },
    { 
      type: 'if', 
      label: 'If Statement', 
      icon: <Brain className="w-4 h-4" />,
      description: 'Execute commands if condition is true',
      conditions: ['front is clear', 'gem found', 'enemy in sight', 'low ammo'],
      concept: 'Conditions'
    },
    { 
      type: 'else', 
      label: 'Else', 
      icon: <ChevronDown className="w-4 h-4" />,
      description: 'Execute when if condition is false',
      directions: [],
      concept: 'Conditions'
    }
  ];

  const weaponTypes = [
    { name: 'pistol', damage: 10, ammo: 12, fireRate: 1, icon: <Target className="w-4 h-4" /> },
    { name: 'rifle', damage: 15, ammo: 30, fireRate: 3, icon: <Fire className="w-4 h-4" /> },
    { name: 'shotgun', damage: 25, ammo: 8, fireRate: 1, icon: <Crosshair className="w-4 h-4" /> },
    { name: 'sniper', damage: 50, ammo: 5, fireRate: 1, icon: <Target className="w-4 h-4" /> }
  ];

  const parseCommand = (block: CodeBlock): Command | null => {
    switch (block.type) {
      case 'move':
        return { type: 'move', direction: block.direction as 'forward' };
      case 'turn':
        return { type: 'turn', direction: block.direction as 'left' | 'right' };
      case 'collect':
        return { type: 'collect' };
      case 'fire':
        return { type: 'fire', weaponType: block.weaponType };
      case 'reload':
        return { type: 'reload' };
      case 'switch_weapon':
        return { type: 'switch_weapon', weaponType: block.weaponType };
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
        if (gemIndex !== -1 && newState.collectedGems.length < 1) {
          newState.collectedGems = [...newState.collectedGems, newState.gems[gemIndex]];
        }
        break;

      case 'fire':
        // Handle firing weapon
        console.log(`Firing weapon: ${command.weaponType}`);
        // Add bullet trajectory, damage calculation, etc.
        break;

      case 'reload':
        // Handle weapon reload
        console.log('Reloading weapon');
        break;

      case 'switch_weapon':
        // Handle weapon switching
        console.log(`Switching to weapon: ${command.weaponType}`);
        break;
    }
    
    return newState;
  };

  const checkCondition = (condition: string, currentState: GameState): boolean => {
    if (condition?.includes('gems remain')) {
      const gemsLeft = currentState.gems.length - currentState.collectedGems.length;
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
      return frontIsClear;
    }
    if (condition?.includes('ammo > 0')) {
      // Check if current weapon has ammo
      return true; // Placeholder
    }
    if (condition?.includes('enemy detected')) {
      // Check if enemies are nearby
      return false; // Placeholder
    }
    if (condition?.includes('enemy in sight')) {
      // Check if enemy is in line of sight
      return false; // Placeholder
    }
    if (condition?.includes('low ammo')) {
      // Check if ammo is low
      return false; // Placeholder
    }
    return false;
  };

  const executeCode = async () => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => ({ ...prev, isExecuting: true }));
    
    let currentState = { ...gameState };
    let maxIterations = 100;
    let iterations = 0;
    
    for (let blockIndex = 0; blockIndex < codeBlocks.length && iterations < maxIterations; blockIndex++) {
      setCurrentLine(blockIndex);
      
      const block = codeBlocks[blockIndex];
      const command = parseCommand(block);
      
      if (command) {
        if (command.type === 'while') {
          const whileCondition = command.condition || '';
          
          while (checkCondition(whileCondition, currentState) && iterations < maxIterations) {
            iterations++;
            
            for (let whileBlockIndex = blockIndex + 1; whileBlockIndex < codeBlocks.length; whileBlockIndex++) {
              const whileBlock = codeBlocks[whileBlockIndex];
              
              if (whileBlock.indentLevel <= block.indentLevel) {
                break;
              }
              
              setCurrentLine(whileBlockIndex);
              const whileCommand = parseCommand(whileBlock);
              
              if (whileCommand) {
                if (whileCommand.type === 'if') {
                  if (checkCondition(whileCommand.condition || '', currentState)) {
                    const nextBlockIndex = whileBlockIndex + 1;
                    if (nextBlockIndex < codeBlocks.length && codeBlocks[nextBlockIndex].indentLevel > whileBlock.indentLevel) {
                      setCurrentLine(nextBlockIndex);
                      const ifCommand = parseCommand(codeBlocks[nextBlockIndex]);
                      if (ifCommand) {
                        currentState = executeCommand(ifCommand, currentState);
                        setGameState(currentState);
                        await new Promise(resolve => setTimeout(resolve, 800));
                      }
                      whileBlockIndex++;
                    }
                  } else {
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
                          currentState = executeCommand(elseCommand, currentState);
                          setGameState(currentState);
                          await new Promise(resolve => setTimeout(resolve, 800));
                        }
                      }
                      whileBlockIndex = elseBlockIndex + 1;
                    }
                  }
                } else {
                  currentState = executeCommand(whileCommand, currentState);
                  setGameState(currentState);
                  await new Promise(resolve => setTimeout(resolve, 800));
                }
              }
            }
            
            if (!checkCondition(whileCondition, currentState)) {
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
            const nextBlockIndex = blockIndex + 1;
            if (nextBlockIndex < codeBlocks.length && codeBlocks[nextBlockIndex].indentLevel > block.indentLevel) {
              setCurrentLine(nextBlockIndex);
              const ifCommand = parseCommand(codeBlocks[nextBlockIndex]);
              if (ifCommand) {
                currentState = executeCommand(ifCommand, currentState);
                setGameState(currentState);
                await new Promise(resolve => setTimeout(resolve, 800));
              }
              blockIndex++;
            }
          }
        } else {
          currentState = executeCommand(command, currentState);
          setGameState(currentState);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
      
      iterations++;
    }

    setGameState(prev => ({ ...prev, isExecuting: false }));
    setCurrentLine(-1);
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
        case 'fire':
          return `${indent}fire ${block.weaponType || 'weapon'}`;
        case 'reload':
          return `${indent}reload`;
        case 'switch_weapon':
          return `${indent}switch to ${block.weaponType}`;
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
      condition: commandType === 'while' ? 'gems remain' : commandType === 'if' ? 'front is clear' : undefined,
      weaponType: commandType === 'switch_weapon' ? 'pistol' : undefined
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

  const updateBlockWeapon = (id: string, weaponType: string) => {
    const newBlocks = codeBlocks.map(block => 
      block.id === id ? { ...block, weaponType } : block
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
      score: 0,
      dropZoneIndex: 0,
      isExecuting: false,
      gems: [
        { x: 2, y: 1 },
        { x: 5, y: 3 },
        { x: 1, y: 5 },
        { x: 6, y: 2 },
        { x: 3, y: 6 },
        { x: 7, y: 4 },
        { x: 4, y: 8 },
        { x: 9, y: 1 },
        { x: 0, y: 9 },
        { x: 8, y: 7 }
      ]
    }));
    setCurrentLine(-1);
  };

  const getCommandIcon = (type: string) => {
    switch (type) {
      case 'move': return <ArrowUp className="w-4 h-4" />;
      case 'turn': return <RotateCcw className="w-4 h-4" />;
      case 'collect': return <Gem className="w-4 h-4" />;
      case 'fire': return <Fire className="w-4 h-4" />;
      case 'reload': return <Shield className="w-4 h-4" />;
      case 'switch_weapon': return <Target className="w-4 h-4" />;
      case 'while': return <Zap className="w-4 h-4" />;
      case 'if': return <Brain className="w-4 h-4" />;
      case 'else': return <ChevronDown className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const getCommandColor = (type: string) => {
    switch (type) {
      case 'move':
      case 'turn':
        return 'bg-blue-500/20 text-blue-400 border-blue-400/30';
      case 'collect':
        return 'bg-purple-500/20 text-purple-400 border-purple-400/30';
      case 'fire':
      case 'reload':
      case 'switch_weapon':
        return 'bg-red-500/20 text-red-400 border-red-400/30';
      case 'while':
      case 'if':
      case 'else':
        return 'bg-green-500/20 text-green-400 border-green-400/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Code Editor */}
      <Card className="bg-slate-800/50 border-purple-500/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg text-white flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-400" />
              Combat Code Editor
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={executeCode}
                disabled={gameState.isExecuting}
                className="bg-green-600 hover:bg-green-700"
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                Execute
              </Button>
              <Button
                onClick={resetGame}
                variant="outline"
                size="sm"
                className="border-red-400 text-red-400 hover:bg-red-400/10"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code Blocks Area */}
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-600 min-h-[200px]">
            <div className="text-sm text-gray-400 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Drag combat commands here to build your program
            </div>
            <div className="space-y-2">
              {codeBlocks.map((block, index) => (
                <div
                  key={block.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                    ${dragOverIndex === index ? 'border-blue-400 bg-blue-400/10' : 'border-slate-600 bg-slate-700/30'}
                    ${currentLine === index ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}
                    hover:bg-slate-700/50
                  `}
                  style={{ marginLeft: `${block.indentLevel * 32}px` }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`p-2 rounded-lg ${getCommandColor(block.type)}`}>
                      {getCommandIcon(block.type)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-white">
                        {block.type}
                      </span>

                      {(block.type === 'move' || block.type === 'turn') && (
                        <Select 
                          value={block.direction} 
                          onValueChange={(value) => updateBlockDirection(block.id, value)}
                        >
                          <SelectTrigger className="w-24 h-8 bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {availableCommands.find(cmd => cmd.type === block.type)?.directions?.map(dir => (
                              <SelectItem key={dir} value={dir} className="text-white hover:bg-slate-600">
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
                          <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {availableCommands.find(cmd => cmd.type === block.type)?.conditions?.map(condition => (
                              <SelectItem key={condition} value={condition} className="text-white hover:bg-slate-600">
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {block.type === 'switch_weapon' && (
                        <Select 
                          value={block.weaponType} 
                          onValueChange={(value) => updateBlockWeapon(block.id, value)}
                        >
                          <SelectTrigger className="w-32 h-8 bg-slate-700 border-slate-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-700 border-slate-600">
                            {availableCommands.find(cmd => cmd.type === block.type)?.directions?.map(weapon => (
                              <SelectItem key={weapon} value={weapon} className="text-white hover:bg-slate-600">
                                {weapon}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => adjustIndentation(block.id, -1)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-300"
                      disabled={block.indentLevel === 0}
                    >
                      ←
                    </Button>
                    <Button
                      onClick={() => adjustIndentation(block.id, 1)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-300"
                    >
                      →
                    </Button>
                    <Button
                      onClick={() => removeBlock(block.id)}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Commands */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-purple-200 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Available Commands
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableCommands.map((command) => (
                <div
                  key={command.type}
                  draggable
                  onDragStart={() => setDraggedCommand(command.type)}
                  onDragEnd={() => setDraggedCommand(null)}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-grab select-none transition-all
                    ${getCommandColor(command.type)}
                    hover:scale-105 active:scale-95
                  `}
                  style={{ userSelect: 'none' }}
                >
                  <div className={`p-1.5 rounded ${getCommandColor(command.type)}`}>
                    {command.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{command.label}</div>
                    <div className="text-xs opacity-75">{command.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weapon Types Info */}
          <div className="bg-slate-700/30 p-4 rounded-lg border border-purple-500/20">
            <h3 className="text-sm font-medium text-purple-200 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Weapon Types
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weaponTypes.map((weapon) => (
                <div key={weapon.name} className="text-center p-2 bg-slate-600/30 rounded border border-slate-500/30">
                  <div className="flex justify-center mb-1">
                    <div className="p-1 rounded bg-red-500/20 text-red-400">
                      {weapon.icon}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-white capitalize">{weapon.name}</div>
                  <div className="text-xs text-gray-400">
                    DMG: {weapon.damage} | Ammo: {weapon.ammo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DragDropEditor;
