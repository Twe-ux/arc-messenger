'use client';

import { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Trash2, Mail } from 'lucide-react';
import { Correspondent } from '@/contexts/MessageContext';

interface SwipeableCorrespondentItemProps {
  correspondent: Correspondent;
  onCorrespondentClick: (correspondent: Correspondent) => void;
  onDelete: (correspondent: Correspondent) => void;
}

export function SwipeableCorrespondentItem({
  correspondent,
  onCorrespondentClick,
  onDelete,
}: SwipeableCorrespondentItemProps) {
  const [dragX, setDragX] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  
  // Swipe thresholds
  const SHOW_DELETE_THRESHOLD = -60;
  const DELETE_THRESHOLD = -100;

  const handleDrag = (event: any, info: PanInfo) => {
    const newX = info.offset.x;
    setDragX(newX);
    
    // Show delete button when swiped enough to the left
    if (newX < SHOW_DELETE_THRESHOLD) {
      setShowDelete(true);
    } else {
      setShowDelete(false);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    const finalX = info.offset.x;
    
    if (finalX < DELETE_THRESHOLD) {
      // User swiped far enough - show delete confirmation
      handleDelete();
      // Reset position
      setDragX(0);
      setShowDelete(false);
    } else if (finalX < SHOW_DELETE_THRESHOLD) {
      // Stay in delete-visible position
      setDragX(SHOW_DELETE_THRESHOLD);
      setShowDelete(true);
    } else {
      // Snap back to original position
      setDragX(0);
      setShowDelete(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer toutes les conversations avec ${correspondent.name} ? Cette action est irréversible.`)) {
      try {
        await onDelete(correspondent);
      } catch (error) {
        console.error('Error deleting correspondent:', error);
        alert('Erreur lors de la suppression. Veuillez réessayer.');
      }
    }
    // Reset position regardless of confirmation result
    setDragX(0);
    setShowDelete(false);
  };

  const handleItemClick = () => {
    if (!showDelete) {
      onCorrespondentClick(correspondent);
    }
  };

  return (
    <div 
      className="relative overflow-hidden"
      style={{ height: '4rem', marginBottom: '0.5rem' }}
    >
      {/* Delete button background */}
      {showDelete && (
        <div className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 text-white w-24">
          <button
            onClick={handleDelete}
            className="flex h-full w-full items-center justify-center gap-1 text-sm font-medium hover:bg-red-600 transition-colors"
          >
            <Trash2 size={14} />
            <span className="text-xs">Suppr.</span>
          </button>
        </div>
      )}

      {/* Main correspondent item */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ x: dragX }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 bg-white relative ${
          correspondent.unreadCount > 0
            ? 'border-red-500 bg-red-50 shadow-md'
            : 'border-purple-200 bg-purple-50 hover:bg-purple-100'
        }`}
        onClick={handleItemClick}
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          touchAction: 'pan-x', // Allow horizontal panning
        }}
      >
        <div className="flex items-center gap-3 w-full pointer-events-none">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 text-white text-sm font-semibold">
              {correspondent.name.charAt(0).toUpperCase()}
            </div>
            {correspondent.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold animate-pulse">
                {correspondent.unreadCount > 9 ? '9+' : correspondent.unreadCount}
              </span>
            )}
            <Mail className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-purple-600 bg-white rounded-full p-0.5" />
          </div>
          
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center justify-between">
              <span
                className={`truncate text-sm font-medium ${
                  correspondent.unreadCount > 0
                    ? 'text-gray-900 font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {correspondent.name}
              </span>
              <span className="text-xs text-gray-500">
                {correspondent.lastMessage.time}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <p className={`truncate text-xs ${
                correspondent.unreadCount > 0 ? 'text-gray-800' : 'text-gray-500'
              }`}>
                {correspondent.lastMessage.preview || correspondent.lastMessage.subject || 'Aucun aperçu'}
              </p>
              <span className="ml-2 text-xs text-gray-400 flex-shrink-0">
                {correspondent.messageCount} msg
              </span>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Visual indicator for swipe */}
      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-purple-300 to-transparent opacity-30 pointer-events-none" />
      
    </div>
  );
}