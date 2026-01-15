
import { FC, useRef, useState, useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface BrowserFrameProps {
    url: string;
}

export const BrowserFrame: FC<BrowserFrameProps> = ({ url }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [error, setError] = useState<boolean>(false);

    // Note: Standard iframes are blocked by X-Frame-Options for youtube.com
    // We utilize our custom 'stream://' protocol to proxy requests and strip security headers.
    // This allows robust asset loading (scripts, css) as if they were local.

    // Convert https://youtube.com -> stream://youtube.com
    const streamUrl = url.startsWith('http') ? url.replace(/^https?:\/\//, 'stream://') : url;

    return (
        <div className="flex flex-col h-full w-full bg-black relative overflow-hidden">
            {/* Main Content Area - Outer wrapper clips the scrollbar */}
            <div className="flex-1 relative bg-black overflow-hidden group">
                {/* Visual Scrollbar Mask  */}
                <div className="absolute right-0 top-0 bottom-0 w-[16px] bg-black z-50 pointer-events-none opacity-100 mix-blend-multiply" />

                <iframe
                    ref={iframeRef}
                    src={streamUrl}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; presentation"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-forms allow-popups allow-modals"
                    onError={() => setError(true)}
                />
            </div>
        </div>
    );
};
