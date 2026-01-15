// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use std::sync::OnceLock;
use tauri::{WebviewUrl, WebviewWindowBuilder};

// Helper function to create the YouTube Window
fn create_browser_window(app: &tauri::AppHandle) -> Result<(), String> {
    let url = "https://www.youtube.com";
    
    // Premium Loader Script (Pulsing Glow Effect)
    let loader_script = r#"
        (function() {
            var overlay = document.createElement('div');
            overlay.id = 'clivon-loader';
            Object.assign(overlay.style, {
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: '#0f0f0f', zIndex: '9999999', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
            });
            
            var style = document.createElement('style');
            style.textContent = `
                @keyframes pulse-glow {
                    0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); transform: scale(1); }
                    70% { box-shadow: 0 0 0 20px rgba(255, 0, 0, 0); transform: scale(1.05); }
                    100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); transform: scale(1); }
                }
                .loader-logo {
                    width: 80px; height: 80px; background: #FF0000;
                    border-radius: 50%; position: relative;
                    animation: pulse-glow 2s infinite;
                    display: flex; align-items: center; justifyContent: 'center';
                }
                .loader-logo::after {
                    content: ''; width: 0; height: 0;
                    border-top: 15px solid transparent; border-bottom: 15px solid transparent;
                    border-left: 26px solid white; margin-left: 8px;
                }
                .loader-text {
                    margin-top: 30px; font-family: 'Roboto', sans-serif;
                    color: #fff; font-size: 16px; letter-spacing: 1px;
                    opacity: 0.8; font-weight: 300;
                }
            `;
            document.head.appendChild(style);

            var logo = document.createElement('div');
            logo.className = 'loader-logo';
            
            var text = document.createElement('p');
            text.className = 'loader-text';
            text.innerText = 'YOUTUBE DESKTOP';

            overlay.appendChild(logo);
            overlay.appendChild(text);
            document.documentElement.appendChild(overlay);

            function removeLoader() {
                var el = document.getElementById('clivon-loader');
                if(el) {
                    el.style.opacity = '0';
                    setTimeout(function(){ 
                        if(el.parentNode) el.parentNode.removeChild(el); 
                    }, 600);
                }
            }
            
            window.addEventListener('load', removeLoader);
            setTimeout(removeLoader, 8000); // Safety fallback
        })();
    "#;

    let _window = WebviewWindowBuilder::new(app, "browser_view", WebviewUrl::External(url.parse().unwrap()))
            .title("YouTube")
            .inner_size(1280.0, 720.0)
            .min_inner_size(480.0, 320.0)
            .visible(true) // Explicitly visible
            .decorations(true) 
            .resizable(true)
            .initialization_script(loader_script)
            .build()
            .map_err(|e| e.to_string())?;

    // Maximize by default for immersive feel
    let _ = _window.maximize();
    
    // When this window closes, exit the app
    let app_handle = app.clone();
    _window.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { .. } = event {
            app_handle.exit(0);
        }
    });

    Ok(())
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn open_mini_player(app: tauri::AppHandle, url: String) -> Result<(), String> {
    // Only used if manually triggered, but we auto-launch now.
    // We can reuse the same window if it exists.
    if let Some(window) = app.get_webview_window("browser_view") {
        window.set_focus().unwrap();
        let _ = window.eval(&format!("window.location.href = '{}'", url));
    } else {
        create_browser_window(&app)?;
    }
    Ok(())
}

// Connection Pooling
static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
static STREAM_CLIENT: OnceLock<reqwest::blocking::Client> = OnceLock::new();

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let client = HTTP_CLIENT.get_or_init(|| {
        reqwest::Client::builder()
            .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
            .brotli(true)
            .gzip(true)
            .deflate(true)
            .build()
            .expect("Failed to create global HTTP client")
    });

    // Aggressive Timeout for Initial Load
    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let body = res.text().await.map_err(|e| e.to_string())?;

    let base_tag = format!("<base href=\"{}\" />", url);
    let mut clean_body = body.replace("<head>", &format!("<head>{}", base_tag));
    
    // Ad-Block / Tracker-Block (Speed Optimization)
    clean_body = clean_body.replace("doubleclick.net", "0.0.0.0");
    clean_body = clean_body.replace("googlesyndication.com", "0.0.0.0");
    clean_body = clean_body.replace("google-analytics.com", "0.0.0.0");
    
    Ok(clean_body)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, open_mini_player, fetch_url])
        .setup(|app| {
            // AUTO-LAUNCH: Immediately open the YouTube window on startup
            create_browser_window(app.handle())?;
            Ok(())
        })
        .register_uri_scheme_protocol("stream", |_app, request| {
            let mut response_builder = tauri::http::Response::builder()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
                .header("Access-Control-Allow-Headers", "*");

            let uri = request.uri();
            let url_str = uri.to_string().replace("stream://", "https://");
            
            // High-Performance Connection Pooling
            // Reuse the client to avoid expensive SSL handshakes on every request
            let client = STREAM_CLIENT.get_or_init(|| {
                reqwest::blocking::Client::builder()
                    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(std::time::Duration::from_secs(10)) // Fail fast on slow assets
                    .pool_idle_timeout(std::time::Duration::from_secs(90))
                    .pool_max_idle_per_host(20) // Allow more concurrent connections
                    .build()
                    .unwrap_or_default()
            });

            match client.get(&url_str).send() {
                Ok(resp) => {
                    let status_u16 = resp.status().as_u16();
                    let tauri_status = tauri::http::StatusCode::from_u16(status_u16).unwrap_or(tauri::http::StatusCode::OK);
                    response_builder = response_builder.status(tauri_status);

                    for (key, value) in resp.headers() {
                        let key_str = key.as_str().to_lowercase();
                        if key_str != "x-frame-options" 
                           && key_str != "content-security-policy" 
                           && key_str != "frame-options" {
                             response_builder = response_builder.header(key.as_str(), value.as_bytes());
                        }
                    }
                    
                    let bytes = resp.bytes().unwrap_or_default().to_vec();
                    response_builder
                        .body(bytes)
                        .unwrap_or_else(|_| tauri::http::Response::builder()
                            .status(tauri::http::StatusCode::INTERNAL_SERVER_ERROR)
                            .body(Vec::new())
                            .unwrap())
                },
                Err(e) => {
                     response_builder
                        .status(tauri::http::StatusCode::BAD_GATEWAY)
                        .body(e.to_string().into_bytes())
                        .unwrap_or_else(|_| tauri::http::Response::builder()
                            .status(tauri::http::StatusCode::INTERNAL_SERVER_ERROR)
                            .body(Vec::new())
                            .unwrap())
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
