'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Mic,
  X,
  Image,
  File,
  Camera,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image' | 'file' | 'voice') => void;
  onFileUpload?: (file: File) => void;
  onStartVoiceRecording?: () => void;
  onStopVoiceRecording?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isRecording?: boolean;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  onCancelReply?: () => void;
  className?: string;
}

const commonEmojis = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋',
  '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳',
  '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖',
  '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
  '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
  '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
  '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴',
  '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿',
  '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖',
  '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👍',
  '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈',
  '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖',
  '👏', '🙌', '🤝', '👐', '🤲', '🙏', '💪', '🦾', '🦿', '🦵'
];

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onFileUpload,
  onStartVoiceRecording,
  onStopVoiceRecording,
  placeholder = "Type a message...",
  disabled = false,
  isRecording = false,
  replyTo,
  onCancelReply,
  className,
}) => {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    setShowAttachmentMenu(false);
    // Reset input
    e.target.value = '';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileUpload) {
      onFileUpload(file);
    }
    setShowAttachmentMenu(false);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Reply context */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-gray-50 border-b border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Replying to {replyTo.senderName}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {replyTo.content}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancelReply}
                className="w-8 h-8 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input area */}
      <div className="flex items-end gap-2 p-4 bg-white border-t border-gray-200">
        {/* Attachment button */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            className="w-10 h-10 text-gray-500 hover:text-gray-700"
            disabled={disabled}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Attachment menu */}
          <AnimatePresence>
            {showAttachmentMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border py-2 z-10 min-w-[160px]"
              >
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Image className="w-4 h-4 text-blue-500" />
                  <span>Photo</span>
                </button>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <File className="w-4 h-4 text-green-500" />
                  <span>Document</span>
                </button>

                <button
                  onClick={() => {/* Camera functionality */}}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Camera className="w-4 h-4 text-red-500" />
                  <span>Camera</span>
                </button>

                <button
                  onClick={() => {/* Video functionality */}}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-3"
                >
                  <Video className="w-4 h-4 text-purple-500" />
                  <span>Video</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden file inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="*/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              'w-full resize-none rounded-full border border-gray-300 px-4 py-2 pr-12',
              'focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20',
              'placeholder:text-gray-500 text-sm',
              'max-h-[120px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300'
            )}
          />

          {/* Emoji button */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="w-8 h-8 text-gray-500 hover:text-gray-700"
              disabled={disabled}
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>

          {/* Emoji picker */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute bottom-12 right-0 bg-white rounded-lg shadow-lg border p-4 z-10 w-80 max-h-60 overflow-y-auto"
              >
                <div className="grid grid-cols-10 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Voice recording or Send button */}
        {message.trim() ? (
          <Button
            onClick={handleSend}
            disabled={disabled}
            className="w-10 h-10 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onMouseDown={onStartVoiceRecording}
            onMouseUp={onStopVoiceRecording}
            onMouseLeave={onStopVoiceRecording}
            className={cn(
              'w-10 h-10 text-gray-500 hover:text-gray-700',
              isRecording && 'bg-red-500 text-white hover:bg-red-600'
            )}
            disabled={disabled}
          >
            <Mic className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2 bg-red-50 border-t border-red-200"
          >
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-700">Recording voice message...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};