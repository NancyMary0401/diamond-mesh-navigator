import React, { useState, useEffect, useRef, FormEvent, useCallback } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

// Initialize Gemini once
const genAIInstance = (() => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  return apiKey ? new GoogleGenerativeAI(apiKey) : null;
})();

async function fetchGeminiResponse(prompt: string): Promise<string> {
  if (!genAIInstance) return 'Gemini API key missing.';
  try {
    const model = genAIInstance.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const promptText = `You are a multilingual direction-classifier.

Task: Detect whether the USER's message refers to one of the four cardinal directions: front, back, right, left. If no clear reference is found, classify as unknown.

Return ONLY a valid JSON object with this exact format:
{"direction":"front|back|left|right|unknown"}

Message: "${prompt}"`;

    const result = await model.generateContent(promptText);
    const text = result.response.text().trim();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed && typeof parsed.direction === 'string') {
          const dir = parsed.direction.toLowerCase();
          switch (dir) {
            case 'front':
              return 'The character is moving forward.';
            case 'back':
              return 'The character is moving back.';
            case 'left':
              return 'The character turned left.';
            case 'right':
              return 'The character turned right.';
            case 'unknown':
            default:
              return 'Provide a proper direction.';
          }
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
      }
    }

    return 'Please provide a clear direction command.';
  } catch (err) {
    console.error('Gemini API error:', err);
    return 'Error contacting Gemini.';
  }
}

interface ChatComponentProps {
  floating?: boolean; // render as floating window if true
  gameState: any;
  setGameState: (fn: (prev: any) => any) => void;
  addMoveForwardBlock?: () => void;
  addMoveBackwardBlock?: () => void;
  addTurnLeftBlock?: () => void;
  addTurnRightBlock?: () => void;
  addJumpBlock?: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ floating = true, gameState, setGameState, addMoveForwardBlock, addMoveBackwardBlock, addTurnLeftBlock, addTurnRightBlock, addJumpBlock }) => {
  // position for draggable window when floating
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragStart.current) return;
    setPos(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY,
    }));
  }, []);

  const stopDrag = useCallback(() => {
    dragStart.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', stopDrag);
  }, [handlePointerMove]);

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    dragStart.current = { x: e.clientX, y: e.clientY };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDrag);
  };

  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Type here to control your character! For example, say "move forward" or "turn left".' },
    { sender: 'bot', text: 'Welcome to the chat!' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Fetch Gemini response
    (async () => {
      const botReply = await fetchGeminiResponse(userMsg.text);
      const botMsg: Message = { sender: 'bot', text: botReply };
      setMessages(prev => [...prev, botMsg]);

      // Movement logic
      if (setGameState && typeof botReply === 'string') {
        let direction = '';
        if (botReply.includes('forward')) direction = 'front';
        else if (botReply.includes('back')) direction = 'back';
        else if (botReply.includes('left')) direction = 'left';
        else if (botReply.includes('right')) direction = 'right';
        else if (botReply.toLowerCase().includes('jump')) direction = 'jump';
        if (direction) {
          setGameState((prev: any) => {
            let { shadowPosition, shadowDirection, gridSize } = prev;
            let newDirection = shadowDirection;
            let newPosition = { ...shadowPosition };
            if (direction === 'left') {
              newDirection = (shadowDirection + 3) % 4;
            } else if (direction === 'right') {
              newDirection = (shadowDirection + 1) % 4;
            } else if (direction === 'front') {
              if (shadowDirection === 0 && shadowPosition.y > 0) newPosition.y -= 1;
              if (shadowDirection === 1 && shadowPosition.x < gridSize - 1) newPosition.x += 1;
              if (shadowDirection === 2 && shadowPosition.y < gridSize - 1) newPosition.y += 1;
              if (shadowDirection === 3 && shadowPosition.x > 0) newPosition.x -= 1;
            } else if (direction === 'back') {
              if (shadowDirection === 0 && shadowPosition.y < gridSize - 1) newPosition.y += 1;
              if (shadowDirection === 1 && shadowPosition.x > 0) newPosition.x -= 1;
              if (shadowDirection === 2 && shadowPosition.y > 0) newPosition.y -= 1;
              if (shadowDirection === 3 && shadowPosition.x < gridSize - 1) newPosition.x += 1;
            } else if (direction === 'jump') {
              // Example: jump two cells forward if possible
              if (shadowDirection === 0 && shadowPosition.y > 1) newPosition.y -= 2;
              if (shadowDirection === 1 && shadowPosition.x < gridSize - 2) newPosition.x += 2;
              if (shadowDirection === 2 && shadowPosition.y < gridSize - 2) newPosition.y += 2;
              if (shadowDirection === 3 && shadowPosition.x > 1) newPosition.x -= 2;
            }
            return {
              ...prev,
              shadowPosition: newPosition,
              shadowDirection: newDirection,
            };
          });
          // Add corresponding block to CodeBlockEditor
          if (direction === 'front' && addMoveForwardBlock) {
            addMoveForwardBlock();
          } else if (direction === 'back' && addMoveBackwardBlock) {
            addMoveBackwardBlock();
          } else if (direction === 'left' && addTurnLeftBlock) {
            addTurnLeftBlock();
          } else if (direction === 'right' && addTurnRightBlock) {
            addTurnRightBlock();
          } else if (direction === 'jump' && addJumpBlock) {
            addJumpBlock();
          }
        }
      }
    })();
  };

  return (
    <div
      style={floating ? { transform: `translate3d(${pos.x}px, ${pos.y}px,0)` } : undefined}
      className={`w-full h-full flex flex-col bg-slate-950/90 rounded-2xl border-2 border-blue-700/60 shadow-[0_0_32px_0_rgba(56,189,248,0.15)] overflow-hidden ${floating ? 'fixed top-6 right-6 z-50 max-w-md max-h-[90vh]' : ''}`}
    >
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md transition-all
              ${msg.sender === 'user'
                ? 'ml-auto bg-blue-700/80 text-white border-2 border-blue-400/60 drop-shadow-glow'
                : 'mr-auto bg-slate-800/80 text-blue-100 border border-blue-700/30'}
            `}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Input area */}
      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-blue-800/30 bg-slate-900/80 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-3 rounded-xl bg-slate-800 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-700/40 shadow-inner transition-all"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-xl bg-blue-700 text-white font-bold shadow-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-400 border-2 border-blue-400/60 transition-all"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
