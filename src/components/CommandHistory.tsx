import React, { useEffect, useRef } from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hand, Package, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Command {
  id: string;
  type: 'move' | 'collect' | 'drop' | 'shoot';
  direction?: 'up' | 'down' | 'left' | 'right';
  timestamp: number;
  scoreChange?: number;
  blocked?: boolean;
  zoneProgress?: string;
  hit?: boolean;
  target?: string;
}

interface CommandHistoryProps {
  commands: Command[];
  onClearHistory: () => void;
}

const CommandHistory: React.FC<CommandHistoryProps> = ({ commands, onClearHistory }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new commands are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [commands]);

  const getCommandIcon = (command: Command) => {
    switch (command.type) {
      case 'move':
        switch (command.direction) {
          case 'up': return <ArrowUp className="w-4 h-4 text-blue-400" />;
          case 'down': return <ArrowDown className="w-4 h-4 text-blue-400" />;
          case 'left': return <ArrowLeft className="w-4 h-4 text-blue-400" />;
          case 'right': return <ArrowRight className="w-4 h-4 text-blue-400" />;
          default: return <ArrowUp className="w-4 h-4 text-blue-400" />;
        }
      case 'collect': return <Hand className="w-4 h-4 text-purple-400" />;
      case 'drop': return <Package className="w-4 h-4 text-orange-400" />;
      case 'shoot': return <Zap className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getCommandText = (command: Command) => {
    switch (command.type) {
      case 'move':
        return `Move ${command.direction}`;
      case 'collect':
        return command.blocked ? 'Collect Gem ❌ (Already carrying)' : 'Collect Gem';
      case 'drop':
        if (command.scoreChange && command.scoreChange > 0) {
          return command.zoneProgress ? `Drop Gem ✅ ${command.zoneProgress}` : 'Drop Gem ✅';
        }
        return command.scoreChange ? `Drop Gem ❌` : 'Drop Gem';
      case 'shoot':
        if (command.hit) {
          return `Shoot ${command.target} ✅ Hit!`;
        }
        return 'Shoot ❌ Miss';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card className="bg-slate-800/50 border-purple-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <CardTitle className="text-white text-sm font-medium">Live Commands</CardTitle>
            {commands.length > 0 && (
              <div className="flex items-center gap-1 bg-purple-500/20 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 text-purple-300" />
                <span className="text-purple-300 text-xs">{commands.length}</span>
              </div>
            )}
          </div>
          {commands.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-xs text-purple-300 hover:text-purple-200 transition-colors bg-purple-500/10 px-2 py-1 rounded hover:bg-purple-500/20"
            >
              Clear
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div ref={scrollRef} className="space-y-2 max-h-80 overflow-y-auto scroll-smooth">
          {commands.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-purple-300 text-sm font-medium">Ready for Commands!</p>
              <p className="text-purple-400 text-xs mt-1">Use keyboard to start playing</p>
            </div>
          ) : (
            commands.slice(-15).map((command, index) => (
              <div
                key={command.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 transform
                  ${index === commands.slice(-15).length - 1 ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-400/50 scale-105' : 'bg-slate-700/30 border-purple-500/20 hover:bg-slate-700/50'}
                  ${command.scoreChange ? 'animate-pulse' : ''}
                `}
              >
                <div className={`
                  p-1 rounded-full
                  ${index === commands.slice(-15).length - 1 ? 'bg-purple-500/30' : 'bg-slate-600/50'}
                  ${command.blocked ? 'bg-red-500/30' : ''}
                `}>
                  {getCommandIcon(command)}
                </div>
                <span className={`text-sm font-mono flex-1 ${command.blocked ? 'text-red-300' : 'text-white'}`}>
                  {getCommandText(command)}
                  {index === commands.slice(-15).length - 1 && (
                    <span className="ml-2 text-xs text-purple-400 animate-pulse">● LIVE</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {command.scoreChange && (
                    <span className={`
                      text-xs font-bold px-2 py-1 rounded-full
                      ${command.scoreChange > 0 ? 'text-green-400 bg-green-500/20' : 'text-red-400 bg-red-500/20'}
                    `}>
                      {command.scoreChange > 0 ? '+' : ''}{command.scoreChange}
                    </span>
                  )}
                  <span className="text-purple-400 text-xs bg-slate-600/50 px-2 py-1 rounded">
                    {new Date(command.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommandHistory; 