import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  activeCategory: string;
  
  // Theme and appearance
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  
  // Layout preferences
  splitViewEnabled: boolean;
  splitViewRatio: number;
  compactMode: boolean;
  
  // Notifications and toasts
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  
  // Search and filters
  searchQuery: string;
  activeFilters: string[];
  
  // Modal and overlay state
  activeModal: string | null;
  modalData: any;
}

export interface UIActions {
  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setActiveCategory: (category: string) => void;
  
  // Theme actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  
  // Layout actions
  toggleSplitView: () => void;
  setSplitViewRatio: (ratio: number) => void;
  toggleCompactMode: () => void;
  
  // Notification actions
  toggleNotifications: () => void;
  toggleSound: () => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  addFilter: (filter: string) => void;
  removeFilter: (filter: string) => void;
  clearFilters: () => void;
  
  // Modal actions
  openModal: (modalId: string, data?: any) => void;
  closeModal: () => void;
  
  // Reset actions
  resetUI: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  // Sidebar
  sidebarCollapsed: false,
  sidebarWidth: 320,
  activeCategory: 'inbox',
  
  // Theme
  theme: 'system',
  accentColor: '#A855F7', // Purple-500
  
  // Layout
  splitViewEnabled: false,
  splitViewRatio: 0.5,
  compactMode: false,
  
  // Notifications
  notificationsEnabled: true,
  soundEnabled: true,
  
  // Search
  searchQuery: '',
  activeFilters: [],
  
  // Modals
  activeModal: null,
  modalData: null,
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      setSidebarWidth: (width) => set({ 
        sidebarWidth: Math.max(280, Math.min(400, width)) 
      }),
      
      setActiveCategory: (category) => set({ activeCategory: category }),

      // Theme actions
      setTheme: (theme) => set({ theme }),
      
      setAccentColor: (color) => set({ accentColor: color }),

      // Layout actions
      toggleSplitView: () => set((state) => ({ 
        splitViewEnabled: !state.splitViewEnabled 
      })),
      
      setSplitViewRatio: (ratio) => set({ 
        splitViewRatio: Math.max(0.2, Math.min(0.8, ratio)) 
      }),
      
      toggleCompactMode: () => set((state) => ({ 
        compactMode: !state.compactMode 
      })),

      // Notification actions
      toggleNotifications: () => set((state) => ({ 
        notificationsEnabled: !state.notificationsEnabled 
      })),
      
      toggleSound: () => set((state) => ({ 
        soundEnabled: !state.soundEnabled 
      })),

      // Search actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      addFilter: (filter) => set((state) => ({
        activeFilters: state.activeFilters.includes(filter) 
          ? state.activeFilters 
          : [...state.activeFilters, filter]
      })),
      
      removeFilter: (filter) => set((state) => ({
        activeFilters: state.activeFilters.filter(f => f !== filter)
      })),
      
      clearFilters: () => set({ activeFilters: [] }),

      // Modal actions
      openModal: (modalId, data = null) => set({ 
        activeModal: modalId, 
        modalData: data 
      }),
      
      closeModal: () => set({ 
        activeModal: null, 
        modalData: null 
      }),

      // Reset
      resetUI: () => set(initialState),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarWidth: state.sidebarWidth,
        activeCategory: state.activeCategory,
        theme: state.theme,
        accentColor: state.accentColor,
        splitViewEnabled: state.splitViewEnabled,
        splitViewRatio: state.splitViewRatio,
        compactMode: state.compactMode,
        notificationsEnabled: state.notificationsEnabled,
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

// Computed selectors
export const useIsSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useActiveCategory = () => useUIStore((state) => state.activeCategory);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSearchQuery = () => useUIStore((state) => state.searchQuery);
export const useActiveModal = () => useUIStore((state) => state.activeModal);
export const useModalData = () => useUIStore((state) => state.modalData);

// Combined selectors
export const useSidebarState = () => useUIStore((state) => ({
  collapsed: state.sidebarCollapsed,
  width: state.sidebarWidth,
  activeCategory: state.activeCategory,
}));

export const useLayoutState = () => useUIStore((state) => ({
  splitViewEnabled: state.splitViewEnabled,
  splitViewRatio: state.splitViewRatio,
  compactMode: state.compactMode,
}));

export const useNotificationState = () => useUIStore((state) => ({
  notificationsEnabled: state.notificationsEnabled,
  soundEnabled: state.soundEnabled,
}));