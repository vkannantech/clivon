
import { FC, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface BrowserFrameProps {
    url: string;
}

export const BrowserFrame: FC<BrowserFrameProps> = ({ url }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [error, setError] = useState<boolean>(false);

    // Note: Standard iframes are blocked by X-Frame-Options for youtube.com
    // This component will evolve to manage the "Overlay Window" or "Webview" 
    // in the next steps if direct embedding fails (which it likely will).

    return (
        <div className="flex flex-col h-full w-full bg-black relative overflow-hidden">


            {/* Main Content Area - Outer wrapper clips the scrollbar */}
            <div className="flex-1 relative bg-black overflow-hidden group">
                {/* Visual Scrollbar Mask  */}
                <div className="absolute right-0 top-0 bottom-0 w-[16px] bg-black z-50 pointer-events-none opacity-100 mix-blend-multiply" />
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4 p-8 text-center">
                        <AlertTriangle className="w-12 h-12 text-zinc-700" />
                        <p>Unable to load {url} directly.</p>
                        <p className="text-xs max-w-md">
                            YouTube blocks direct embedding.
                            <br />
                            We will switch to the <strong>Secure Overlay Window</strong> method.
                        </p>
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        src={url}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"
                        onError={() => setError(true)}
                    // Use standard user agent if possible (Tauri handles this better than browser)
                    />
                )}
            </div>
        </div>
    );
};
