import React from 'react';
import { motion } from 'framer-motion';
import { BotIcon, CopyIcon } from './IconComponents';

interface Message {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isModel = message.role === 'model';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (err) {
      console.error('Failed to copy message', err);
    }
  };

  return (
    <motion.div
      className={`flex items-start gap-3 ${isModel ? '' : 'flex-row-reverse'}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {isModel ? (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center shadow">
          <BotIcon className="h-5 w-5" />
        </div>
      ) : (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-200 text-text-primary flex items-center justify-center font-semibold">
          U
        </div>
      )}
      <div className="relative max-w-md md:max-w-lg lg:max-w-xl">
        <div
          className={`px-4 py-3 rounded-2xl text-sm ${isModel ? 'bg-white border border-gray-200 text-text-primary shadow' : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'}`}
          role="article"
          aria-label={isModel ? 'Agent response' : 'Your message'}
          aria-live={isModel ? 'polite' : undefined}
        >
          {isLoading ? (
            <div className="flex items-center space-x-1">
              <motion.span className="h-2 w-2 bg-gray-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0 }} />
              <motion.span className="h-2 w-2 bg-gray-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.15 }} />
              <motion.span className="h-2 w-2 bg-gray-500 rounded-full" animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, delay: 0.3 }} />
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        <div className={`absolute -bottom-4 ${isModel ? 'left-0' : 'right-0'} flex items-center gap-2 text-xs opacity-80`}>
          {message.timestamp && <span className="text-text-secondary">{message.timestamp}</span>}
          <button onClick={handleCopy} aria-label="Copy message" className="p-1 rounded hover:bg-gray-100">
            <CopyIcon className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
