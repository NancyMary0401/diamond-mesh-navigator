import React, { useEffect, useRef } from "react";
import { GameState, Position, Bullet } from "@/types/game";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, Hand, Package, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Function to generate random positions with bot near player
const getRandomPositions = (gridSize: number): { player: Position; bot: Position } => {
  const playerPos = {
    x: Math.floor(Math.random() * gridSize),
    y: Math.floor(Math.random() * gridSize)
  };
  
  // Generate bot position within 2-4 cells of player
  let botPos: Position;
  let attempts = 0;
  
  do {
    const distance = 2 + Math.floor(Math.random() * 3); // 2-4 cells away
    const direction = Math.floor(Math.random() * 4); // 0: up, 1: right, 2: down, 3: left
    
    botPos = { ...playerPos };
    
    switch (direction) {
      case 0: // up
        botPos.y = Math.max(0, playerPos.y - distance);
        break;
      case 1: // right
        botPos.x = Math.min(gridSize - 1, playerPos.x + distance);
        break;
      case 2: // down
        botPos.y = Math.min(gridSize - 1, playerPos.y + distance);
        break;
      case 3: // left
        botPos.x = Math.max(0, playerPos.x - distance);
        break;
    }
    
    attempts++;
  } while (
    // Ensure bot is not too close (at least 2 cells) and not too far (max 4 cells)
    (Math.abs(playerPos.x - botPos.x) + Math.abs(playerPos.y - botPos.y) < 2) ||
    (Math.abs(playerPos.x - botPos.x) + Math.abs(playerPos.y - botPos.y) > 4) ||
    attempts > 10
  );
  
  return { player: playerPos, bot: botPos };
};

interface KeyboardControlsProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onCommandGenerated: (command: { id: string; type: 'move' | 'collect' | 'drop' | 'shoot'; direction?: 'up' | 'down' | 'left' | 'right'; timestamp: number; scoreChange?: number; blocked?: boolean; zoneProgress?: string; hit?: boolean; target?: string }) => void;
}

