import React from 'react';
import { GameAction } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Keyboard, X, RotateCcw, Edit3, Save } from 'lucide-react';

interface KeyboardMappingConfigProps {
  config: {
    mappings: { [key: string]: GameAction };
    isEnabled: boolean;
    showHints: boolean;
  };
  isMappingMode: boolean;
  pendingAction: GameAction | null;
  onUpdateMapping: (key: string, action: GameAction) => void;
  onRemoveMapping: (key: string) => void;
  onResetToDefaults: () => void;
  onToggleEnabled: () => void;
  onToggleHints: () => void;
  onStartMapping: (action: GameAction) => void;
  onCancelMapping: () => void;
}

const actionLabels: Record<GameAction, string> = {
  moveForward: 'Move Forward',
  turnLeft: 'Turn Left',
  turnRight: 'Turn Right',
  collectGem: 'Collect Gem',
  whileLoop: 'While Loop',
  ifStatement: 'If Statement',
  elseStatement: 'Else Statement',
  resetGame: 'Reset Game',
  executeCode: 'Run Code',
  stopExecution: 'Stop Execution',
  toggleMapping: 'Toggle Mapping'
};

const actionIcons: Record<GameAction, string> = {
  moveForward: '↑',
  turnLeft: '↶',
  turnRight: '↷',
  collectGem: '💎',
  whileLoop: '🔄',
  ifStatement: '❓',
  elseStatement: '➡️',
  resetGame: '🔄',
  executeCode: '▶️',
  stopExecution: '⏹️',
  toggleMapping: '⚙️'
};

// Default key mappings for reference
const defaultMappings: Record<GameAction, string> = {
  moveForward: 'M',
  turnLeft: 'A',
  turnRight: 'D',
  collectGem: 'S',
  whileLoop: 'W',
  ifStatement: 'I',
  elseStatement: 'L',
  resetGame: 'E',
  executeCode: 'R',
  stopExecution: 'Q',
  toggleMapping: 'C'
};

const KeyboardMappingConfig: React.FC<KeyboardMappingConfigProps> = ({
  config,
  isMappingMode,
  pendingAction,
  onUpdateMapping,
  onRemoveMapping,
  onResetToDefaults,
  onToggleEnabled,
  onToggleHints,
  onStartMapping,
  onCancelMapping
}) => {
  const allActions: GameAction[] = [
    'moveForward',
    'turnLeft',
    'turnRight',
    'collectGem',
    'whileLoop',
    'ifStatement',
    'elseStatement',
    'resetGame',
    'executeCode',
    'stopExecution',
    'toggleMapping'
  ];

  const getKeyForAction = (action: GameAction): string | undefined => {
    return Object.entries(config.mappings).find(([_, mappedAction]) => mappedAction === action)?.[0];
  };

  const getActionForKey = (key: string): GameAction | undefined => {
    return config.mappings[key];
  };

  return (
    <Card className="w-full bg-slate-800/50 border-purple-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-purple-400" />
            Keyboard Controls
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-purple-200 text-sm">Enable</span>
              <Switch
                checked={config.isEnabled}
                onCheckedChange={onToggleEnabled}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-200 text-sm">Hints</span>
              <Switch
                checked={config.showHints}
                onCheckedChange={onToggleHints}
                className="data-[state=checked]:bg-purple-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToDefaults}
              className="h-7 px-2 text-xs border-purple-500/50 text-black hover:bg-purple-500/20"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset to Defaults
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Mapping Mode Indicator */}
        {isMappingMode && (
          <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-yellow-200">
              <Settings className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Press any key to map: {pendingAction && actionLabels[pendingAction]}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelMapping}
                className="h-6 w-6 p-0 text-yellow-200 hover:text-yellow-100"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="mt-2 text-xs text-yellow-300">
              💡 If you press a key that's already mapped, it will be reassigned to this action
            </div>
          </div>
        )}

        {/* Key Mappings Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {allActions.map((action) => {
            const mappedKey = getKeyForAction(action);
            const defaultKey = defaultMappings[action];
            
            return (
              <div
                key={action}
                className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-lg flex-shrink-0">{actionIcons[action]}</span>
                  <div className="min-w-0">
                    <div className="text-white text-sm font-medium truncate">{actionLabels[action]}</div>
                    <div className="text-slate-400 text-xs">Default: {defaultKey}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-shrink-0">
                  {mappedKey ? (
                    <>
                      <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/50 font-mono">
                        {mappedKey.toUpperCase()}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveMapping(mappedKey)}
                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        title="Remove mapping"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 border-slate-600 font-mono">
                      {defaultKey}
                    </Badge>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStartMapping(action)}
                    disabled={isMappingMode}
                    className="h-6 px-2 text-xs border-blue-500/50 text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
                    title="Customize key"
                  >
                    <Edit3 className="w-3 h-3 text-black" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Reference (when hints are enabled) */}
        {config.showHints && config.isEnabled && Object.keys(config.mappings).length > 0 && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <h4 className="text-purple-200 text-sm font-medium mb-2 flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Active Keyboard Shortcuts
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 text-xs">
              {Object.entries(config.mappings).map(([key, action]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-slate-600/30 rounded border border-slate-500/30">
                  <span className="text-slate-300 font-mono font-bold">{key.toUpperCase()}</span>
                  <span className="text-purple-200 truncate">{actionLabels[action]}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KeyboardMappingConfig; 