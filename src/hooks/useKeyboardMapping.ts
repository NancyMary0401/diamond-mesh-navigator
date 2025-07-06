import { useEffect, useCallback, useState } from 'react';
import { GameState, GameAction, KeyMapping, KeyboardMappingConfig, Position } from '@/types/game';

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

interface UseKeyboardMappingProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  onExecuteCode?: () => void;
  onStopExecution?: () => void;
  onResetGame?: () => void;
  onAddCommand?: (commandType: string) => void;
}

const defaultMappings: KeyMapping = {
  'm': 'moveForward',
  'a': 'turnLeft',
  'd': 'turnRight',
  's': 'collectGem',
  'r': 'executeCode',
  'e': 'resetGame',
  'q': 'stopExecution',
  'w': 'whileLoop',
  'i': 'ifStatement',
  'l': 'elseStatement',
  'f': 'forLoop',
  'c': 'toggleMapping'
};

export const useKeyboardMapping = ({
  gameState,
  setGameState,
  onExecuteCode,
  onStopExecution,
  onResetGame,
  onAddCommand
}: UseKeyboardMappingProps) => {
  const [config, setConfig] = useState<KeyboardMappingConfig>({
    mappings: { ...defaultMappings },
    isEnabled: true,
    showHints: true
  });

  const [isMappingMode, setIsMappingMode] = useState(false);
  const [pendingAction, setPendingAction] = useState<GameAction | null>(null);
  const [lastPressedKey, setLastPressedKey] = useState<string | undefined>(undefined);

  // Game action handlers
  const handleMoveForward = useCallback(() => {
    if (gameState.isExecuting) return;
    
    const { playerPosition, playerDirection, gridSize } = gameState;
    let newX = playerPosition.x;
    let newY = playerPosition.y;

    switch (playerDirection) {
      case 0: // up
        newY = Math.max(0, playerPosition.y - 1);
        break;
      case 1: // right
        newX = Math.min(gridSize - 1, playerPosition.x + 1);
        break;
      case 2: // down
        newY = Math.min(gridSize - 1, playerPosition.y + 1);
        break;
      case 3: // left
        newX = Math.max(0, playerPosition.x - 1);
        break;
    }

    setGameState(prev => ({
      ...prev,
      playerPosition: { x: newX, y: newY }
    }));
  }, [gameState, setGameState]);

  const handleTurnLeft = useCallback(() => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => ({
      ...prev,
      playerDirection: (prev.playerDirection - 1 + 4) % 4
    }));
  }, [gameState.isExecuting, setGameState]);

  const handleTurnRight = useCallback(() => {
    if (gameState.isExecuting) return;
    
    setGameState(prev => ({
      ...prev,
      playerDirection: (prev.playerDirection + 1) % 4
    }));
  }, [gameState.isExecuting, setGameState]);

  const handleCollectGem = useCallback(() => {
    if (gameState.isExecuting) return;
    
    const { playerPosition, gems, collectedGems } = gameState;
    const gemAtPosition = gems.find(gem => 
      gem.x === playerPosition.x && gem.y === playerPosition.y
    );

    if (gemAtPosition && !collectedGems.some(collected => 
      collected.x === gemAtPosition.x && collected.y === gemAtPosition.y
    )) {
      setGameState(prev => ({
        ...prev,
        collectedGems: [...prev.collectedGems, gemAtPosition]
      }));
    }
  }, [gameState, setGameState]);

  const handleResetGame = useCallback(() => {
    if (onResetGame) {
      onResetGame();
    } else {
      setGameState(prev => ({
        ...prev,
        playerPosition: { x: 0, y: 0 },
        playerDirection: 0,
        gems: generateRandomGems(prev.gridSize, 4), // Generate new random gems
        collectedGems: [],
        isExecuting: false
      }));
    }
  }, [onResetGame, setGameState]);

  const handleExecuteCode = useCallback(() => {
    if (onExecuteCode) {
      onExecuteCode();
    }
  }, [onExecuteCode]);

  const handleStopExecution = useCallback(() => {
    if (onStopExecution) {
      onStopExecution();
    } else {
      setGameState(prev => ({
        ...prev,
        isExecuting: false
      }));
    }
  }, [onStopExecution, setGameState]);

  const handleToggleMapping = useCallback(() => {
    setIsMappingMode(prev => !prev);
  }, []);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!config.isEnabled) return;

    const key = event.key.toLowerCase();
    setLastPressedKey(key);
    
    // Clear the last pressed key after a short delay
    setTimeout(() => setLastPressedKey(undefined), 500);
    
    // Handle mapping mode first
    if (isMappingMode && pendingAction) {
      event.preventDefault();
      
      // Check if the key is already mapped to a different action
      const existingAction = config.mappings[key];
      if (existingAction && existingAction !== pendingAction) {
        // Remove the existing mapping first
        setConfig(prev => {
          const newMappings = { ...prev.mappings };
          delete newMappings[key];
          return {
            ...prev,
            mappings: newMappings
          };
        });
      }
      
      // Add the new mapping
      setConfig(prev => {
        const newMappings = { ...prev.mappings };
        
        // Remove any existing mapping for this action (both default and custom)
        const defaultKey = Object.entries(defaultMappings).find(([_, action]) => action === pendingAction)?.[0];
        if (defaultKey && newMappings[defaultKey] === pendingAction) {
          delete newMappings[defaultKey];
        }
        
        // Remove any other custom mapping for this action
        Object.keys(newMappings).forEach(mappedKey => {
          if (newMappings[mappedKey] === pendingAction) {
            delete newMappings[mappedKey];
          }
        });
        
        // Add the new mapping
        newMappings[key] = pendingAction;
        
        return {
          ...prev,
          mappings: newMappings
        };
      });
      setPendingAction(null);
      setIsMappingMode(false);
      return;
    }
    
    const action = config.mappings[key];

    if (action) {
      event.preventDefault();
      
      // Execute action based on the action type
      switch (action) {
        case 'moveForward':
          if (onAddCommand) {
            onAddCommand('move');
          }
          handleMoveForward();
          break;
        case 'turnLeft':
          if (onAddCommand) {
            onAddCommand('turn-left');
          }
          handleTurnLeft();
          break;
        case 'turnRight':
          if (onAddCommand) {
            onAddCommand('turn-right');
          }
          handleTurnRight();
          break;
        case 'collectGem':
          if (onAddCommand) {
            onAddCommand('collect');
          }
          handleCollectGem();
          break;
        case 'whileLoop':
          if (onAddCommand) {
            onAddCommand('while');
          }
          break;
        case 'ifStatement':
          if (onAddCommand) {
            onAddCommand('if');
          }
          break;
        case 'elseStatement':
          if (onAddCommand) {
            onAddCommand('else');
          }
          break;
        case 'forLoop':
          if (onAddCommand) {
            onAddCommand('for');
          }
          break;
        case 'resetGame':
          handleResetGame();
          break;
        case 'executeCode':
          handleExecuteCode();
          break;
        case 'stopExecution':
          handleStopExecution();
          break;
        case 'toggleMapping':
          handleToggleMapping();
          break;
      }
    }
  }, [config, isMappingMode, pendingAction, handleMoveForward, handleTurnLeft, handleTurnRight, handleCollectGem, handleResetGame, handleExecuteCode, handleStopExecution, handleToggleMapping]);

  // Set up keyboard event listener
  useEffect(() => {
    if (config.isEnabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [config.isEnabled, handleKeyDown]);

  // Mapping functions
  const updateMapping = useCallback((key: string, action: GameAction) => {
    setConfig(prev => ({
      ...prev,
      mappings: {
        ...prev.mappings,
        [key]: action
      }
    }));
  }, []);

  const removeMapping = useCallback((key: string) => {
    setConfig(prev => {
      const newMappings = { ...prev.mappings };
      delete newMappings[key];
      return {
        ...prev,
        mappings: newMappings
      };
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      mappings: { ...defaultMappings }
    }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      isEnabled: !prev.isEnabled
    }));
  }, []);

  const toggleHints = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      showHints: !prev.showHints
    }));
  }, []);

  const startMapping = useCallback((action: GameAction) => {
    setPendingAction(action);
    setIsMappingMode(true);
  }, []);

  const cancelMapping = useCallback(() => {
    setPendingAction(null);
    setIsMappingMode(false);
  }, []);

  return {
    config,
    isMappingMode,
    pendingAction,
    lastPressedKey,
    updateMapping,
    removeMapping,
    resetToDefaults,
    toggleEnabled,
    toggleHints,
    startMapping,
    cancelMapping
  };
}; 