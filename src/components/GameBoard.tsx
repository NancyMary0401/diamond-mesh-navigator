
import React, { useEffect, useRef } from "react";
import { GameState, Position } from "@/types/game";
import { Gem, User, Target, Trophy, Bot as BotIcon, Zap } from "lucide-react";

interface GameBoardProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onCommandGenerated?: (command: { id: string; type: 'move' | 'collect' | 'drop' | 'shoot'; direction?: 'up' | 'down' | 'left' | 'right'; timestamp: number; scoreChange?: number; blocked?: boolean; zoneProgress?: string; hit?: boolean; target?: string }) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ gameState, setGameState, onCommandGenerated }) => {
  const { player, gems, collectedGems, dropZones, score, gridSize, dropZoneIndex, bot, bullets } = gameState;
  const botIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const isGemAt = (x: number, y: number): boolean => {
    return gems.some(gem => gem.x === x && gem.y === y) && 
           !collectedGems.some(collected => collected.x === x && collected.y === y);
  };

  const isDropZoneAt = (x: number, y: number): boolean => {
    const currentDropZone = dropZones[dropZoneIndex];
    return currentDropZone && currentDropZone.x === x && currentDropZone.y === y;
  };

  const isBulletAt = (x: number, y: number): boolean => {
    return bullets.some(bullet => bullet.position.x === x && bullet.position.y === y);
  };

  const getBulletAt = (x: number, y: number) => {
    return bullets.find(bullet => bullet.position.x === x && bullet.position.y === y);
  };

  const getRotation = (direction: number): string => {
    const rotations = ["rotate-0", "rotate-90", "rotate-180", "-rotate-90"];
    return rotations[direction];
  };

