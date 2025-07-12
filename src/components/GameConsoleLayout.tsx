import React from "react";
import GameBoard from "./GameBoard";
import CodeBlockEditor from "./CodeBlockEditor";
import ChatComponent from "./ChatComponent";
import type { Block } from "./CodeBlockEditor";
import type { GameState } from "@/types/game";
import { motion } from "motion/react";

interface GameConsoleLayoutProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  blocks: Block[];
  setBlocks: React.Dispatch<React.SetStateAction<Block[]>>;
  addMoveForwardBlock: () => void;
  addMoveBackwardBlock: () => void;
  addTurnLeftBlock: () => void;
  addTurnRightBlock: () => void;
  addJumpBlock: () => void;
}

const GameConsoleLayout: React.FC<GameConsoleLayoutProps> = ({
  gameState,
  setGameState,
  blocks,
  setBlocks,
  addMoveForwardBlock,
  addMoveBackwardBlock,
  addTurnLeftBlock,
  addTurnRightBlock,
  addJumpBlock,
}) => {
  return (
    <motion.div 
      className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl"
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2],
            x: [0, -40, 0],
            y: [0, 20, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-16 h-16 bg-cyan-500/5 rounded-full blur-xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.4, 0.1],
            rotate: [0, 180, 360]
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "linear"
          }}
        />
      </div>

      <div className="w-full h-screen grid grid-cols-1 md:grid-cols-2 gap-0 max-w-[1800px] relative z-10">
        {/* Left: Game grid */}
        <motion.div 
          className="flex items-center justify-center p-6 md:p-10"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div 
            className="w-full h-full max-w-2xl max-h-[90vh] bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-2xl flex items-center justify-center"
            whileHover={{ 
              scale: 1.02,
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              borderColor: 'rgba(148, 163, 184, 0.8)'
            }}
            transition={{ duration: 0.3 }}
          >
            <GameBoard gameState={gameState} setGameState={setGameState} />
          </motion.div>
        </motion.div>
        
        {/* Right: Controls and Chat */}
        <motion.div 
          className="flex flex-col h-full p-4 md:p-8 gap-6"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <motion.div 
            className="flex-1 bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-xl overflow-hidden flex flex-col"
            whileHover={{ 
              scale: 1.01,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              borderColor: 'rgba(148, 163, 184, 0.8)'
            }}
            transition={{ duration: 0.3 }}
          >
            <CodeBlockEditor 
              gameState={gameState} 
              setGameState={setGameState} 
              blocks={blocks} 
              setBlocks={setBlocks} 
            />
          </motion.div>
          
          <motion.div 
            className="h-[320px] bg-slate-900 rounded-3xl border-4 border-slate-700 shadow-xl overflow-hidden flex flex-col"
            whileHover={{ 
              scale: 1.01,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              borderColor: 'rgba(148, 163, 184, 0.8)'
            }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ChatComponent 
              floating={false} 
              gameState={gameState} 
              setGameState={setGameState} 
              addMoveForwardBlock={addMoveForwardBlock} 
              addMoveBackwardBlock={addMoveBackwardBlock}
              addTurnLeftBlock={addTurnLeftBlock}
              addTurnRightBlock={addTurnRightBlock}
              addJumpBlock={addJumpBlock}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default GameConsoleLayout; 