import React, { useState, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { Button } from "./ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { Move, Repeat, Code2, CornerRightUp, Trash2, GripVertical, Terminal, ArrowUpRight, ArrowUp, ArrowDown, ArrowRight, ArrowLeft, Play, Square } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { GameState } from "@/types/game";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import { motion, AnimatePresence } from "motion/react";
// Removed: import ChatComponent from "./ChatComponent";

// Block types and options
const blockTypes = [
  {
    type: "while",
    label: "while",
    icon: <Repeat size={18} className="text-blue-400" />,
    options: ["off target", "on target", "true", "false"],
    color: "text-blue-400",
  },
  {
    type: "if",
    label: "if",
    icon: <Code2 size={18} className="text-purple-400" />,
    options: ["front is clear", "front is blocked"],
    color: "text-purple-400",
  },
  {
    type: "else",
    label: "else",
    icon: <Code2 size={18} className="text-purple-300" />,
    options: [],
    color: "text-purple-300",
  },
  {
    type: "move",
    label: "move",
    icon: <Move size={18} className="text-blue-500" />,
    options: [],
    color: "text-blue-500",
  },
  {
    type: "turn",
    label: "turn",
    icon: <CornerRightUp size={18} className="text-blue-300" />,
    options: [],
    color: "text-blue-300",
  },
  {
    type: "jump",
    label: "jump",
    icon: <ArrowUpRight size={18} className="text-blue-400" />,
    options: [],
    color: "text-blue-400",
  },
];

// Add Block type for strong typing
/**
 * Block type for code blocks (recursive for children)
 */
export type Block = {
  id: string;
  type: string;
  option: string;
  children: Block[];
};

// Unique ID generator for blocks
let blockIdCounter = 1;
function generateBlockId() {
  return `block-${blockIdCounter++}`;
}

// Initial blocks for demo
const initialBlocks: Block[] = [
  {
    id: generateBlockId(),
    type: "while",
    option: "off target",
    children: [
      {
        id: generateBlockId(),
        type: "if",
        option: "front is clear",
        children: [
          { id: generateBlockId(), type: "move", option: "forward", children: [] },
        ],
      },
      {
        id: generateBlockId(),
        type: "else",
        option: "",
        children: [
          { id: generateBlockId(), type: "turn", option: "right", children: [] },
        ],
      },
    ],
  },
];

function findBlockType(type) {
  return blockTypes.find((b) => b.type === type);
}

// Helper: check if a block type can have children
const canHaveChildren = (type) => ["while", "if", "else"].includes(type);

// Helper: recursively remove a block by id from the tree
function removeBlockById(blocks, id) {
  return blocks
    .filter(block => block.id !== id)
    .map(block => ({
      ...block,
      children: removeBlockById(block.children || [], id),
    }));
}

// Helper: recursively insert a block at a given position
function insertBlock(blocks, block, parentId, position) {
  if (parentId == null) {
    // Insert at root
    const newBlocks = [...blocks];
    newBlocks.splice(position, 0, block);
    return newBlocks;
  }
  return blocks.map((b) => {
    if (b.id === parentId && canHaveChildren(b.type)) {
      const newChildren = [...b.children];
      newChildren.splice(position, 0, block);
      return { ...b, children: newChildren };
    }
    if (b.children) {
      return { ...b, children: insertBlock(b.children, block, parentId, position) };
    }
    return b;
  });
}

// Helper: update option by id in a nested tree
function updateBlockOptionById(blocks: Block[], id: string, newOption: string): Block[] {
  return blocks.map(block => {
    if (block.id === id) {
      return {
        id: block.id,
        type: block.type,
        option: newOption,
        children: Array.isArray(block.children) ? block.children : [],
      };
    }
    if (block.children && block.children.length > 0) {
      return {
        id: block.id,
        type: block.type,
        option: block.option,
        children: updateBlockOptionById(block.children, id, newOption),
      };
    }
    // Always return all properties
    return {
      id: block.id,
      type: block.type,
      option: block.option,
      children: Array.isArray(block.children) ? block.children : [],
    };
  });
}

// DropZone component for visual drop area
function DropZone({ onDrop, isActive, label, onDragOver, onDragLeave }) {
  return (
    <motion.div
      className={`my-1 h-8 flex items-center justify-center border-2 border-dashed rounded-lg transition-all duration-150 
        ${isActive ? 'border-blue-500/70 bg-blue-900/20 shadow-md' : 'border-blue-700/40 bg-slate-900/60 shadow'}
      `}
      style={{ minHeight: 32, cursor: 'pointer' }}
      onDragOver={e => {
        e.preventDefault();
        if (onDragOver) onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      whileHover={{ scale: 1.02 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
        borderColor: isActive ? 'rgba(59, 130, 246, 0.7)' : 'rgba(59, 130, 246, 0.4)',
        backgroundColor: isActive ? 'rgba(30, 58, 138, 0.2)' : 'rgba(15, 23, 42, 0.6)'
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.span 
        className="text-xs font-semibold text-blue-200 select-none tracking-wide drop-shadow"
        animate={{ opacity: isActive ? 1 : 0.8 }}
      >
        {label}
      </motion.span>
    </motion.div>
  );
}

function CodeBlock({ block, listeners, isDragging, attributes, onOptionChange, setNodeRef, indent = 0, hoveredDropZone, handleDropZoneDragOver, handleDropZoneDragLeave, handleDropZoneDrop, onDelete }) {
  const blockType = findBlockType(block.type);
  // Project-matching accent backgrounds for block types
  const accentBg = blockType.color.includes('blue')
    ? 'bg-slate-900 border-blue-700/60'
    : 'bg-slate-900 border-purple-700/60';
  const accentText = blockType.color.includes('blue') ? 'text-blue-300' : 'text-purple-300';
  const dropZoneId = `${block.id}-end`;
  return (
    <motion.div
      className={`flex flex-col border-2 ${accentBg} rounded-xl px-3 py-2 mb-2 shadow-md relative min-w-[200px] max-w-[400px] w-fit`}
      style={{ marginLeft: indent * 18 }}
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ 
        opacity: 1, 
        scale: isDragging ? 1.05 : 1, 
        y: 0,
        boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)'
      }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      whileHover={{ 
        scale: 1.02, 
        boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
        borderColor: blockType.color.includes('blue') ? 'rgba(59, 130, 246, 0.8)' : 'rgba(147, 51, 234, 0.8)'
      }}
      transition={{ 
        duration: 0.3, 
        ease: "easeOut",
        layout: { duration: 0.2 }
      }}
    >
      <div className="flex items-center gap-2">
        {blockType.icon}
        <span className={`font-semibold text-sm ${accentText}`}>{blockType.label}</span>
        {/* Enhanced Toggle for move direction */}
        {block.type === 'move' && (
          <motion.div 
            className="ml-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ToggleGroup
              type="single"
              value={block.option || "forward"}
              onValueChange={val => val && onOptionChange(val)}
              className="flex bg-slate-800/60 border border-blue-600/40 rounded-md p-0.5 shadow-md backdrop-blur-sm hover:border-blue-500/60 transition-colors duration-200"
            >
              <ToggleGroupItem
                value="forward"
                className="flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-200 bg-transparent hover:bg-blue-600/30 hover:text-blue-100 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-sm data-[state=on]:shadow-blue-500/25 rounded-sm transition-all duration-200 border border-transparent data-[state=on]:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
              >
                <ArrowUp className="w-3 h-3 mr-1" />
                <span className="text-xs font-semibold">Fwd</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="backward"
                className="flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-200 bg-transparent hover:bg-blue-600/30 hover:text-blue-100 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-sm data-[state=on]:shadow-blue-500/25 rounded-sm transition-all duration-200 border border-transparent data-[state=on]:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
              >
                <ArrowDown className="w-3 h-3 mr-1" />
                <span className="text-xs font-semibold">Back</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </motion.div>
        )}
        {/* Enhanced Toggle for turn direction */}
        {block.type === 'turn' && (
          <motion.div 
            className="ml-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ToggleGroup
              type="single"
              value={block.option || "right"}
              onValueChange={val => val && onOptionChange(val)}
              className="flex bg-slate-800/60 border border-blue-600/40 rounded-md p-0.5 shadow-md backdrop-blur-sm hover:border-blue-500/60 transition-colors duration-200"
            >
              <ToggleGroupItem
                value="right"
                className="flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-200 bg-transparent hover:bg-blue-600/30 hover:text-blue-100 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-sm data-[state=on]:shadow-blue-500/25 rounded-sm transition-all duration-200 border border-transparent data-[state=on]:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                <span className="text-xs font-semibold">Right</span>
              </ToggleGroupItem>
              <ToggleGroupItem
                value="left"
                className="flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-200 bg-transparent hover:bg-blue-600/30 hover:text-blue-100 data-[state=on]:bg-blue-600 data-[state=on]:text-white data-[state=on]:shadow-sm data-[state=on]:shadow-blue-500/25 rounded-sm transition-all duration-200 border border-transparent data-[state=on]:border-blue-400/50 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                <span className="text-xs font-semibold">Left</span>
              </ToggleGroupItem>
            </ToggleGroup>
          </motion.div>
        )}
        {/* Enhanced Select for conditional blocks (while/if) */}
        {(block.type === 'while' || block.type === 'if') && (
          <motion.div 
            className="ml-2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Select
              value={block.option || blockType.options[0]}
              onValueChange={onOptionChange}
            >
              <SelectTrigger className="w-auto min-w-[120px] bg-slate-800/60 border border-blue-600/40 text-blue-200 hover:border-blue-500/60 focus:border-blue-400/60 focus:ring-1 focus:ring-blue-400/50 rounded-md px-2 py-1 text-xs font-medium shadow-md backdrop-blur-sm transition-all duration-200">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800/95 border border-blue-600/40 backdrop-blur-sm">
                {blockType.options.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="text-blue-200 hover:bg-blue-600/30 hover:text-blue-100 focus:bg-blue-600/30 focus:text-blue-100 cursor-pointer text-xs"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
        <div className="flex-1" />
        {/* Enhanced Delete button */}
        <motion.button
          className="text-red-400 hover:text-red-300 p-1 rounded-md transition-all duration-200 bg-slate-800/60 hover:bg-red-900/40 shadow-sm border border-transparent hover:border-red-400/40 hover:shadow-red-500/25 focus:outline-none focus:ring-1 focus:ring-red-400/50"
          title="Delete block"
          onClick={e => {
            e.stopPropagation();
            if (onDelete) onDelete(block.id);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Trash2 size={14} />
        </motion.button>
        {/* Enhanced Drag handle */}
        <motion.button
          className="text-gray-400 hover:text-blue-400 p-1 rounded-md cursor-grab active:cursor-grabbing transition-all duration-200 bg-slate-800/60 hover:bg-blue-900/40 shadow-sm border border-transparent hover:border-blue-400/40 hover:shadow-blue-500/25 ml-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400/50"
          title="Drag block"
          {...listeners}
          {...attributes}
          tabIndex={-1}
          style={{ touchAction: 'none' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <GripVertical size={14} />
        </motion.button>
      </div>
      {/* Only one drop zone at the end of all children */}
      {canHaveChildren(block.type) && (
        <div className="flex flex-col gap-1 mt-2">
          {block.children.map((child, i) => (
            <SortableBlock
              key={child.id}
              block={child}
              idx={i}
              onOptionChange={onOptionChange}
              indent={indent + 1}
              hoveredDropZone={hoveredDropZone}
              handleDropZoneDragOver={handleDropZoneDragOver}
              handleDropZoneDragLeave={handleDropZoneDragLeave}
              handleDropZoneDrop={handleDropZoneDrop}
              onDelete={onDelete}
            />
          ))}
          <DropZone
            label={block.type === 'if' ? 'If Branch' : block.type === 'else' ? 'Else Branch' : 'Body'}
            isActive={hoveredDropZone === dropZoneId}
            onDrop={() => handleDropZoneDrop(dropZoneId, block.children.length)}
            onDragOver={() => handleDropZoneDragOver(dropZoneId)}
            onDragLeave={handleDropZoneDragLeave}
          />
        </div>
      )}
    </motion.div>
  );
}

function ToolbarBlock({ blockType, onDragStart }) {
  return (
    <motion.div
      className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl shadow-md px-2 py-1 min-h-[28px] min-w-[60px] cursor-grab select-none"
      draggable
      onDragStart={(e) => onDragStart(e, blockType)}
      style={{ userSelect: "none" }}
      whileHover={{ 
        scale: 1.05, 
        boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
        backgroundColor: '#eff6ff'
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {blockType.icon}
      <span className={`font-semibold text-xs ${blockType.color}`}>{blockType.label}</span>
      {blockType.options.length > 0 && (
        <motion.span 
          className="ml-0.5 text-[10px] text-blue-400 bg-blue-50 rounded px-1 py-0.5"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          {blockType.options[0]}
        </motion.span>
      )}
    </motion.div>
  );
}

function SortableBlock({ block, idx, onOptionChange, indent = 0, hoveredDropZone, handleDropZoneDragOver, handleDropZoneDragLeave, handleDropZoneDrop, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useSortable({ id: block.id });
  return (
    <>
      <CodeBlock
        key={block.id}
        block={block}
        listeners={listeners}
        attributes={attributes}
        setNodeRef={setNodeRef}
        isDragging={isDragging}
        onOptionChange={onOptionChange}
        indent={indent}
        hoveredDropZone={hoveredDropZone}
        handleDropZoneDragOver={handleDropZoneDragOver}
        handleDropZoneDragLeave={handleDropZoneDragLeave}
        handleDropZoneDrop={handleDropZoneDrop}
        onDelete={onDelete}
      />
    </>
  );
}

// Helper: insert a block at a specific index in a branch (true/else/loop)
function insertBlockAtPosition(blocks, parentId, branch, position, newBlock) {
  return blocks.map(block => {
    if (block.id === parentId) {
      if (branch === 'true') {
        const children = [...block.children];
        children.splice(position, 0, newBlock);
        return { ...block, children };
      } else if (branch === 'else') {
        let children = [...block.children];
        let elseIdx = children.findIndex(child => child.type === 'else');
        if (elseIdx === -1) {
          // Add a new else block
          const elseBlock = { id: Date.now().toString() + Math.random(), type: 'else', option: '', children: [newBlock] };
          children.push(elseBlock);
        } else {
          // Insert into existing else block at position
          const elseChildren = [...children[elseIdx].children];
          elseChildren.splice(position, 0, newBlock);
          children[elseIdx] = {
            ...children[elseIdx],
            children: elseChildren,
          };
        }
        return { ...block, children };
      }
    }
    if (block.children && block.children.length > 0) {
      return { ...block, children: insertBlockAtPosition(block.children, parentId, branch, position, newBlock) };
    }
    return block;
  });
}

// Helper: flatten block tree into a list of commands (for now, just move/turn)
function flattenBlocks(blocks) {
  let commands = [];
  for (const block of blocks) {
    if (block.type === 'move' || block.type === 'turn') {
      commands.push({ type: block.type, option: block.option });
    }
    if (block.children && block.children.length > 0) {
      commands = commands.concat(flattenBlocks(block.children));
    }
  }
  return commands;
}

// Helper: execute a list of commands step by step
function runCommands(commands, gameState, setGameState, step = 0) {
  if (step >= commands.length) return;
  const command = commands[step];
  setGameState(prev => {
    let { playerPosition, playerDirection, shadowPosition, shadowDirection, gridSize, obstacles = [] } = prev;
    if (command.type === 'move') {
      let { x, y } = playerPosition;
      if (command.option === 'forward') {
        // Calculate next position
        let nextX = x, nextY = y;
        if (playerDirection === 0 && y > 0) nextY = y - 1;
        if (playerDirection === 1 && x < gridSize - 1) nextX = x + 1;
        if (playerDirection === 2 && y < gridSize - 1) nextY = y + 1;
        if (playerDirection === 3 && x > 0) nextX = x - 1;
        
        // Check if next position has an obstacle
        const hasObstacle = obstacles.some(o => o.x === nextX && o.y === nextY);
        
        if (hasObstacle) {
          // Jump over the obstacle (2 blocks forward)
          let jumpX = nextX, jumpY = nextY;
          if (playerDirection === 0 && nextY > 0) jumpY = nextY - 1;
          if (playerDirection === 1 && nextX < gridSize - 1) jumpX = nextX + 1;
          if (playerDirection === 2 && nextY < gridSize - 1) jumpY = nextY + 1;
          if (playerDirection === 3 && nextX > 0) jumpX = nextX - 1;
          
          // Only jump if landing position is clear
          if (!obstacles.some(o => o.x === jumpX && o.y === jumpY)) {
            return { ...prev, playerPosition: { x: jumpX, y: jumpY } };
          }
          // If landing position is also blocked, don't move
          return prev;
        } else {
          // Normal movement - jump to next block
          // Update shadow to follow player
          return { 
            ...prev, 
            playerPosition: { x: nextX, y: nextY },
            shadowPosition: { x: nextX, y: nextY },
            shadowDirection: playerDirection
          };
        }
      } else if (command.option === 'backward') {
        if (playerDirection === 0 && y < gridSize - 1) y += 1;
        if (playerDirection === 1 && x > 0) x -= 1;
        if (playerDirection === 2 && y > 0) y -= 1;
        if (playerDirection === 3 && x < gridSize - 1) x += 1;
        // Block movement if next cell is an obstacle
        if (obstacles.some(o => o.x === x && o.y === y)) {
          return prev;
        }
        // Update shadow to follow player
        return { 
          ...prev, 
          playerPosition: { x, y },
          shadowPosition: { x, y },
          shadowDirection: playerDirection
        };
      }
    }
    if (command.type === 'jump') {
      let { x, y } = playerPosition;
      let nx = x, ny = y;
      // Jump 2 blocks in the current direction
      if (playerDirection === 0) ny = Math.max(0, y - 2);
      if (playerDirection === 1) nx = Math.min(gridSize - 1, x + 2);
      if (playerDirection === 2) ny = Math.min(gridSize - 1, y + 2);
      if (playerDirection === 3) nx = Math.max(0, x - 2);
      
      // Check if landing position is clear
      if (!obstacles.some(o => o.x === nx && o.y === ny)) {
        return { 
          ...prev, 
          playerPosition: { x: nx, y: ny },
          shadowPosition: { x: nx, y: ny },
          shadowDirection: playerDirection
        };
      }
      return prev;
    }
    if (command.type === 'turn') {
      let dir = playerDirection;
      
      // Store current direction as shadow direction before changing
      const shadowDir = playerDirection;
      
      if (command.option === 'right') {
        dir = (dir + 1) % 4;
      }
      if (command.option === 'left') {
        dir = (dir - 1 + 4) % 4;
      }
      if (command.option === 'up') dir = 0;
      if (command.option === 'down') dir = 2;
      
      // Ensure direction is always between 0-3
      dir = ((dir % 4) + 4) % 4;
      
      return { 
        ...prev, 
        playerDirection: dir,
        shadowDirection: shadowDir,
        shadowPosition: { ...playerPosition } // Keep shadow at same position
      };
    }
    return prev;
  });
  setTimeout(() => runCommands(commands, gameState, setGameState, step + 1), 600);
}

// Helper: parse block tree into an AST preserving nesting and block types
function parseBlocks(blocks) {
  return blocks.map(block => ({
    type: block.type,
    option: block.option,
    children: block.children ? parseBlocks(block.children) : [],
  }));
}

// Helper: evaluate a condition string based on the current game state
function evaluateCondition(condition, gameState) {
  if (condition === 'true') return true;
  if (condition === 'false') return false;
  if (condition === 'off target') {
    // Example: off target means not at (0,0)
    return !(gameState.playerPosition.x === 0 && gameState.playerPosition.y === 0);
  }
  if (condition === 'on target') {
    return gameState.playerPosition.x === 0 && gameState.playerPosition.y === 0;
  }
  if (condition === 'front is clear') {
    // Check if the cell in front is within bounds
    const { x, y } = gameState.playerPosition;
    const dir = gameState.playerDirection;
    const gridSize = gameState.gridSize;
    if (dir === 0) return y > 0;
    if (dir === 1) return x < gridSize - 1;
    if (dir === 2) return y < gridSize - 1;
    if (dir === 3) return x > 0;
    return false;
  }
  if (condition === 'front is blocked') {
    const { x, y } = gameState.playerPosition;
    const dir = gameState.playerDirection;
    const gridSize = gameState.gridSize;
    if (dir === 0) return y === 0;
    if (dir === 1) return x === gridSize - 1;
    if (dir === 2) return y === gridSize - 1;
    if (dir === 3) return x === 0;
    return false;
  }
  return false;
}

// Helper: recursively execute the AST
function runAST(ast, gameStateRef, setGameState, done) {
  let stepIndex = 0;
  function step(blocks) {
    if (stepIndex >= blocks.length) {
      if (done) done();
      return;
    }
    const block = blocks[stepIndex];
    stepIndex++;
    if (block.type === 'move' || block.type === 'turn' || block.type === 'jump') {
      runCommands([{ type: block.type, option: block.option }], gameStateRef.current, setGameState, 0);
      setTimeout(() => step(blocks), 600);
    } else if (block.type === 'while') {
      function runWhile() {
        if (evaluateCondition(block.option, gameStateRef.current)) {
          runAST(block.children, gameStateRef, setGameState, () => {
            setTimeout(runWhile, 600);
          });
        } else {
          setTimeout(() => step(blocks), 0);
        }
      }
      runWhile();
    } else if (block.type === 'if') {
      if (evaluateCondition(block.option, gameStateRef.current)) {
        runAST(block.children, gameStateRef, setGameState, () => setTimeout(() => step(blocks), 600));
      } else {
        // Find else block
        const elseBlock = block.children.find(child => child.type === 'else');
        if (elseBlock) {
          runAST(elseBlock.children, gameStateRef, setGameState, () => setTimeout(() => step(blocks), 600));
        } else {
          setTimeout(() => step(blocks), 600);
        }
      }
    } else {
      setTimeout(() => step(blocks), 600);
    }
  }
  step(ast);
}

interface CodeBlockEditorProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
}

export default function CodeBlockEditor({ gameState, setGameState, blocks, setBlocks }: CodeBlockEditorProps) {
  const [activeId, setActiveId] = useState(null);
  const [draggedToolbarBlock, setDraggedToolbarBlock] = useState(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null); // Track which drop zone is hovered
  const [dropHandled, setDropHandled] = useState(false); // Track if drop was handled by a drop zone
  const [isDraggingBlock, setIsDraggingBlock] = useState(false); // Track if any block is being dragged
  const [isCanvasDropActive, setIsCanvasDropActive] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  // --- Fix: Always use latest gameState in runAST ---
  const gameStateRef = useRef(gameState);
  React.useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  // --- End fix ---

  // Handle drag from toolbar
  const handleToolbarDragStart = (e, blockType) => {
    setDraggedToolbarBlock(blockType);
    setActiveId("toolbar-block");
    e.dataTransfer.effectAllowed = "copy";
  };

  // Handle drop from toolbar (canvas drop)
  const handleDropFromToolbar = (event) => {
    if (dropHandled) {
      setDropHandled(false); // Always reset after checking
      return;
    }
    setDropHandled(false); // Always reset after handling
    if (draggedToolbarBlock) {
      // Set proper default options for different block types
      let defaultOption = "";
      if (draggedToolbarBlock.type === "move") {
        defaultOption = "forward";
      } else if (draggedToolbarBlock.type === "turn") {
        defaultOption = "right";
      } else if (draggedToolbarBlock.type === "jump") {
        defaultOption = "";
      } else {
        defaultOption = draggedToolbarBlock.options[0] || "";
      }
      
      const newBlock = {
        id: generateBlockId(),
        type: draggedToolbarBlock.type,
        option: defaultOption,
        children: [],
      };
      setBlocks((prev) => [...prev, newBlock]);
      setDraggedToolbarBlock(null);
      setActiveId(null);
    }
  };

  // Handler for drop zone hover
  const handleDropZoneDragOver = (zoneId: string) => {
    setHoveredDropZone(zoneId);
  };
  const handleDropZoneDragLeave = () => {
    setHoveredDropZone(null);
  };
  // Handler for drop (to be implemented)
  const handleDropZoneDrop = (zoneId: string, position: number = 0) => {
    setDropHandled(true); // Mark drop as handled by drop zone (do this first)
    setHoveredDropZone(null);
    if (draggedToolbarBlock) {
      // zoneId is like 'blockid-end'
      const parentId = zoneId.replace('-end', '');
      
      // Set proper default options for different block types
      let defaultOption = "";
      if (draggedToolbarBlock.type === "move") {
        defaultOption = "forward";
      } else if (draggedToolbarBlock.type === "turn") {
        defaultOption = "right";
      } else if (draggedToolbarBlock.type === "jump") {
        defaultOption = "";
      } else {
        defaultOption = draggedToolbarBlock.options[0] || "";
      }
      
      const newBlock = {
        id: generateBlockId(),
        type: draggedToolbarBlock.type,
        option: defaultOption,
        children: [],
      };
      setBlocks(prev => insertBlockAtPosition(prev, parentId, 'true', position, newBlock));
      setDraggedToolbarBlock(null);
      setActiveId(null);
    }
  };

  // Run button handler
  const handleRun = () => {
    const ast = parseBlocks(blocks);
    runAST(ast, gameStateRef, setGameState, () => {});
  };

  // Function to add move forward block when chat triggers it
  const addMoveForwardBlock = () => {
    const newBlock = {
      id: generateBlockId(),
      type: "move",
      option: "forward",
      children: [],
    };
    setBlocks((prev) => [...prev, newBlock]);
  };

  return (
    <motion.div 
      className="relative w-full h-full flex flex-col bg-slate-950/90 rounded-2xl border-2 border-blue-700/60 shadow-[0_0_32px_0_rgba(56,189,248,0.15)] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {/* Console-style header */}
      <motion.div 
        className="flex items-center gap-2 px-5 py-3 bg-slate-900/80 border-b border-blue-700/40 sticky top-0 z-20"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Terminal className="text-blue-400 w-6 h-6 drop-shadow-glow" />
        </motion.div>
        <span className="text-lg font-bold text-blue-200 tracking-wide select-none">Game Control Console</span>
        <div className="flex-1" />
        <motion.button
          className="px-6 py-2 rounded-xl bg-blue-700 text-white font-bold text-base shadow-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 border-2 border-blue-400/60"
          onClick={handleRun}
          style={{ boxShadow: '0 0 16px 2px #38bdf8cc' }}
          whileHover={{ 
            scale: 1.05, 
            boxShadow: '0 0 20px 4px #38bdf8cc',
            backgroundColor: '#1d4ed8'
          }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            boxShadow: ['0 0 16px 2px #38bdf8cc', '0 0 20px 4px #38bdf8cc', '0 0 16px 2px #38bdf8cc']
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut"
          }}
        >
          <span className="drop-shadow-glow flex items-center gap-2">
            <Play className="w-4 h-4" />
            Run
          </span>
        </motion.button>
      </motion.div>
      {/* Sticky Toolbar */}
      <motion.div 
        className="flex flex-col items-start max-w-4xl w-full mx-auto mt-2 mb-2 sticky top-14 z-10"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <motion.div 
          className="flex flex-row gap-1 w-full bg-slate-900/80 border border-blue-700/30 rounded-xl p-2 shadow-md"
          whileHover={{ boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }}
          transition={{ duration: 0.2 }}
        >
          {blockTypes.map((blockType, index) => (
            <motion.div
              key={blockType.type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
            >
              <ToolbarBlock
                blockType={blockType}
                onDragStart={handleToolbarDragStart}
              />
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      {/* Editor below toolbar (canvas is now the drop zone) */}
      <ScrollArea
        className={`flex-1 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-blue-800/30 rounded-2xl p-4 shadow-xl max-w-4xl w-full mx-auto min-h-[180px] max-h-[600px] overflow-y-auto transition-all ${isCanvasDropActive ? 'ring-4 ring-blue-400/40 bg-blue-900/10' : ''}`}
        onDragOver={e => {
          e.preventDefault();
          setIsCanvasDropActive(true);
        }}
        onDragLeave={() => setIsCanvasDropActive(false)}
        onDrop={e => {
          setIsCanvasDropActive(false);
          handleDropFromToolbar(e);
        }}
      >
        <div className="flex flex-col h-full">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => { setActiveId(event.active.id); setIsDraggingBlock(true); }}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (active.id !== over?.id && active.id !== "toolbar-block") {
                const oldIndex = blocks.findIndex((b) => b.id === active.id);
                const newIndex = blocks.findIndex((b) => b.id === over?.id);
                setBlocks(arrayMove(blocks, oldIndex, newIndex));
              }
              setActiveId(null);
              setDraggedToolbarBlock(null);
              setIsDraggingBlock(false);
            }}
            onDragCancel={() => {
              setActiveId(null);
              setDraggedToolbarBlock(null);
              setIsDraggingBlock(false);
            }}
          >
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, idx) => (
                <SortableBlock
                  key={block.id}
                  block={block}
                  idx={idx}
                  onOptionChange={(value) => {
                    setBlocks((prev) => updateBlockOptionById(prev, block.id, value));
                  }}
                  indent={0}
                  hoveredDropZone={hoveredDropZone}
                  handleDropZoneDragOver={handleDropZoneDragOver}
                  handleDropZoneDragLeave={handleDropZoneDragLeave}
                  handleDropZoneDrop={handleDropZoneDrop}
                  onDelete={id => setBlocks(prev => removeBlockById(prev, id))}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeId === "toolbar-block" && draggedToolbarBlock ? (
                <ToolbarBlock blockType={draggedToolbarBlock} onDragStart={() => {}} />
              ) : activeId ? (
                (() => {
                  const block = blocks.find((b) => b.id === activeId);
                  return block ? (
                    <CodeBlock
                      block={block}
                      listeners={{}}
                      attributes={{}}
                      setNodeRef={() => {}}
                      isDragging={true}
                      onOptionChange={() => {}}
                      hoveredDropZone={null}
                      handleDropZoneDragOver={() => {}}
                      handleDropZoneDragLeave={() => {}}
                      handleDropZoneDrop={() => {}}
                      onDelete={() => {}}
                    />
                  ) : null;
                })()
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </ScrollArea>
    </motion.div>
  );
} 