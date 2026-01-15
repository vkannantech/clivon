
import { useState } from 'react';
import { BrowserFrame } from './components/BrowserFrame';
import { Home, Video, Settings, Play, Plus, X } from 'lucide-react';
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

  // Keyboard Shortcuts Integration
  useShortcuts([
    { key: 't', ctrl: true, action: addTab },
    { key: 'w', ctrl: true, action: () => closeTab(activeTabId) },
    { key: 'm', ctrl: true, action: () => alert("Toggle Mini Player") },
    { key: 'b', ctrl: true, action: () => setZenMode(prev => !prev) }, // B for Sidebar/Bars
  ]);

  return (
    <div className="flex h-screen w-screen bg-black text-white overflow-hidden font-sans selection:bg-red-500/30">

      {/* Sidebar - Productivity Dock */}
      <aside className={cn(
        "flex flex-col items-center py-6 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl z-50 transition-all duration-300",
        zenMode ? "hidden" : "w-16 opacity-100"
      )}>
        <div className="mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-900 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <Play className="w-5 h-5 text-white fill-white" />
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full px-2">
          <NavItem icon={Home} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')} />
          {/* We might reuse 'Layers' for managing multiple windows later */}
          <NavItem icon={Video} label="Mini" active={false} onClick={() => alert("Mini Player requires Desktop Mode")} />
        </nav>

        <div className="mt-auto px-2">
          <NavItem icon={Settings} label="Settings" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
        </div>
      </aside>

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
            <div className="flex items-center px-2 py-1 bg-zinc-900 rounded-full border border-white/5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-[10px] text-zinc-400 font-medium tracking-wide">SECURE</span>
            </div>
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
          onMini={() => alert("Mini Player (Coming Soon)")}
          onFullscreen={() => setZenMode(prev => !prev)}
        />

      </main>

    </div>
  );
}

// Subcomponent for Sidebar Items
function NavItem({ icon: Icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-200 group relative",
        active
          ? "bg-white/10 text-white shadow-inner"
          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", active && "text-red-500")} />
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-red-500 rounded-r-full -ml-[10px]" />
      )}
    </button>
  );
}

export default App;
