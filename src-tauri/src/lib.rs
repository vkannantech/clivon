// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::Manager;
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn open_mini_player(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri::{WebviewUrl, WebviewWindowBuilder};

    // If window exists, bring to front and update URL
    if let Some(window) = app.get_webview_window("mini") {
        window.set_focus().unwrap();
        // We would need an eval or navigation handling here,
        // but for simplicity in this step we just focus it.
        // Ideally we recreate or navigate.
        // For V1 "extreme speed", let's just close and recreate to ensure clean state or navigate if possible.
        let _ = window.eval(&format!("window.location.href = '{}'", url));
        return Ok(());
    }

    // Create new Mini Player window
    let window =
        WebviewWindowBuilder::new(&app, "mini", WebviewUrl::External(url.parse().unwrap()))
            .title("Clivon Mini")
            .inner_size(400.0, 225.0) // 16:9 aspect ratio
            .min_inner_size(320.0, 180.0)
            .always_on_top(true)
            .decorations(false) // Borderless
            .skip_taskbar(false)
            .build()
            .map_err(|e| e.to_string())?;

    // Slight performance tweak: prevent throttling if possible (platform dependent)
    // window.set_background_throttling(Command::Disabled); // Hypothetical, Tauri handles this well by default

    Ok(())
}

#[tauri::command]
async fn fetch_url(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let res = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let body = res.text().await.map_err(|e| e.to_string())?;

    // Inject base tag for relative links
    let base_tag = format!("<base href=\"{}\" />", url);
    let body_with_base = body.replace("<head>", &format!("<head>{}", base_tag));

    Ok(body_with_base)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, open_mini_player, fetch_url])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
