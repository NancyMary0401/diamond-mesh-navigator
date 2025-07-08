import React from "react";
import { Gem } from "lucide-react";

interface TopBarProps {
  gemsLeft: number;
}

const TopBar: React.FC<TopBarProps> = ({ gemsLeft }) => {
  return (
    <header className="w-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-950 px-4 py-2 flex items-center shadow-md border-b border-purple-800/40">
      <div className="flex items-center gap-2">
        <div className="bg-purple-600/30 p-1 rounded-md">
          <Gem className="w-5 h-5 text-purple-300" />
        </div>
        <span className="text-xl font-bold text-white tracking-wide drop-shadow-sm">Code&nbsp;Quest</span>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2 bg-slate-800/50 border border-purple-700/40 px-3 py-1 rounded-full">
        <Gem className="w-4 h-4 text-purple-300" />
        <span className="text-sm font-semibold text-purple-200">{gemsLeft} left</span>
      </div>
    </header>
  );
};

export default TopBar;
