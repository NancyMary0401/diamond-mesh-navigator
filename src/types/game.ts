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
  shadowPosition: Position;
  shadowDirection: number;
}

export interface Command {
  type: 'move' | 'turn' | 'collect' | 'while' | 'if' | 'end';
  direction?: 'forward' | 'left' | 'right';
  condition?: string;
}
