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
import { Move, Repeat, Code2, CornerRightUp, Trash2, GripVertical } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { GameState } from "@/types/game";

// Block types and options
const blockTypes = [
  {
    type: "move",
    label: "move",
    icon: <Move size={18} className="text-cyan-300" />,
    options: ["forward", "backward"],
    color: "text-cyan-300",
  },
  {
    type: "turn",
    label: "turn",
    icon: <CornerRightUp size={18} className="text-blue-300" />,
    options: ["left", "right"],
    color: "text-blue-300",
  },
  {
    type: "collect",
    label: "collect",
    icon: <Code2 size={18} className="text-purple-300" />,
    options: [],
    color: "text-purple-300",
  },
];

// Add Block type for strong typing
/**
 * Block type for code blocks (recursive for children)
 */
type Block = {
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
    <div
      className={`my-1 h-8 flex items-center justify-center border-2 border-dashed rounded-lg transition-all ${isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
      style={{ minHeight: 32, cursor: 'pointer' }}
      onDragOver={e => {
        e.preventDefault();
        if (onDragOver) onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <span className="text-xs text-gray-400 select-none">{label}</span>
    </div>
  );
}

function CodeBlock({ block, listeners, isDragging, attributes, onOptionChange, setNodeRef, indent = 0, hoveredDropZone, handleDropZoneDragOver, handleDropZoneDragLeave, handleDropZoneDrop, onDelete }) {
  const blockType = findBlockType(block.type);
  if (!blockType) return null;
  // Dark accent backgrounds for block types
  let accentBg = '';
  if (blockType.type === 'move') accentBg = 'bg-gradient-to-r from-cyan-900 via-slate-800 to-cyan-800';
  else if (blockType.type === 'turn') accentBg = 'bg-gradient-to-r from-blue-900 via-slate-800 to-blue-800';
  else if (blockType.type === 'collect') accentBg = 'bg-gradient-to-r from-purple-900 via-slate-800 to-purple-800';
  const accentText = blockType.color;
  const dropZoneId = `${block.id}-end`;
  return (
    <div
      className={`flex flex-col border border-slate-700 rounded-xl px-3 py-2 mb-2 shadow-md transition-all duration-150 ${accentBg} ${isDragging ? 'scale-105 shadow-xl z-30' : 'hover:scale-[1.025] hover:shadow-lg'} relative`}
      style={{ marginLeft: indent * 24, minWidth: 120 }}
      ref={setNodeRef}
    >
      <div className="flex items-center gap-2">
        {blockType.icon}
        <span className={`font-semibold text-base ${accentText}`}>{blockType.label}</span>
        {blockType.options.length > 0 && (
          <Select value={block.option} onValueChange={onOptionChange}>
            <SelectTrigger
              className={`ml-1 h-7 px-2 text-xs font-semibold border-0 shadow-sm rounded-full bg-slate-900/80 ${accentText} flex items-center gap-1 focus:ring-2 focus:ring-cyan-700 transition-all min-w-[60px] max-w-[120px] text-slate-100`}
              style={{ width: 'auto' }}
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="rounded-xl shadow-lg border-0 mt-1 p-1 bg-slate-900 min-w-[70px] w-fit">
              {blockType.options.map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs rounded-md px-2 py-1 hover:bg-cyan-900 focus:bg-cyan-800 transition-all text-cyan-200">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex-1" />
        {/* Delete button */}
        <button
          className="text-red-400 hover:text-red-600 p-1 rounded-full transition-colors duration-150 bg-slate-900/70 hover:bg-red-900 shadow-sm border border-transparent hover:border-red-700"
          title="Delete block"
          onClick={e => {
            e.stopPropagation();
            if (onDelete) onDelete(block.id);
          }}
        >
          <Trash2 size={18} />
        </button>
        {/* Drag handle */}
        <button
          className="text-slate-400 hover:text-slate-200 p-1 rounded-full cursor-grab active:cursor-grabbing transition-colors duration-150 bg-slate-900/70 shadow-sm border border-slate-700 ml-2"
          title="Drag block"
          {...listeners}
          {...attributes}
          tabIndex={-1}
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={18} />
        </button>
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
    </div>
  );
}

function ToolbarBlock({ blockType, onDragStart }) {
  return (
    <div
      className={`flex items-center gap-1 rounded-xl shadow-md px-2 py-1 min-h-[28px] min-w-[60px] cursor-grab select-none transition-all duration-150
        bg-slate-800 border border-slate-700
        hover:bg-slate-700
        ${blockType.type === 'move' ? 'text-cyan-200' : blockType.type === 'turn' ? 'text-blue-200' : 'text-purple-200'}`}
      draggable
      onDragStart={(e) => onDragStart(e, blockType)}
      style={{ userSelect: "none" }}
    >
      {blockType.icon}
      <span className={`font-semibold text-xs ${blockType.color}`}>{blockType.label}</span>
      {blockType.options.length > 0 && (
        <span className="ml-0.5 text-[10px] text-cyan-300 bg-slate-900 rounded px-1 py-0.5">
          {blockType.options[0]}
        </span>
      )}
    </div>
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
    let { playerPosition, playerDirection, gridSize, collectedGems, gems } = prev;
    if (command.type === 'move') {
      let { x, y } = playerPosition;
      if (command.option === 'forward') {
        if (playerDirection === 0 && y > 0) y -= 1;
        if (playerDirection === 1 && x < gridSize - 1) x += 1;
        if (playerDirection === 2 && y < gridSize - 1) y += 1;
        if (playerDirection === 3 && x > 0) x -= 1;
      } else if (command.option === 'backward') {
        if (playerDirection === 0 && y < gridSize - 1) y += 1;
        if (playerDirection === 1 && x > 0) x -= 1;
        if (playerDirection === 2 && y > 0) y -= 1;
        if (playerDirection === 3 && x < gridSize - 1) x += 1;
      }
      return { ...prev, playerPosition: { x, y } };
    }
    if (command.type === 'turn') {
      let dir = playerDirection;
      if (command.option === 'right') dir = (dir + 1) % 4;
      if (command.option === 'left') dir = (dir + 3) % 4;
      if (command.option === 'up') dir = 0;
      if (command.option === 'down') dir = 2;
      return { ...prev, playerDirection: dir };
    }
    if (command.type === 'collect') {
      // Check if there's a gem at the current position and it's not already collected
      const gemIndex = gems.findIndex(gem => gem.x === playerPosition.x && gem.y === playerPosition.y);
      const alreadyCollected = collectedGems.some(gem => gem.x === playerPosition.x && gem.y === playerPosition.y);
      if (gemIndex !== -1 && !alreadyCollected) {
        return {
          ...prev,
          collectedGems: [...collectedGems, gems[gemIndex]]
        };
      }
      return prev;
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
    if (block.type === 'move' || block.type === 'turn') {
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
  shadowPath: { x: number; y: number }[];
  setShadowPath: React.Dispatch<React.SetStateAction<{ x: number; y: number }[]>>;
}

export default function CodeBlockEditor({ gameState, setGameState, blocks, setBlocks, shadowPath, setShadowPath }: CodeBlockEditorProps) {
  const [activeId, setActiveId] = useState(null);
  const [draggedToolbarBlock, setDraggedToolbarBlock] = useState(null);
  const [hoveredDropZone, setHoveredDropZone] = useState<string | null>(null); // Track which drop zone is hovered
  const [dropHandled, setDropHandled] = useState(false); // Track if drop was handled by a drop zone
  const sensors = useSensors(useSensor(PointerSensor));

  // --- Fix: Always use latest gameState in runAST ---
  const gameStateRef = useRef(gameState);
  React.useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  // --- End fix ---

  // --- Shadow Path Calculation ---
  React.useEffect(() => {
    // Start from initial shadow position and direction
    let shadowPos = { x: 0, y: 0 };
    let shadowDir = 0;
    const path = [{ x: shadowPos.x, y: shadowPos.y }];
    // Flatten blocks to a list of commands
    function flatten(blocks) {
      let cmds = [];
      for (const block of blocks) {
        if (block.type === 'move' || block.type === 'turn') {
          cmds.push({ type: block.type, option: block.option });
        }
        if (block.children && block.children.length > 0) {
          cmds = cmds.concat(flatten(block.children));
        }
      }
      return cmds;
    }
    const commands = flatten(blocks);
    for (const cmd of commands) {
      if (cmd.type === 'turn') {
        if (cmd.option === 'right') shadowDir = (shadowDir + 1) % 4;
        if (cmd.option === 'left') shadowDir = (shadowDir + 3) % 4;
        if (cmd.option === 'up') shadowDir = 0;
        if (cmd.option === 'down') shadowDir = 2;
      }
      if (cmd.type === 'move') {
        let { x, y } = shadowPos;
        if (cmd.option === 'forward') {
          if (shadowDir === 0 && y > 0) y -= 1;
          if (shadowDir === 1 && x < (gameState.gridSize - 1)) x += 1;
          if (shadowDir === 2 && y < (gameState.gridSize - 1)) y += 1;
          if (shadowDir === 3 && x > 0) x -= 1;
        } else if (cmd.option === 'backward') {
          if (shadowDir === 0 && y < (gameState.gridSize - 1)) y += 1;
          if (shadowDir === 1 && x > 0) x -= 1;
          if (shadowDir === 2 && y > 0) y -= 1;
          if (shadowDir === 3 && x < (gameState.gridSize - 1)) x += 1;
        }
        shadowPos = { x, y };
        path.push({ x, y });
      }
    }
    setShadowPath(path);
  }, [blocks, gameState.gridSize, setShadowPath]);

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
      const newBlock = {
        id: generateBlockId(),
        type: draggedToolbarBlock.type,
        option: draggedToolbarBlock.options[0] || "",
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
      const newBlock = {
        id: generateBlockId(),
        type: draggedToolbarBlock.type,
        option: draggedToolbarBlock.options[0] || "",
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

  return (
    <div className="min-h-[700px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-slate-100">
      {/* Editor above toolbar */}
      <ScrollArea className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-2xl max-w-4xl w-full mx-auto h-[500px] flex-1">
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-4">
            <span className="text-lg font-bold text-cyan-300">Your Program</span>
            <div className="flex-1" />
            <button
              className="px-4 py-2 rounded-lg bg-cyan-700 text-white font-semibold hover:bg-cyan-600 transition shadow"
              onClick={handleRun}
            >
              Run
            </button>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={(event) => setActiveId(event.active.id)}
            onDragEnd={(event) => {
              const { active, over } = event;
              if (active.id !== over?.id && active.id !== "toolbar-block") {
                const oldIndex = blocks.findIndex((b) => b.id === active.id);
                const newIndex = blocks.findIndex((b) => b.id === over?.id);
                setBlocks(arrayMove(blocks, oldIndex, newIndex));
              }
              setActiveId(null);
              setDraggedToolbarBlock(null);
            }}
            onDragCancel={() => {
              setActiveId(null);
              setDraggedToolbarBlock(null);
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
            <div
              className="h-14 border-2 border-dashed border-cyan-700 rounded-xl flex items-center justify-center mt-6 text-cyan-300 text-base cursor-pointer bg-slate-900/80 hover:bg-slate-800 transition-all shadow-inner"
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={handleDropFromToolbar}
            >
              <span className="flex items-center gap-2">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-cyan-400"><rect x="3" y="3" width="14" height="14" rx="3"/></svg>
                Drop here to add new block
              </span>
            </div>
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
      {/* Toolbar at the bottom, styled as a sticky card */}
      <div className="sticky bottom-0 z-10 flex flex-col items-start max-w-4xl w-full mx-auto mt-4 mb-3 bg-slate-900/95 border border-cyan-900 rounded-2xl p-4 shadow-cyan-900/30 shadow-2xl backdrop-blur-md">
        <div className="text-sm font-semibold text-cyan-300 mb-2 ml-1">Blocks</div>
        <div className="flex flex-row gap-2 w-full">
          {blockTypes.map((blockType) => (
            <ToolbarBlock
              key={blockType.type}
              blockType={blockType}
              onDragStart={handleToolbarDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 