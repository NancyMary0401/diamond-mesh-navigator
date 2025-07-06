import React, { useState } from 'react';
import { GameAction } from '@/types/game';
import { Badge } from '@/components/ui/badge';
import { Keyboard, ChevronDown, ChevronUp } from 'lucide-react';

interface KeyboardHintsProps {
  mappings: { [key: string]: GameAction };
  isVisible: boolean;
  lastPressedKey?: string;
}

const actionLabels: Record<GameAction, string> = {
  moveForward: 'Add Move',
  turnLeft: 'Add Turn L',
  turnRight: 'Add Turn R',
  collectGem: 'Add Collect',
  whileLoop: 'Add While',
  ifStatement: 'Add If',
  elseStatement: 'Add Else',
  forLoop: 'Add For',
  resetGame: 'Reset',
  executeCode: 'Run Code',
  stopExecution: 'Stop',
  toggleMapping: 'Config'
};

const KeyboardHints: React.FC<KeyboardHintsProps> = ({ mappings, isVisible, lastPressedKey }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!isVisible) return null;

  // Essential shortcuts for compact view
  const essentialKeys = ['m', 'a', 'd', 's', 'r'];
  const essentialMappings = Object.entries(mappings).filter(([key]) => essentialKeys.includes(key));
  const otherMappings = Object.entries(mappings).filter(([key]) => !essentialKeys.includes(key));

  return (
    <div className="fixed top-4 left-4 bg-slate-800/95 backdrop-blur-sm border border-blue-500/30 rounded-lg p-4 shadow-2xl z-50 max-w-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-blue-400" />
          <span className="text-blue-200 text-sm font-medium">Shortcuts</span>
        </div>
        <div className="flex items-center gap-2">
          {lastPressedKey && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/50 text-xs animate-pulse">
              {lastPressedKey.toUpperCase()}
            </Badge>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div className="space-y-1">
        {/* Essential shortcuts always visible */}
        {essentialMappings.map(([key, action]) => (
          <div key={key} className="flex items-center justify-between p-1.5 rounded-md transition-all hover:bg-slate-700/50">
            <span className="text-white text-xs">{actionLabels[action]}</span>
            <Badge 
              variant="secondary" 
              className={`text-blue-200 border-blue-500/50 text-xs px-2 py-0.5 min-w-[1.5rem] justify-center transition-all ${
                lastPressedKey === key ? 'bg-green-500/20 text-green-200 border-green-500/50 scale-110' : 'bg-blue-500/20'
              }`}
            >
              {key.toUpperCase()}
            </Badge>
          </div>
        ))}
        
        {/* Other shortcuts shown when expanded */}
        {isExpanded && (
          <>
            <div className="border-t border-slate-600 my-2"></div>
            {otherMappings.map(([key, action]) => (
              <div key={key} className="flex items-center justify-between p-1.5 rounded-md transition-all hover:bg-slate-700/50">
                <span className="text-white text-xs">{actionLabels[action]}</span>
                <Badge 
                  variant="secondary" 
                  className={`text-blue-200 border-blue-500/50 text-xs px-2 py-0.5 min-w-[1.5rem] justify-center transition-all ${
                    lastPressedKey === key ? 'bg-green-500/20 text-green-200 border-green-500/50 scale-110' : 'bg-blue-500/20'
                  }`}
                >
                  {key.toUpperCase()}
                </Badge>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default KeyboardHints; 