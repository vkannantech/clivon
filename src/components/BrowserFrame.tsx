
import { FC, useEffect, useState } from 'react';
import { Loader2, ExternalLink, MonitorPlay } from 'lucide-react';

interface BrowserFrameProps {
    url: string;
}

export const BrowserFrame: FC<BrowserFrameProps> = ({ url }) => {
    const [status, setStatus] = useState<"initializing" | "launching" | "active" | "error" | "web-mode">("initializing");
    const [errorMsg, setErrorMsg] = useState<string>("");

    useEffect(() => {
        const launchNative = async () => {
            try {
                setStatus("launching");

                // 1. Check for Tauri Environment
                // In a standard browser, window.__TAURI_INTERNALS__ is undefined.
                // @ts-ignore
                const isTauri = typeof window !== 'undefined' && (window.__TAURI_INTERNALS__ || window.__TAURI__);

                if (!isTauri) {
                    setStatus("web-mode");
                    return;
                }

                const module = await import('@tauri-apps/api/core');
                if (module && typeof module.invoke === 'function') {
                    await module.invoke('open_mini_player', { url });
                    setStatus("active");
                } else {
                    throw new Error("Tauri API could not be loaded.");
                }
            } catch (err: any) {
                console.error("Launcher Error:", err);
                setErrorMsg(err?.message || "Unknown error");
                setStatus("error");
            }
        };
        launchNative();
    }, [url]);

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-zinc-900/50 text-white relative overflow-hidden backdrop-blur-xl">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black pointer-events-none" />

            <div className="z-10 flex flex-col items-center space-y-6 max-w-md text-center p-8 rounded-2xl border border-white/10 bg-black/40 shadow-2xl">
                {status === "launching" || status === "initializing" ? (
                    <>
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold tracking-tight">Launching Secure Browser</h2>
                            <p className="text-sm text-zinc-400">Bypassing restrictions...</p>
                        </div>
                    </>
                ) : status === "web-mode" ? (
                    <>
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-2">
                            <MonitorPlay className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h2 className="text-xl font-bold text-yellow-400">Web Browser Detected</h2>
                        <p className="text-sm text-zinc-400">
                            You are running in Chrome/Edge.<br />
                            Native Windows require the Tauri App.
                        </p>
                        <div className="pt-2 text-xs text-zinc-500 bg-black/50 p-2 rounded text-left w-full font-mono">
                            $ npm run tauri dev
                        </div>
                    </>
                ) : status === "active" ? (
                    <>
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                            <ExternalLink className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-xl font-bold text-green-400">Browser Active</h2>
                            <p className="text-sm text-zinc-400">Running in high-performance native window.</p>
                            <button
                                onClick={() => setStatus("launching")}
                                className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-xs font-medium transition-colors"
                            >
                                Re-launch Window
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-2">
                            <ExternalLink className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-red-400">Launcher Failed</h2>
                        <p className="text-sm text-red-300/80">{errorMsg}</p>
                    </>
                )}
            </div>
        </div>
    );
};
