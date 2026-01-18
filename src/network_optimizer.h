#ifndef NETWORK_OPTIMIZER_H_
#define NETWORK_OPTIMIZER_H_

#include "include/cef_request.h"
#include <string>
#include <algorithm>
#include <iostream>

namespace clivon {
namespace optimizer {

// "Separate file for controlling client to server sending details" - as requested.
// This optimizes the request headers to force fast loading.

inline void OptimizeHeaders(CefRefPtr<CefRequest> request) {
    std::string url = request->GetURL().ToString();
    std::transform(url.begin(), url.end(), url.begin(), ::tolower);
    
    CefRequest::HeaderMap headers;
    request->GetHeaderMap(headers);

    // 1. PRIORITY BOOST (Force Server to PRIORITIZE this stream)
    if (url.find("googlevideo.com/videoplayback") != std::string::npos) {
        // "One weird trick" to tell Google servers we are urgent.
        headers.insert(std::make_pair("Priority", "u=0")); 
        std::cout << "[Quantum NetOpt] \033[36mBoosted Video Stream Priority\033[0m" << std::endl;
    }

    // 2. COOKIE STRIPPING (Anonymize & Speed Up)
    // If request is for an ad service, strip cookies to kill "Targeted Ad" auctions.
    // This reduces server-side processing time (Auction Cancellation).
    if (url.find("doubleclick.net") != std::string::npos ||
        url.find("googleads") != std::string::npos ||
        url.find("youtube.com/api/stats/ads") != std::string::npos) {
        
        headers.erase("Cookie");
        headers.erase("Authorization");
        std::cout << "[Quantum NetOpt] \033[33mStripped Ad Cookies (Auction Skip)\033[0m: " << url.substr(0, 50) << "..." << std::endl;
    }

    request->SetHeaderMap(headers);
}

} // namespace optimizer
} // namespace clivon

#endif // NETWORK_OPTIMIZER_H_
