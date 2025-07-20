'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface CategoryItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  count?: number;
  color?: string;
  isCustom?: boolean;
}

export interface CategoryBarProps {
  categories: CategoryItem[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  onCategoriesReorder?: (categories: CategoryItem[]) => void;
  onAddCategory?: () => void;
  onEditCategory?: (categoryId: string) => void;
  isCollapsed?: boolean;
  maxVisible?: number;
  className?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  onCategoriesReorder,
  onAddCategory,
  onEditCategory,
  isCollapsed = false,
  maxVisible = 5,
  className,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  // Determine which categories to show
  const visibleCategories = showAll ? categories : categories.slice(0, maxVisible);
  const hasHiddenCategories = categories.length > maxVisible;

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const handleReorder = (newOrder: CategoryItem[]) => {
    if (onCategoriesReorder) {
      onCategoriesReorder(newOrder);
    }
  };

  if (isCollapsed) {
    return (
      <div className={cn('flex flex-col items-center space-y-2 p-2', className)}>
        {/* Collapsed view - just show icons */}
        {visibleCategories.map((category) => (
          <motion.button
            key={category.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCategoryClick(category.id)}
            className={cn(
              'w-10 h-10 flex items-center justify-center rounded-lg transition-all relative',
              'hover:bg-white/10',
              activeCategory === category.id
                ? 'bg-white/20 text-white shadow-lg'
                : 'text-purple-200 hover:text-white'
            )}
            title={category.name}
          >
            {category.icon}
            {category.count !== undefined && category.count > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {category.count > 9 ? '9+' : category.count}
              </span>
            )}
          </motion.button>
        ))}

        {/* Add button */}
        {onAddCategory && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddCategory}
            className="text-purple-200 hover:text-white hover:bg-white/10"
            title="Add Category"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}

        {/* More button for hidden categories */}
        {hasHiddenCategories && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowAll(!showAll)}
            className="text-purple-200 hover:text-white hover:bg-white/10"
            title="More Categories"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3 p-4 border-t border-purple-500/20', className)}>
      {/* Category List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-purple-200">Categories</h3>
          <div className="flex items-center gap-1">
            {onCategoriesReorder && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsReordering(!isReordering)}
                className={cn(
                  'text-purple-200 hover:text-white hover:bg-white/10',
                  isReordering && 'bg-white/20 text-white'
                )}
                title="Reorder Categories"
              >
                <GripVertical className="w-3 h-3" />
              </Button>
            )}
            {onAddCategory && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onAddCategory}
                className="text-purple-200 hover:text-white hover:bg-white/10"
                title="Add Category"
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isReordering && onCategoriesReorder ? (
            <Reorder.Group
              axis="y"
              values={visibleCategories}
              onReorder={handleReorder}
              className="space-y-1"
            >
              {visibleCategories.map((category) => (
                <Reorder.Item
                  key={category.id}
                  value={category}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing',
                    'bg-white/10 border border-white/20'
                  )}
                >
                  <GripVertical className="w-4 h-4 text-purple-300" />
                  <span className="text-purple-200">{category.icon}</span>
                  <span className="flex-1 text-sm text-white">{category.name}</span>
                  {category.count !== undefined && category.count > 0 && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500 text-white">
                      {category.count}
                    </span>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-1"
            >
              {visibleCategories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.03 }}
                  onClick={() => handleCategoryClick(category.id)}
                  onDoubleClick={() => onEditCategory?.(category.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left',
                    'hover:bg-white/10 group',
                    activeCategory === category.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-purple-200 hover:text-white'
                  )}
                >
                  <span className="flex-shrink-0 text-sm">
                    {category.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium truncate">
                    {category.name}
                  </span>
                  {category.count !== undefined && category.count > 0 && (
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs font-semibold rounded-full transition-colors',
                        activeCategory === category.id
                          ? 'bg-white text-purple-700'
                          : 'bg-purple-500 text-white group-hover:bg-purple-400'
                      )}
                    >
                      {category.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show More/Less Toggle */}
        {hasHiddenCategories && !isReordering && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-purple-200 hover:text-white hover:bg-white/10 transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-sm">
              {showAll ? 'Show Less' : `Show ${categories.length - maxVisible} More`}
            </span>
          </motion.button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-2 border-t border-purple-500/20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-purple-200 hover:text-white hover:bg-white/10 justify-start"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>
    </div>
  );
};