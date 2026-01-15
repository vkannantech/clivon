import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { BrowserFrame } from './components/BrowserFrame';
import { Play, Plus, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FloatingDock } from './components/FloatingDock';
import { useShortcuts } from './hooks/useShortcuts';

// Helper utility for classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type Tab = {
  id: string;
  title: string;
  url: string;
};

function App() {
  const [activeView, setActiveView] = useState<'home' | 'settings'>('home');
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Home', url: 'https://www.youtube.com' }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  // State for toggling "Zen Mode" (Fullscreen) vs "Shell Mode"
  const [zenMode, setZenMode] = useState(true);

  const addTab = () => {
    const newId = Date.now().toString();
    setTabs([...tabs, { id: newId, title: 'New Tab', url: 'https://www.youtube.com' }]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (tabs.length === 1) return; // Don't close last tab

    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);

    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const toggleMiniPlayer = async () => {
    // 1. Environment Check
    // @ts-ignore
    const isTauri = typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

    if (!isTauri) {
      alert("Mini Player requires the Desktop App.\nPlease run: npm run tauri dev");
      return;
    }

    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
      try {
        await invoke('open_mini_player', { url: activeTab.url });
      } catch (error) {
        console.error("Failed to open Mini Player:", error);
        alert("Mini Player Error: " + error);
      }
    }
  };

  // Keyboard Shortcuts Integration
  useShortcuts([
    { key: 't', ctrl: true, action: addTab },
    { key: 'w', ctrl: true, action: () => closeTab(activeTabId) },
    { key: 'm', ctrl: true, action: toggleMiniPlayer },
    { key: 'b', ctrl: true, action: () => setZenMode(prev => !prev) }, // B for Sidebar/Bars
  ]);

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans selection:bg-red-500/30">

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 bg-black relative">
        {/* Top Utility Bar (Window Draggable Area) */}
        <header
          data-tauri-drag-region
          className={cn(
            "h-10 flex items-center justify-between px-4 border-b border-white/5 select-none bg-zinc-900/50 transition-all duration-300",
            zenMode ? "h-0 opacity-0 overflow-hidden" : "h-10 opacity-100"
          )}
        >
          {/* Tab Bar */}
          <div className="flex items-center space-x-1 flex-1 overflow-x-auto no-scrollbar mask-linear-fade">
            {tabs.map(tab => (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={cn(
                  "group relative flex items-center h-8 px-3 pr-2 min-w-[120px] max-w-[200px] rounded-t-md text-xs font-medium transition-colors cursor-pointer border-t border-x border-transparent",
                  activeTabId === tab.id
                    ? "bg-black text-white border-white/10"
                    : "bg-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                )}
              >
                <div className="mr-2">
                  <Play className="w-3 h-3 text-red-600 fill-red-600" />
                </div>
                <span className="truncate flex-1 mr-2">
                  {tab.title === 'Home' ? 'YouTube' : tab.title}
                </span>
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className={cn(
                    "p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20",
                    tabs.length === 1 && "hidden"
                  )}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            <button
              onClick={addTab}
              className="p-1.5 rounded-md hover:bg-white/10 text-zinc-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-4 pl-4 border-l border-white/5">
            {/* Minimal App Controls if needed, currently empty/status */}
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 relative bg-zinc-900/20">
          {tabs.map(tab => (
            <div key={tab.id} className={cn("absolute inset-0", activeTabId === tab.id ? "z-10" : "z-0 hidden")}>
              <BrowserFrame url={tab.url} />
            </div>
          ))}
        </div>

        {/* Floating Dock - Only visible when needed via Hover */}
        <FloatingDock
          onHome={() => setActiveView('home')}
          onTabs={() => addTab()}
          onMini={toggleMiniPlayer}
          onFullscreen={() => setZenMode(prev => !prev)}
        />

      </main>

    </div>
  );
}

export default App;
