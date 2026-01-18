#ifndef CLIENT_PROTECTION_H_
#define CLIENT_PROTECTION_H_

#include <string>
#include <iostream>
#include <algorithm>

namespace clivon {
namespace protection {

// Returns TRUE if the request should be BLOCKED (Cancel).
inline bool ShouldBlockRequest(const std::string& url_in) {
    std::string url = url_in;
    std::transform(url.begin(), url.end(), url.begin(), ::tolower);
    
    // 1. VIDEO STREAM ALLOW-LIST (Fixes Buffering)
    if (url.find("googlevideo.com/videoplayback") != std::string::npos || 
        url.find("mime=video") != std::string::npos || 
        url.find("range=") != std::string::npos) {
        return false; // ALLOW
    }

    // 2. BRAVE LOGS & SPECIFIC TRACKERS (The "List")
    if (url.find("googleads.g.doubleclick.net/pagead/id") != std::string::npos ||
        url.find("www.google.com/pagead/lvz") != std::string::npos ||
        url.find("/instream/ad_status.js") != std::string::npos ||
        url.find("/pagead/1p-user-list/") != std::string::npos || 
        url.find("/pagead/viewthroughconversion/") != std::string::npos ||
        url.find("tpc.googlesyndication.com/simgad/") != std::string::npos ||
        url.find("youtube.com/pagead/") != std::string::npos) {
        
        std::cout << "[Quantum Shield] \033[31mBLOCKED Tracker\033[0m: " << url.substr(0, 50) << "..." << std::endl;
        return true; // BLOCK
    }

    // 3. BROAD PATTERN MATCHING ("Extreme" Mode)
    // UPDATE: We ALLOW "doubleclick" and "googleads" to fix the 10s Black Screen Timeout.
    // Quantum Engine (JS) will kill them instantly after load.
    
    if (url.find("ad_break") != std::string::npos ||
        url.find("/stats/ads") != std::string::npos ||
        url.find("youtubei/v1/player/ad_") != std::string::npos ||
        url.find("youtube.com/get_midroll_info") != std::string::npos ||
        url.find("/ptracking") != std::string::npos) {
        
        std::cout << "[Quantum Shield] \033[31mBLOCKED Ad Component\033[0m: " << url.substr(0, 50) << "..." << std::endl;
        return true; // BLOCK known ad components
    }
    
    /* 
    REMOVED TO FIX TIMEOUT:
    if (url.find("doubleclick.net") != std::string::npos ||
        url.find("googlesyndication.com") != std::string::npos ||
        url.find("googleads") != std::string::npos ||
        url.find("/pagead/") != std::string::npos) ...
    */

    return false; // ALLOW otherwise
}

inline bool ShouldBlockScript(const std::string& url) {
    if (url.find("/pagead/") != std::string::npos ||
        url.find("doubleclick") != std::string::npos ||
        url.find("googlesyndication") != std::string::npos ||
        url.find("ad_status.js") != std::string::npos) {
        return true;
    }
    return false;
}

} // namespace protection
} // namespace clivon

#endif // CLIENT_PROTECTION_H_