const KeyboardControls: React.FC<KeyboardControlsProps> = ({ gameState, setGameState, onCommandGenerated }) => {
  const moveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const currentPositionRef = useRef({ x: gameState.player.position.x, y: gameState.player.position.y });
  const gameStateRef = useRef(gameState);

  // Update ref when gameState changes
  useEffect(() => {
    currentPositionRef.current = gameState.player.position;
    gameStateRef.current = gameState;
  }, [gameState]);

  const moveInDirection = (direction: number) => {
    const { gridSize } = gameState;
    const currentPos = currentPositionRef.current;
    let newX = currentPos.x;
    let newY = currentPos.y;

    switch (direction) {
      case 0: // up
        newY = Math.max(0, currentPos.y - 1);
        break;
      case 1: // right
        newX = Math.min(gridSize - 1, currentPos.x + 1);
        break;
      case 2: // down
        newY = Math.min(gridSize - 1, currentPos.y + 1);
        break;
      case 3: // left
        newX = Math.max(0, currentPos.x - 1);
        break;
    }

    // Update ref immediately
    currentPositionRef.current = { x: newX, y: newY };

    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        position: { x: newX, y: newY },
        direction: direction
      }
    }));

    // Generate command
    const directionNames = ['up', 'right', 'down', 'left'];
    onCommandGenerated({
      id: Date.now().toString(),
      type: 'move',
      direction: directionNames[direction] as 'up' | 'down' | 'left' | 'right',
      timestamp: Date.now()
    });
  };

  const startContinuousMovement = () => {
    if (moveIntervalRef.current) return;

    moveIntervalRef.current = setInterval(() => {
      const pressedKeys = Array.from(pressedKeysRef.current);
      if (pressedKeys.length > 0) {
        const lastKey = pressedKeys[pressedKeys.length - 1]; // Use the most recently pressed key
        switch (lastKey) {
          case "ArrowUp":
            moveInDirection(0);
            break;
          case "ArrowRight":
            moveInDirection(1);
            break;
          case "ArrowLeft":
            moveInDirection(3);
            break;
          case "ArrowDown":
            moveInDirection(2);
            break;
        }
      }
    }, 300); // Move every 300ms for slower continuous movement
  };

  const stopContinuousMovement = () => {
    if (moveIntervalRef.current) {
      clearInterval(moveIntervalRef.current);
      moveIntervalRef.current = null;
    }
  };

  const shoot = () => {
    console.log("shoot called");
    const currentState = gameStateRef.current;
    const { player, bot } = currentState;
    
    if (!player.isAlive || !bot.isAlive) return;
    
    // Calculate bullet trajectory based on player direction
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];
    
    const dir = directions[player.direction];
    let bulletX = player.position.x;
    let bulletY = player.position.y;
    
    // Create visual bullet
    const bulletId = Date.now().toString();
    const bullet: Bullet = {
      id: bulletId,
      position: { x: bulletX, y: bulletY },
      direction: player.direction,
      shooter: 'player',
      timestamp: Date.now()
    };
    
    // Add bullet to game state
    setGameState(prev => ({
      ...prev,
      bullets: [...prev.bullets, bullet]
    }));
    
    // Animate bullet movement
    const animateBullet = () => {
      bulletX += dir.x;
      bulletY += dir.y;
      
      // Update bullet position
      setGameState(prev => ({
        ...prev,
        bullets: prev.bullets.map(b => 
          b.id === bulletId 
            ? { ...b, position: { x: bulletX, y: bulletY } }
            : b
        )
      }));
      
      // Check if bullet hits bot
      if (bulletX === bot.position.x && bulletY === bot.position.y) {
        // Hit the bot!
        console.log("Bot hit!");
        setGameState(prev => ({
          ...prev,
          bot: {
            ...prev.bot,
            health: prev.bot.health - 1,
            isAlive: prev.bot.health - 1 > 0
          },
          bullets: prev.bullets.filter(b => b.id !== bulletId) // Remove bullet
        }));
        
        // Generate command
        onCommandGenerated({
          id: Date.now().toString(),
          type: 'shoot',
          timestamp: Date.now(),
          hit: true,
          target: 'bot'
        });
        
        // If bot dies, respawn it after 3 seconds
        if (currentState.bot.health - 1 <= 0) {
          setTimeout(() => {
            const newPositions = getRandomPositions(15);
            setGameState(prev => ({
              ...prev,
              bot: {
                ...prev.bot,
                position: newPositions.bot,
                direction: Math.floor(Math.random() * 4),
                health: 2,
                isAlive: true,
                collectedGems: [],
                isCarryingGem: false,
                targetGem: null,
                dropTarget: null,
                state: 'searching'
              }
            }));
          }, 3000);
        }
        return;
      }
      
      // Check if bullet is still within grid bounds
      if (bulletX >= 0 && bulletX < currentState.gridSize && bulletY >= 0 && bulletY < currentState.gridSize) {
        // Continue animation
        setTimeout(animateBullet, 100); // Move bullet every 100ms
      } else {
        // Bullet went off screen - remove it
        setGameState(prev => ({
          ...prev,
          bullets: prev.bullets.filter(b => b.id !== bulletId)
        }));
        
        // Miss
        onCommandGenerated({
          id: Date.now().toString(),
          type: 'shoot',
          timestamp: Date.now(),
          hit: false
        });
      }
    };
    
    // Start bullet animation
    setTimeout(animateBullet, 100);
  };

  const collectGem = () => {
    console.log("collectGem called");
    const currentState = gameStateRef.current;
    const { player, gems, collectedGems } = currentState;
    console.log("Player position:", player.position);
    console.log("Available gems:", gems);
    console.log("Already collected:", collectedGems);
    
    // Check if already carrying a gem
    if (collectedGems.length >= 1) {
      console.log("Cannot collect gem - already carrying one");
      // Generate a "blocked" command to show in history
      onCommandGenerated({
        id: Date.now().toString(),
        type: 'collect',
        timestamp: Date.now(),
        blocked: true
      });
      return;
    }
    
    const gemAtPosition = gems.find(gem => gem.x === player.position.x && gem.y === player.position.y);
    console.log("Gem at position:", gemAtPosition);
    
    if (gemAtPosition && !collectedGems.some(collected => collected.x === gemAtPosition.x && collected.y === gemAtPosition.y)) {
      console.log("Collecting gem:", gemAtPosition);
      setGameState(prev => ({
        ...prev,
        collectedGems: [...prev.collectedGems, gemAtPosition],
        gems: prev.gems.filter(gem => !(gem.x === gemAtPosition.x && gem.y === gemAtPosition.y))
      }));
      
      // Generate command
      onCommandGenerated({
        id: Date.now().toString(),
        type: 'collect',
        timestamp: Date.now()
      });
    } else {
      console.log("Cannot collect gem - conditions not met");
    }
  };

  const dropGem = () => {
    console.log("dropGem called");
    const currentState = gameStateRef.current;
    const { player, collectedGems, dropZones } = currentState;
    console.log("Player position:", player.position);
    console.log("Collected gems:", collectedGems);
    
    if (collectedGems.length > 0) {
      const gemToDrop = collectedGems[collectedGems.length - 1]; // Drop the last collected gem
      console.log("Dropping gem:", gemToDrop);
      
      // Check if dropping in the current active drop zone
      const currentDropZone = dropZones[gameStateRef.current.dropZoneIndex];
      const isInDropZone = currentDropZone && currentDropZone.x === player.position.x && currentDropZone.y === player.position.y;
      
      setGameState(prev => ({
        ...prev,
        collectedGems: prev.collectedGems.slice(0, -1), // Remove the last gem
        gems: isInDropZone ? prev.gems : [...prev.gems, { x: player.position.x, y: player.position.y }], // Only add gem back if wrong drop
        score: isInDropZone ? prev.score + 10 : Math.max(0, prev.score - 5), // +10 for correct drop, -5 for wrong drop
        dropZoneIndex: isInDropZone ? Math.min(prev.dropZoneIndex + 1, prev.dropZones.length - 1) : prev.dropZoneIndex // Advance to next zone on success
      }));
      
      // Show feedback
      if (isInDropZone) {
        const nextZoneIndex = Math.min(gameStateRef.current.dropZoneIndex + 1, gameStateRef.current.dropZones.length - 1);
        const isLastZone = nextZoneIndex === gameStateRef.current.dropZoneIndex;
        
        if (isLastZone) {
          console.log("🎉 All drop zones completed! +10 points");
          // Reset drop zones after a short delay
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              dropZoneIndex: 0
            }));
          }, 2000);
          
          // Generate command with score change
          onCommandGenerated({
            id: Date.now().toString(),
            type: 'drop',
            timestamp: Date.now(),
            scoreChange: 10,
            zoneProgress: "🎉 All zones complete!"
          });
        } else {
          console.log("✅ Correct drop! +10 points - Next zone: " + (nextZoneIndex + 1));
          
          // Generate command with score change
          onCommandGenerated({
            id: Date.now().toString(),
            type: 'drop',
            timestamp: Date.now(),
            scoreChange: 10,
            zoneProgress: `Zone ${nextZoneIndex + 1}`
          });
        }
      } else {
        console.log("❌ Wrong location! -5 points");
        // Generate command with score change
        onCommandGenerated({
          id: Date.now().toString(),
          type: 'drop',
          timestamp: Date.now(),
          scoreChange: -5
        });
      }
    } else {
      console.log("No gems to drop");
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    console.log("Key pressed:", event.key); // Debug log
    
    if (gameState.isExecuting) {
      console.log("Game is executing, ignoring key");
      return;
    }

    const key = event.key;
    if (["ArrowUp", "ArrowRight", "ArrowLeft", "ArrowDown"].includes(key)) {
      event.preventDefault();
      console.log("Movement key:", key);
      
      if (!pressedKeysRef.current.has(key)) {
        pressedKeysRef.current.add(key);
        // Initial movement
        switch (key) {
          case "ArrowUp":
            console.log("Moving up");
            moveInDirection(0);
            break;
          case "ArrowRight":
            console.log("Moving right");
            moveInDirection(1);
            break;
          case "ArrowLeft":
            console.log("Moving left");
            moveInDirection(3);
            break;
          case "ArrowDown":
            console.log("Moving down");
            moveInDirection(2);
            break;
        }
        startContinuousMovement();
      }
    } else if (key.toLowerCase() === "c") {
      event.preventDefault();
      console.log("Collecting gem");
      collectGem();
    } else if (key.toLowerCase() === "d") {
      event.preventDefault();
      console.log("Dropping gem");
      dropGem();
    } else if (key.toLowerCase() === "f") {
      event.preventDefault();
      console.log("Shooting");
      shoot();
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key;
    if (["ArrowUp", "ArrowRight", "ArrowLeft", "ArrowDown"].includes(key)) {
      event.preventDefault();
      pressedKeysRef.current.delete(key);
      
      if (pressedKeysRef.current.size === 0) {
        stopContinuousMovement();
      }
    }
  };

  useEffect(() => {
    console.log("Setting up keyboard listeners");
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    // Test if keyboard events are working
    const testKeyHandler = (e: KeyboardEvent) => {
      console.log("Global key test:", e.key);
    };
    window.addEventListener("keydown", testKeyHandler);
    
    return () => {
      console.log("Cleaning up keyboard listeners");
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("keydown", testKeyHandler);
      stopContinuousMovement();
    };
  }, [gameState.isExecuting]);

  const controls = [
    { key: "↑", action: "Move Up", icon: ArrowUp, onClick: () => moveInDirection(0) },
    { key: "→", action: "Move Right", icon: ArrowRight, onClick: () => moveInDirection(1) },
    { key: "←", action: "Move Left", icon: ArrowLeft, onClick: () => moveInDirection(3) },
    { key: "↓", action: "Move Down", icon: ArrowDown, onClick: () => moveInDirection(2) },
  ];

  const actionControls = [
    { 
      key: "C", 
      action: "Collect Gem", 
      icon: Hand, 
      onClick: collectGem,
      disabled: gameState.collectedGems.length >= 1 || !gameState.gems.some(gem => 
        gem.x === gameState.player.position.x && 
        gem.y === gameState.player.position.y &&
        !gameState.collectedGems.some(collected => 
          collected.x === gem.x && collected.y === gem.y
        )
      )
    },
    { 
      key: "D", 
      action: "Drop Gem", 
      icon: Package, 
      onClick: dropGem,
      disabled: gameState.collectedGems.length === 0
    },
    { 
      key: "F", 
      action: "Shoot", 
      icon: Zap, 
      onClick: shoot,
      disabled: !gameState.player.isAlive || !gameState.bot.isAlive
    },
  ];

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <RotateCw className="w-5 h-5 text-purple-400" />
          Keyboard Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-purple-300 text-sm font-medium mb-2">Movement Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              {controls.map((control) => (
                <Button
                  key={control.key}
                  variant="outline"
                  className="h-12 bg-slate-700/50 border-purple-500/30 text-white hover:bg-purple-500/20 hover:border-purple-400"
                  onClick={control.onClick}
                  disabled={gameState.isExecuting}
                >
                  <control.icon className="w-4 h-4 mr-2" />
                  <span className="font-mono text-sm bg-purple-500/30 px-2 py-1 rounded">
                    {control.key}
                  </span>
                  <span className="ml-2 text-xs opacity-80">{control.action}</span>
                </Button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-purple-300 text-sm font-medium mb-2">Action Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              {actionControls.map((control) => (
                <Button
                  key={control.key}
                  variant="outline"
                  className="h-12 bg-slate-700/50 border-purple-500/30 text-white hover:bg-purple-500/20 hover:border-purple-400"
                  onClick={control.onClick}
                  disabled={gameState.isExecuting || control.disabled}
                >
                  <control.icon className="w-4 h-4 mr-2" />
                  <span className="font-mono text-sm bg-purple-500/30 px-2 py-1 rounded">
                    {control.key}
                  </span>
                  <span className="ml-2 text-xs opacity-80">{control.action}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-purple-500/20">
          <div className="text-center space-y-2">
            <p className="text-purple-200 text-sm">
              {gameState.isExecuting 
                ? "⏸️ Program is running - keyboard disabled" 
                : "🎮 Use arrow keys to control your character"
              }
            </p>
            <div className="flex items-center justify-center gap-2">
              <Package className="w-4 h-4 text-purple-400" />
              <span className="text-purple-200 text-sm">
                Carrying: {gameState.collectedGems.length} gems
              </span>
            </div>
            <div className="text-center">
              <span className="text-green-400 text-xs">⌨️ Keyboard active - try arrow keys or C/D</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyboardControls; 