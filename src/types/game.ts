export interface Position {
  x: number;
  y: number;
}

export interface Bullet {
  id: string;
  position: Position;
  direction: number; // 0: up, 1: right, 2: down, 3: left
  shooter: 'player' | 'bot';
  timestamp: number;
}

export interface Bot {
  position: Position;
  direction: number; // 0: up, 1: right, 2: down, 3: left
  collectedGems: Position[];
  isCarryingGem: boolean;
  targetGem: Position | null;
  dropTarget: Position | null;
  state: 'searching' | 'collecting' | 'dropping' | 'returning';
  health: number;
  isAlive: boolean;
}

export interface Player {
  position: Position;
  direction: number;
  health: number;
  isAlive: boolean;
}

export interface GameState {
  player: Player;
  gems: Position[];
  collectedGems: Position[];
  dropZones: Position[]; // Target locations for gems
  score: number;
  isExecuting: boolean;
  gridSize: number;
  dropZoneIndex: number; // Current active drop zone
  bot: Bot;
  bullets: Bullet[]; // Visual bullets for shooting
}

export interface Command {
  type: 'move' | 'turn' | 'collect' | 'while' | 'if' | 'end' | 'fire' | 'reload' | 'switch_weapon';
  direction?: 'forward' | 'left' | 'right';
  condition?: string;
  weaponType?: string;
}
