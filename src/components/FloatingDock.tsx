
import { FC } from 'react';
import { Home, Layers, Video, Play, Maximize2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

interface DockProps {
    onHome: () => void;
    onTabs: () => void;
    onMini: () => void;
    onFullscreen: () => void;
}

export const FloatingDock: FC<DockProps> = ({ onHome, onTabs, onMini, onFullscreen }) => {
    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 group">
            {/* Invisible hover trigger area */}
            <div className="absolute -inset-4 top-[-20px] rounded-full" />

            <div className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-2xl",
                "bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl",
                "translate-y-2 opacity-0 scale-95",
                "group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-100",
                "transition-all duration-300 ease-out origin-bottom",
                "hover:bg-black/60 hover:border-white/20"
            )}>

                <DockItem icon={Home} label="Home" onClick={onHome} />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <DockItem icon={Layers} label="Tabs" onClick={onTabs} />
                <DockItem icon={Video} label="Mini" onClick={onMini} />
                <div className="w-px h-4 bg-white/10 mx-1" />
                <DockItem icon={Maximize2} label="Focus" onClick={onFullscreen} active />

                <div className="ml-2 pl-2 border-l border-white/10">
                    <div className="w-6 h-6 bg-gradient-to-br from-red-600 to-red-900 rounded-lg flex items-center justify-center shadow-lg shadow-red-900/20 animate-pulse">
                        <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                </div>

            </div>
        </div>
    );
};

const DockItem = ({ icon: Icon, label, onClick, active }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "p-2 rounded-xl transition-all duration-200 relative group/icon",
            active ? "text-white bg-white/10" : "text-zinc-400 hover:text-white hover:bg-white/10 hover:scale-110"
        )}
        title={label}
    >
        <Icon className="w-5 h-5" />
        {/* Label on hover */}
        <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-white text-[10px] rounded-md opacity-0 group-hover/icon:opacity-100 transition-opacity whitespace-nowrap border border-white/10 pointer-events-none">
            {label}
        </span>
    </button>
);
