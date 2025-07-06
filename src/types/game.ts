export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  playerPosition: Position;
  playerDirection: number; // 0: up, 1: right, 2: down, 3: left
  gems: Position[];
  collectedGems: Position[];
  isExecuting: boolean;
  gridSize: number;
}

export interface Command {
  type: 'move' | 'turn' | 'collect' | 'while' | 'if' | 'else' | 'for' | 'end';
  direction?: 'forward' | 'left' | 'right';
  condition?: string;
  iterations?: number;
}

// Keyboard mapping types
export type GameAction = 
  | 'moveForward' 
  | 'turnLeft' 
  | 'turnRight' 
  | 'collectGem' 
  | 'resetGame' 
  | 'executeCode' 
  | 'stopExecution' 
  | 'toggleMapping'
  | 'whileLoop'
  | 'ifStatement'
  | 'elseStatement'
  | 'forLoop';

export interface KeyMapping {
  [key: string]: GameAction;
}

export interface KeyboardMappingConfig {
  mappings: KeyMapping;
  isEnabled: boolean;
  showHints: boolean;
}
