// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use std::sync::OnceLock;
use tauri::{WebviewUrl, WebviewWindowBuilder};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn open_mini_player(app: tauri::AppHandle, url: String) -> Result<(), String> {
    // V2 Architecture: "Browser Window"
    
    // Check if window exists
    if let Some(window) = app.get_webview_window("browser_view") {
        window.set_focus().unwrap();
        let _ = window.eval(&format!("window.location.href = '{}'", url));
        return Ok(());
    }

    // Inject a Loading Overlay that removes itself when the page is fully loaded
    let loader_script = r#"
        (function() {
            var overlay = document.createElement('div');
            overlay.id = 'clivon-loader';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = '#000000';
            overlay.style.zIndex = '9999999';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.flexDirection = 'column';
            overlay.style.transition = 'opacity 0.5s ease-out';
            
            var style = document.createElement('style');
            style.textContent = `
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                .loader-spinner {
                    border: 4px solid #333;
                    border-top: 4px solid #FF0000;
                    border-radius: 50%;
                    width: 50px;
                    height: 50px;
                    animation: spin 1s linear infinite;
                }
            `;
            document.head.appendChild(style);

            var spinner = document.createElement('div');
            spinner.className = 'loader-spinner';
            
            var text = document.createElement('p');
            text.innerText = 'Loading YouTube...';
            text.style.color = '#666';
            text.style.fontFamily = 'sans-serif';
            text.style.marginTop = '20px';
            text.style.fontSize = '14px';

            overlay.appendChild(spinner);
            overlay.appendChild(text);
            document.documentElement.appendChild(overlay);

            function removeLoader() {
                var el = document.getElementById('clivon-loader');
                if(el) {
                    el.style.opacity = '0';
                    setTimeout(function(){ 
                        if(el.parentNode) el.parentNode.removeChild(el); 
                    }, 500);
                }
            }
            
            window.addEventListener('load', removeLoader);
            setTimeout(removeLoader, 5000);
        })();
    "#;

    let window = WebviewWindowBuilder::new(&app, "browser_view", WebviewUrl::External(url.parse().unwrap()))
            .title("YouTube")
            .inner_size(1024.0, 640.0)
            .min_inner_size(480.0, 320.0)
            .always_on_top(false) 
            .decorations(true) // Explicitly set decorations to true (Standard Window)
            .resizable(true)
            .visible(true)
            .initialization_script(loader_script)
            .build()
            .map_err(|e| e.to_string())?;

    Ok(())
}

// Connection Pooling
static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();

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

    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let body = res.text().await.map_err(|e| e.to_string())?;

    let base_tag = format!("<base href=\"{}\" />", url);
    let mut clean_body = body.replace("<head>", &format!("<head>{}", base_tag));
    
    clean_body = clean_body.replace("doubleclick.net", "0.0.0.0");
    clean_body = clean_body.replace("googlesyndication.com", "0.0.0.0");
    
    Ok(clean_body)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, open_mini_player, fetch_url])
        .register_uri_scheme_protocol("stream", |_app, request| {
            let mut response_builder = tauri::http::Response::builder()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
                .header("Access-Control-Allow-Headers", "*");

            let uri = request.uri();
            let url_str = uri.to_string().replace("stream://", "https://");
            
            let client = reqwest::blocking::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .build()
                .unwrap_or_default();

            match client.get(&url_str).send() {
                Ok(resp) => {
                    let status_u16 = resp.status().as_u16();
                    // Manual Status Code Conversion (reqwest -> tauri::http)
                    let tauri_status = tauri::http::StatusCode::from_u16(status_u16).unwrap_or(tauri::http::StatusCode::OK);
                    response_builder = response_builder.status(tauri_status);

                    for (key, value) in resp.headers() {
                        let key_str = key.as_str().to_lowercase();
                        if key_str != "x-frame-options" 
                           && key_str != "content-security-policy" 
                           && key_str != "frame-options" {
                             // Manual Header Conversion (String/Bytes)
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
