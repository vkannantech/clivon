// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
use std::sync::OnceLock;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;

// Connection Pooling
static HTTP_CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
static STREAM_CLIENT: OnceLock<reqwest::blocking::Client> = OnceLock::new();

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn toggle_mini_mode(app: tauri::AppHandle, enable: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if enable {
            // Mini Mode: Small, Always on Top
            window.set_always_on_top(true).unwrap();
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 480.0, height: 270.0 })).unwrap();
        } else {
            // Normal Mode
            window.set_always_on_top(false).unwrap();
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 1280.0, height: 720.0 })).unwrap();
        }
    }
    Ok(())
}

#[tauri::command]
async fn toggle_focus_mode(app: tauri::AppHandle, enable: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.emit("toggle-focus-mode", enable).unwrap();
    }
    Ok(())
}

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
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            fetch_url, 
            toggle_mini_mode,
            toggle_focus_mode
        ])
        .setup(|app| {
            // SINGLE WINDOW ENFORCEMENT
            // We only use the 'main' window defined in tauri.conf.json
            let main_window = app.get_webview_window("main").unwrap();

            // --- SYSTEM TRAY SETUP ---
            let quit_i = MenuItem::with_id(app, "quit", "Quit YouTube", true, None::<&str>).unwrap();
            let mini_i = MenuItem::with_id(app, "mini", "Toggle Mini Mode", true, None::<&str>).unwrap();
            let focus_i = MenuItem::with_id(app, "focus", "Toggle Focus Mode", true, None::<&str>).unwrap();
            
            let menu = Menu::with_items(app, &[&mini_i, &focus_i, &quit_i]).unwrap();

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id().as_ref() {
                        "quit" => app.exit(0),
                        "mini" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.emit("tray-toggle-mini", ());
                                let _ = window.set_focus();
                            }
                        },
                        "focus" => {
                            if let Some(window) = app.get_webview_window("main") {
                                // We blindly send 'true' for now as a trigger, logic should handle toggle
                                let _ = window.emit("toggle-focus-mode", true); 
                            }
                        }
                        _ => {}
                    }
                })
                .build(app)?;
            
            // --- INJECTIONS (Optimized) ---

            // 1. Clivon Core (Orchestrator: Header Mods, Notifications, Media Fixer, GPU Boost)
            let core_js = include_str!("clivon_core.js");
            let _ = main_window.eval(core_js);

            // 2. Clivon AdShield (Separate heavily optimized engine)
            let adblock_js = include_str!("adblock.js");
            let _ = main_window.eval(adblock_js);

            // 3. Focus Mode Engine (Togglable)
            let focus_js = include_str!("focus_mode.js");
            let _ = main_window.eval(focus_js);


            // 5. Header Mods (Home & Fullscreen Buttons)
            let header_js = include_str!("header_mods.js");
            let _ = main_window.eval(header_js);

            Ok(())
        })
        .register_uri_scheme_protocol("stream", |_app, request| {
            let mut response_builder = tauri::http::Response::builder()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
                .header("Access-Control-Allow-Headers", "*");

            let uri = request.uri();
            let url_str = uri.to_string().replace("stream://", "https://");
            
            let client = STREAM_CLIENT.get_or_init(|| {
                reqwest::blocking::Client::builder()
                    .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .timeout(std::time::Duration::from_secs(10)) 
                    .pool_idle_timeout(std::time::Duration::from_secs(90))
                    .pool_max_idle_per_host(20)
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
