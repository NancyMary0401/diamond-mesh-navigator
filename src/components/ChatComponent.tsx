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
    const promptWithSchema = `You are a multilingual direction-classifier.\n\nTask: Detect whether the USER\'s message (which can be in **any language or contain synonyms**) refers to one of the four cardinal directions:\n  • front\n  • back\n  • right\n  • left\nIf no clear reference is found, classify as **unknown**.\n\nGuidelines:\n1. First translate or interpret the message into English if necessary (Gemini can auto-detect language).\n2. Consider common synonyms and translations, e.g. Tamil: munale → front, pinnadi → back, idathu → left, valathu → right. You do NOT need to list these in the reply; they are examples to aid reasoning.\n3. Only output a single line of **valid JSON** with the exact schema:\n   {\"direction\":\"<front|back|right|left|unknown>\"}\n\nMessage: \"${prompt}\"`;

    console.log('Gemini prompt:', promptWithSchema);
    const result = await model.generateContent(promptWithSchema);
    const text = result.response.text().trim();

    // Attempt to extract JSON from the Gemini reply which might be wrapped in a markdown block
    let jsonPart: string | null = null;
    // First try direct parse
    try {
      const direct = JSON.parse(text);
      jsonPart = JSON.stringify(direct);
    } catch (_) {
      // Fallback: extract first {...} block using regex
      const match = text.match(/\{[\s\S]*?\}/);
      if (match) jsonPart = match[0];
    }

    if (jsonPart) {
      try {
        const obj = JSON.parse(jsonPart);
        if (obj && typeof obj.direction === 'string') {
          const dir = obj.direction.toLowerCase();
          switch (dir) {
            case 'front':
              return 'The character is moving forward.';
            case 'back':
              return 'The character is moving back.';
            case 'left':
              return 'The character moved left.';
            case 'right':
              return 'The character moved right.';
            case 'unknown':
            default:
              return 'Provide a proper direction.';
          }
        }
      } catch (_) {
        // fall through to return raw text below
      }
    }

    return text;
  } catch (err) {
    console.error('Gemini error', err);
    return 'Error contacting Gemini.';
  }
}

interface ChatComponentProps {
  floating?: boolean; // render as floating window if true
  gameState: any;
  setGameState: (fn: (prev: any) => any) => void;
  addMoveForwardBlock?: () => void;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ floating = true, gameState, setGameState, addMoveForwardBlock }) => {
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
            }
            // Call addMoveForwardBlock if moving forward
            if (direction === 'front' && addMoveForwardBlock) {
              addMoveForwardBlock();
            }
            return {
              ...prev,
              shadowPosition: newPosition,
              shadowDirection: newDirection,
            };
          });
        }
      }
    })();
  };

  return (
    <div
      style={floating ? { transform: `translate3d(${pos.x}px, ${pos.y}px,0)` } : undefined}
      className={`${floating ? 'fixed top-6 right-6 z-50 w-80 h-64' : 'mt-8 w-full max-w-lg'} p-3 bg-slate-800/50 backdrop-blur-md rounded-2xl shadow-xl border border-slate-700/40 flex flex-col`}>
      
      <div onPointerDown={floating ? startDrag : undefined} className="cursor-move select-none mb-3">
        <h2 className="text-lg font-semibold text-white">Chat</h2>
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-900/50 p-3 rounded-md text-sm mb-4 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`max-w-[80%] px-3 py-2 rounded-lg ${
              msg.sender === 'user'
                ? 'ml-auto bg-purple-600 text-white'
                : 'mr-auto bg-slate-700 text-slate-100'
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 rounded-md bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
