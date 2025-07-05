import React from 'react';
import { GameAction } from '@/types/game';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Keyboard, X, RotateCcw } from 'lucide-react';

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
  moveForward: 'Add Move Command',
  turnLeft: 'Add Turn Left',
  turnRight: 'Add Turn Right',
  collectGem: 'Add Collect Command',
  whileLoop: 'Add While Loop',
  ifStatement: 'Add If Statement',
  elseStatement: 'Add Else Statement',
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

  return (
    <Card className="w-full max-w-md bg-slate-800/50 border-purple-500/30">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-white">
          <Keyboard className="w-5 h-5 text-purple-400" />
          Keyboard Controls
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-purple-200 text-sm">Enable Keyboard Controls</span>
          <Switch
            checked={config.isEnabled}
            onCheckedChange={onToggleEnabled}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>

        {/* Show Hints Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-purple-200 text-sm">Show Key Hints</span>
          <Switch
            checked={config.showHints}
            onCheckedChange={onToggleHints}
            className="data-[state=checked]:bg-purple-500"
          />
        </div>

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
          </div>
        )}

        {/* Current Mappings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-purple-200 text-sm font-medium">Current Mappings</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onResetToDefaults}
              className="h-7 px-2 text-xs border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allActions.map((action) => {
              const mappedKey = getKeyForAction(action);
              
              return (
                <div
                  key={action}
                  className="flex items-center justify-between p-2 bg-slate-700/50 rounded-lg border border-slate-600/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{actionIcons[action]}</span>
                    <span className="text-white text-sm">{actionLabels[action]}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {mappedKey ? (
                      <>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-500/50">
                          {mappedKey.toUpperCase()}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveMapping(mappedKey)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-slate-400 border-slate-600">
                        Unmapped
                      </Badge>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartMapping(action)}
                      disabled={isMappingMode}
                      className="h-6 px-2 text-xs border-blue-500/50 text-blue-200 hover:bg-blue-500/20 disabled:opacity-50"
                    >
                      Map
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Hints (when enabled) */}
        {config.showHints && config.isEnabled && (
          <div className="mt-4 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
            <h4 className="text-purple-200 text-sm font-medium mb-2">Quick Reference</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(config.mappings).map(([key, action]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-slate-300">{key.toUpperCase()}</span>
                  <span className="text-purple-200">{actionLabels[action]}</span>
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