  // Bot shooting logic - shoot at player if in line of sight
  const canShootAtPlayer = () => {
    const playerPos = gameState.player.position;
    const botPos = gameState.bot.position;
    
    // Check minimum distance (bot won't shoot if player is too close)
    const distance = Math.abs(botPos.x - playerPos.x) + Math.abs(botPos.y - playerPos.y);
    if (distance < 3) {
      return false; // Too close to shoot
    }
    
    // Check if player is in line of sight (same row or column)
    if (botPos.x === playerPos.x || botPos.y === playerPos.y) {
      // Check if bot is facing the player
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];
      
      const dir = directions[gameState.bot.direction];
      let checkX = botPos.x + dir.x;
      let checkY = botPos.y + dir.y;
      
      // Check if player is in the direction bot is facing
      while (checkX >= 0 && checkX < gridSize && checkY >= 0 && checkY < gridSize) {
        if (checkX === playerPos.x && checkY === playerPos.y) {
          // Additional check: make sure bot is actually facing the player
          const botToPlayerX = playerPos.x - botPos.x;
          const botToPlayerY = playerPos.y - botPos.y;
          
          // Bot should be facing toward the player
          if ((gameState.bot.direction === 0 && botToPlayerY < 0) || // facing up, player above
              (gameState.bot.direction === 1 && botToPlayerX > 0) || // facing right, player to right
              (gameState.bot.direction === 2 && botToPlayerY > 0) || // facing down, player below
              (gameState.bot.direction === 3 && botToPlayerX < 0)) { // facing left, player to left
            console.log("Bot can shoot at player!"); // Debug log
            return true; // Player is in line of sight
          }
        }
        checkX += dir.x;
        checkY += dir.y;
      }
    }
    return false;
  };

  // Bot AI Logic
  const findNearestGem = (): Position | null => {
    if (gems.length === 0) return null;
    
    let bestGem = gems[0];
    let bestScore = -Infinity;
    
    for (const gem of gems) {
      const botDistance = Math.abs(bot.position.x - gem.x) + Math.abs(bot.position.y - gem.y);
      const playerDistance = Math.abs(player.position.x - gem.x) + Math.abs(player.position.y - gem.y);
      
      // Prioritize gems that are close to bot AND close to player (competitive gems)
      // Lower distance is better, so we use negative distance
      const score = -botDistance - (playerDistance * 0.5); // Player distance has 50% weight
      
      if (score > bestScore) {
        bestScore = score;
        bestGem = gem;
      }
    }
    
    return bestGem;
  };

  const findFarDropLocation = (): Position => {
    // Find a location far from the player and current gems
    const farX = Math.abs(14 - player.position.x) > 7 ? 14 : 0;
    const farY = Math.abs(14 - player.position.y) > 7 ? 14 : 0;
    return { x: farX, y: farY };
  };



  const botAI = () => {
    if (gameState.isExecuting) return; // Don't move bot during code execution
    
    // Bot shoots at player if in line of sight (10% chance - much more reasonable)
    if (canShootAtPlayer() && Math.random() < 0.1 && gameState.player.isAlive) {
      console.log("Bot is shooting!"); // Debug log
      
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 },  // right
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }  // left
      ];
      
      const dir = directions[gameState.bot.direction];
      let bulletX = gameState.bot.position.x;
      let bulletY = gameState.bot.position.y;
      
      // Create bot bullet
      const bulletId = Date.now().toString() + '_bot';
      const bullet = {
        id: bulletId,
        position: { x: bulletX, y: bulletY },
        direction: gameState.bot.direction,
        shooter: 'bot' as const,
        timestamp: Date.now()
      };
      
      // Add bullet to game state
      setGameState(prev => ({
        ...prev,
        bullets: [...prev.bullets, bullet]
      }));
      
      // Animate bot bullet
      const animateBotBullet = () => {
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
        
        // Check if bullet hits player
        if (bulletX === gameState.player.position.x && bulletY === gameState.player.position.y) {
          console.log("Bot hit player!"); // Debug log
          // Hit the player!
          setGameState(prev => ({
            ...prev,
            player: {
              ...prev.player,
              health: 0,
              isAlive: false
            },
            bullets: prev.bullets.filter(b => b.id !== bulletId) // Remove bullet
          }));
          
          // Generate command for bot shooting player
          if (onCommandGenerated) {
            onCommandGenerated({
              id: Date.now().toString(),
              type: 'shoot',
              timestamp: Date.now(),
              hit: true,
              target: 'player'
            });
          }
          
          // Respawn player after 2 seconds
          setTimeout(() => {
            const newPositions = getRandomPositions(15);
            setGameState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                position: newPositions.player,
                direction: Math.floor(Math.random() * 4),
                health: 1,
                isAlive: true
              }
            }));
          }, 2000);
          return;
        }
        
        // Check if bullet is still within grid bounds
        if (bulletX >= 0 && bulletX < gridSize && bulletY >= 0 && bulletY < gridSize) {
          // Continue animation
          setTimeout(animateBotBullet, 100);
        } else {
          // Bullet went off screen - remove it
          setGameState(prev => ({
            ...prev,
            bullets: prev.bullets.filter(b => b.id !== bulletId)
          }));
        }
      };
      
      // Start bullet animation
      setTimeout(animateBotBullet, 100);
    }
    
    setGameState(prev => {
      const currentBot = prev.bot;
      
      switch (currentBot.state) {
        case 'searching':
          const nearestGem = findNearestGem();
          if (nearestGem) {
            return {
              ...prev,
              bot: {
                ...currentBot,
                targetGem: nearestGem,
                state: 'collecting'
              }
            };
          }
          break;
          
        case 'collecting':
          if (currentBot.targetGem) {
            const distanceToGem = Math.abs(currentBot.position.x - currentBot.targetGem.x) + 
                                 Math.abs(currentBot.position.y - currentBot.targetGem.y);
            
            if (distanceToGem === 0) {
              // Bot reached the gem, collect it
              const gemIndex = prev.gems.findIndex(gem => 
                gem.x === currentBot.targetGem!.x && gem.y === currentBot.targetGem!.y
              );
              
              if (gemIndex !== -1) {
                const collectedGem = prev.gems[gemIndex];
                const farLocation = findFarDropLocation();
                
                return {
                  ...prev,
                  gems: prev.gems.filter((_, index) => index !== gemIndex),
                  bot: {
                    ...currentBot,
                    isCarryingGem: true,
                    collectedGems: [...currentBot.collectedGems, collectedGem],
                    targetGem: null,
                    dropTarget: farLocation,
                    state: 'dropping'
                  }
                };
              }
            } else {
              // Move towards the gem
              const dx = currentBot.targetGem.x - currentBot.position.x;
              const dy = currentBot.targetGem.y - currentBot.position.y;
              
              let newX = currentBot.position.x;
              let newY = currentBot.position.y;
              
              // Move horizontally first, then vertically
              if (dx !== 0) {
                newX += dx > 0 ? 1 : -1;
              } else if (dy !== 0) {
                newY += dy > 0 ? 1 : -1;
              }
              
              // Ensure bot stays within grid bounds
              newX = Math.max(0, Math.min(gridSize - 1, newX));
              newY = Math.max(0, Math.min(gridSize - 1, newY));
              
              // Update bot direction based on movement
              let newDirection = currentBot.direction;
              if (dx > 0) newDirection = 1; // right
              else if (dx < 0) newDirection = 3; // left
              else if (dy > 0) newDirection = 2; // down
              else if (dy < 0) newDirection = 0; // up
              
              return {
                ...prev,
                bot: {
                  ...currentBot,
                  position: { x: newX, y: newY },
                  direction: newDirection
                }
              };
            }
          }
          break;
          
        case 'dropping':
          if (currentBot.dropTarget) {
            const distanceToDrop = Math.abs(currentBot.position.x - currentBot.dropTarget.x) + 
                                  Math.abs(currentBot.position.y - currentBot.dropTarget.y);
            
            if (distanceToDrop === 0) {
              // Bot reached drop location, drop the gem
              return {
                ...prev,
                bot: {
                  ...currentBot,
                  isCarryingGem: false,
                  collectedGems: [],
                  dropTarget: null,
                  state: 'searching'
                }
              };
            } else {
              // Move towards drop location
              const dx = currentBot.dropTarget.x - currentBot.position.x;
              const dy = currentBot.dropTarget.y - currentBot.position.y;
              
              let newX = currentBot.position.x;
              let newY = currentBot.position.y;
              
              // Move horizontally first, then vertically
              if (dx !== 0) {
                newX += dx > 0 ? 1 : -1;
              } else if (dy !== 0) {
                newY += dy > 0 ? 1 : -1;
              }
              
              // Ensure bot stays within grid bounds
              newX = Math.max(0, Math.min(gridSize - 1, newX));
              newY = Math.max(0, Math.min(gridSize - 1, newY));
              
              // Update bot direction based on movement
              let newDirection = currentBot.direction;
              if (dx > 0) newDirection = 1; // right
              else if (dx < 0) newDirection = 3; // left
              else if (dy > 0) newDirection = 2; // down
              else if (dy < 0) newDirection = 0; // up
              
              return {
                ...prev,
                bot: {
                  ...currentBot,
                  position: { x: newX, y: newY },
                  direction: newDirection
                }
              };
            }
          }
          break;
      }
      
      return prev;
    });
  };

  // Start bot AI when component mounts
  useEffect(() => {
    botIntervalRef.current = setInterval(botAI, 800); // Bot moves every 800ms
    
    return () => {
      if (botIntervalRef.current) {
        clearInterval(botIntervalRef.current);
      }
    };
  }, [gameState.isExecuting]);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-purple-500/30">
        <div 
          className="grid gap-1 bg-slate-900 p-4 rounded-xl border-2 border-blue-400/50"
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            width: '800px',
            height: '800px'
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const x = index % gridSize;
            const y = Math.floor(index / gridSize);
            const isPlayer = player.position.x === x && player.position.y === y;
            const isBot = bot.position.x === x && bot.position.y === y;
            const hasGem = isGemAt(x, y);
            const isDropZone = isDropZoneAt(x, y);
            const hasBullet = isBulletAt(x, y);
            const bullet = getBulletAt(x, y);

            return (
              <div
                key={index}
                className={`
                  relative border border-blue-300/20 bg-slate-800/50 rounded-sm
                  ${isPlayer ? 'bg-blue-500/30 border-blue-400' : ''}
                  ${isBot ? 'bg-red-500/30 border-red-400' : ''}
                  ${hasGem ? 'bg-purple-500/20' : ''}
                  ${isDropZone ? 'bg-green-500/20 border-green-400' : ''}
                  ${hasBullet ? 'bg-yellow-500/20 border-yellow-400' : ''}
                  transition-all duration-300
                `}
              >
                {isPlayer && (
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transform transition-transform duration-300
                    ${getRotation(player.direction)}
                  `}>
                    <div className="relative">
                      <User className="w-6 h-6 text-blue-400" />
                      {gameState.collectedGems.length > 0 && (
                        <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {gameState.collectedGems.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {isBot && (
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transform transition-transform duration-300
                    ${getRotation(bot.direction)}
                  `}>
                    <div className="relative">
                      <BotIcon className={`w-6 h-6 ${canShootAtPlayer() ? 'text-red-600 animate-pulse' : 'text-red-400'}`} />
                      {bot.isCarryingGem && (
                        <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          {bot.collectedGems.length}
                        </div>
                      )}
                      {canShootAtPlayer() && (
                        <div className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                          ⚡
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {hasGem && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gem className="w-5 h-5 text-purple-400 animate-pulse" />
                  </div>
                )}
                {isDropZone && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-400 animate-pulse" />
                  </div>
                )}
                {hasBullet && bullet && (
                  <div className={`
                    absolute inset-0 flex items-center justify-center
                    transform transition-transform duration-300
                    ${getRotation(bullet.direction)}
                  `}>
                    <Zap className={`w-4 h-4 ${bullet.shooter === 'player' ? 'text-yellow-400' : 'text-red-400'} animate-pulse drop-shadow-lg`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-lg">{score}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            <span className="text-green-200 text-sm">
              Zone {dropZoneIndex + 1}/{dropZones.length}
            </span>
          </div>
        </div>
        <div className="text-purple-200 text-sm">
          Position: ({player.position.x}, {player.position.y})
        </div>
        <div className="text-blue-200 text-sm">
          Direction: {['↑', '→', '↓', '←'][player.direction]}
        </div>
        <div className="text-red-200 text-sm">
          Bot: {bot.state} | Position: ({bot.position.x}, {bot.position.y}) | Direction: {['↑', '→', '↓', '←'][bot.direction]}
        </div>
        <div className="text-yellow-200 text-sm">
          Player: ({player.position.x}, {player.position.y}) | Alive: {player.isAlive ? 'Yes' : 'No'}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
