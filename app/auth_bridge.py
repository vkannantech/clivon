import os
import json
import sqlite3
import shutil
import base64
import sys
import ctypes
import subprocess
import time
from ctypes import wintypes

# Windows DPAPI Constants
CRYPTPROTECT_UI_FORBIDDEN = 0x01

class DATA_BLOB(ctypes.Structure):
    _fields_ = [
        ('cbData', wintypes.DWORD),
        ('pbData', ctypes.POINTER(ctypes.c_byte))
    ]

def decrypt_data(encrypted_bytes):
    """Decrypts data using Windows DPAPI (CryptUnprotectData)"""
    try:
        data_in = DATA_BLOB(len(encrypted_bytes), ctypes.cast(ctypes.create_string_buffer(encrypted_bytes), ctypes.POINTER(ctypes.c_byte)))
        data_out = DATA_BLOB()
        
        if ctypes.windll.crypt32.CryptUnprotectData(ctypes.byref(data_in), None, None, None, None, CRYPTPROTECT_UI_FORBIDDEN, ctypes.byref(data_out)):
            size = data_out.cbData
            ptr = data_out.pbData
            decrypted = ctypes.string_at(ptr, size)
            ctypes.windll.kernel32.LocalFree(ptr)
            return decrypted
        else:
            return None
    except Exception:
        return None

# Alias for decrypt_data for clarity in get_encryption_key
dpapi_decrypt = decrypt_data

def get_encryption_key(local_state_path):
    """Extracts and decrypts the AES-256-GCM key from Chrome's Local State file"""
    try:
        if not os.path.exists(local_state_path):
            sys.stderr.write(f"DEBUG: Local State file not found\n")
            return None
            
        with open(local_state_path, "r", encoding="utf-8") as f:
            local_state = json.load(f)
        
        encrypted_key = base64.b64decode(local_state["os_crypt"]["encrypted_key"])
        encrypted_key = encrypted_key[5:]  # Remove 'DPAPI' prefix
        
        decrypted_key = dpapi_decrypt(encrypted_key)
        if not decrypted_key:
            sys.stderr.write(f"DEBUG: DPAPI decryption failed\n")
        else:
            sys.stderr.write(f"DEBUG: DPAPI decryption successful\n")
        
        return decrypted_key
    except Exception as e:
        sys.stderr.write(f"DEBUG: get_encryption_key error: {e}\n")
        return None

def decrypt_cookie(encrypted_value, master_key):
    """Decrypts an AES-256-GCM encrypted cookie value"""
    try:
        from Crypto.Cipher import AES
        
        # Chrome/Edge uses AES-256-GCM encryption
        # Format: v10 (3 bytes) + nonce (12 bytes) + ciphertext + tag (16 bytes)
        nonce = encrypted_value[3:15]
        ciphertext = encrypted_value[15:-16]
        tag = encrypted_value[-16:]
        
        cipher = AES.new(master_key, AES.MODE_GCM, nonce=nonce)
        decrypted = cipher.decrypt_and_verify(ciphertext, tag)
        return decrypted.decode('utf-8')
    except Exception as e:
        sys.stderr.write(f"DEBUG: Decryption failed: {e}\n")
        return None

def get_cookies(browser_name, profile="Default"):
    """Extracts cookies for YouTube/Google from the specified browser."""
    app_data = os.getenv("LOCALAPPDATA")
    
    paths = {
        "Chrome": os.path.join(app_data, "Google", "Chrome", "User Data"),
        "Edge": os.path.join(app_data, "Microsoft", "Edge", "User Data"),
    }
    
    user_data_path = paths.get(browser_name)
    
    sys.stderr.write(f"DEBUG: Checking {browser_name} at: {user_data_path}\n")
    
    if not user_data_path or not os.path.exists(user_data_path):
        sys.stderr.write(f"DEBUG: {browser_name} user data path not found\n")
        return []

    cookies_path = os.path.join(user_data_path, profile, "Network", "Cookies")
    if not os.path.exists(cookies_path):
        cookies_path = os.path.join(user_data_path, profile, "Cookies")
    
    sys.stderr.write(f"DEBUG: Looking for cookies at: {cookies_path}\n")
        
    if not os.path.exists(cookies_path):
        sys.stderr.write(f"DEBUG: Cookies file not found for {browser_name}/{profile}\n")
        return []

    
    sys.stderr.write(f"DEBUG: Found cookies file, attempting to read...\n")
    
    # Check if browser is running and close it temporarily
    browser_process = "msedge.exe" if browser_name == "Edge" else "chrome.exe"
    browser_was_running = False
    
    try:
        result = subprocess.run(["tasklist", "/FI", f"IMAGENAME eq {browser_process}"], 
                              capture_output=True, text=True)
        if browser_process.lower() in result.stdout.lower():
            browser_was_running = True
            sys.stderr.write(f"DEBUG: {browser_name} is running, closing temporarily...\n")
            subprocess.run(["taskkill", "/F", "/IM", browser_process], 
                         capture_output=True)
            time.sleep(2)  # Wait for process to fully close
    except Exception as e:
        sys.stderr.write(f"DEBUG: Could not check/close browser: {e}\n")
    
    # Now try to copy the cookies file
    temp_cookies = os.path.join(os.getenv("TEMP"), "clivon_cookies.db")
    try:
        shutil.copyfile(cookies_path, temp_cookies)
        conn = sqlite3.connect(temp_cookies)
        sys.stderr.write(f"DEBUG: Successfully copied and opened cookies database\n")
    except Exception as e:
        sys.stderr.write(f"DEBUG: Failed to copy cookies: {e}\n")
        return []

    extracted_cookies = []
    
    try:
        cursor = conn.cursor()
        
        query = """
        SELECT host_key, name, value, path, is_secure, is_httponly, expires_utc, encrypted_value 
        FROM cookies 
        WHERE host_key LIKE '%youtube.com%' OR host_key LIKE '%google.com%'
        """
        
        cursor.execute(query)
        
        sys.stderr.write(f"DEBUG: Query executed, fetching results...\n")
        rows = cursor.fetchall()
        sys.stderr.write(f"DEBUG: Found {len(rows)} cookies matching YouTube/Google domains\n")
        
        # Get master key for decryption
        key_path = os.path.join(user_data_path, "Local State")
        sys.stderr.write(f"DEBUG: Looking for Local State at: {key_path}\n")
        sys.stderr.write(f"DEBUG: Local State exists: {os.path.exists(key_path)}\n")
        
        master_key = get_encryption_key(key_path)
        if not master_key:
            sys.stderr.write(f"DEBUG: Could not get master key for {browser_name}\n")
        else:
            sys.stderr.write(f"DEBUG: Successfully got master key\n")
        
        cookie_count = 0
        for host, name, value, path, secure, httponly, expires, encrypted_value in rows:
            cookie_count += 1
            if cookie_count <= 3:  # Only show first 3 for debugging
                sys.stderr.write(f"DEBUG: Cookie #{cookie_count}: name={name}, has_value={bool(value)}, has_encrypted={bool(encrypted_value)}, enc_len={len(encrypted_value) if encrypted_value else 0}\n")
                if encrypted_value and len(encrypted_value) > 3:
                    sys.stderr.write(f"DEBUG:   Encrypted prefix: {encrypted_value[:3]}\n")
            
            decrypted_value = value  # Try plain text first
            
            # If no plain text value, try decryption
            if not decrypted_value and encrypted_value:
                # Check if it's encrypted (starts with v10, v11, or v20)
                if len(encrypted_value) > 3 and encrypted_value[:3] in [b'v10', b'v11', b'v20']:
                    decrypted_value = decrypt_cookie(encrypted_value, master_key)
                    if cookie_count <= 3 and decrypted_value:
                        sys.stderr.write(f"DEBUG:   Successfully decrypted {name}\n")
                else:
                    # Try DPAPI decryption for older cookies
                    decrypted_bytes = dpapi_decrypt(encrypted_value)
                    if decrypted_bytes:
                        try:
                            decrypted_value = decrypted_bytes.decode('utf-8')
                        except:
                            pass
            
            if decrypted_value:
                sys.stderr.write(f"DEBUG: Adding cookie: {name} from {host}\n")
                extracted_cookies.append({
                    "url": f"https://{host.lstrip('.')}{path}",
                    "domain": host,
                    "name": name,
                    "value": decrypted_value,
                    "path": path,
                    "secure": bool(secure),
                    "httpOnly": bool(httponly),
                    "expirationDate": expires
                })
                
        sys.stderr.write(f"DEBUG: Total cookies extracted: {len(extracted_cookies)}\n")
                
        conn.close()
    except Exception as e:
        sys.stderr.write(f"DEBUG: Error reading cookies: {e}\n")
        pass
    finally:
        # Only clean up temp file if we created one
        temp_cookies = os.path.join(os.getenv("TEMP"), "clivon_cookies.db")
        if os.path.exists(temp_cookies):
            try:
                os.remove(temp_cookies)
            except:
                pass

    return extracted_cookies

def get_all_browser_cookies(browser_name):
    """Scans ALL profiles for the given browser."""
    app_data = os.getenv("LOCALAPPDATA")
    paths = {
        "Chrome": os.path.join(app_data, "Google", "Chrome", "User Data"),
        "Edge": os.path.join(app_data, "Microsoft", "Edge", "User Data"),
    }
    
    user_data_path = paths.get(browser_name)
    if not user_data_path or not os.path.exists(user_data_path):
        return []

    profiles = ["Default"]
    try:
        if os.path.exists(user_data_path):
            for item in os.listdir(user_data_path):
                if item.startswith("Profile ") and os.path.isdir(os.path.join(user_data_path, item)):
                    profiles.append(item)
    except:
        pass

    all_cookies = []
    
    for profile in profiles:
        cookies = get_cookies(browser_name, profile)
        if cookies:
            all_cookies.extend(cookies)
            
    return all_cookies

def ensure_chromium_installed():
    """Checks for Chromium and installs if missing."""
    import shutil
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            # Try to launch to check if it exists
            # This will throw if browser is missing
            try:
                browser = p.chromium.launch(headless=True)
                browser.close()
                return True
            except Exception:
                sys.stderr.write("DEBUG: Portable browser missing. Installing Chromium...\n")
                # Install chromium
                subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], 
                             capture_output=False) # Show output so user knows download is happening
                return True
    except Exception as e:
        sys.stderr.write(f"DEBUG: Failed to install browser: {e}\n")
        return False

def launch_stealth_browser():
    """Launches Playwright Chromium for manual login."""
    try:
        # Ensure browser is installed first
        ensure_chromium_installed()
        
        from playwright.sync_api import sync_playwright
        import time
        
        sys.stderr.write("LAUNCHING_STEALTH_BROWSER\n")
        
        with sync_playwright() as p:
            # Launch Chromium (bundled with Playwright)
            browser = p.chromium.launch(
                headless=False,
                args=[
                    '--start-maximized',
                    '--disable-blink-features=AutomationControlled',
                    '--no-sandbox'
                ]
            )
            
            context = browser.new_context(
                viewport=None,
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36'
            )
            
            page = context.new_page()
            page.goto("https://accounts.google.com/ServiceLogin?service=youtube")
            
            sys.stderr.write("WAITING_FOR_LOGIN\n")
            
            # Wait for auth cookies (5 minutes max)
            critical_cookies = {'HSID', 'SID', 'SSID', '__Secure-1PSID', '__Secure-3PSID'}
            found_cookies = None
            
            for _ in range(300):
                cookies = context.cookies()
                cookie_names = {c['name'] for c in cookies}
                
                if critical_cookies & cookie_names:
                    found_cookies = cookies
                    sys.stderr.write("SUCCESS: Auth cookies detected!\n")
                    break
                    
                time.sleep(1)
            
            browser.close()
            
            if found_cookies:
                # Convert to Electron format
                final_cookies = []
                for c in found_cookies:
                    # Map SameSite for Electron
                    # Playwright: "Strict", "Lax", "None"
                    # Electron: "strict", "lax", "no_restriction"
                    same_site = c.get('sameSite', 'Lax')
                    if same_site == 'None':
                        electron_same_site = 'no_restriction'
                    elif same_site == 'Strict':
                        electron_same_site = 'strict'
                    else:
                        electron_same_site = 'lax'

                    final_cookies.append({
                        "url": f"https://{c['domain'].lstrip('.')}{c['path']}",
                        "domain": c['domain'],
                        "name": c['name'],
                        "value": c['value'],
                        "path": c['path'],
                        "secure": c.get('secure', True),
                        "httpOnly": c.get('httpOnly', True),
                        "expirationDate": c.get('expires', 0),
                        "sameSite": electron_same_site
                    })
                return final_cookies
        
        return None

    except Exception as e:
        sys.stderr.write(f"STEALTH_ERROR: {e}\n")
        return None

if __name__ == "__main__":
    try:
        # Check dependencies first
        try:
            from Crypto.Cipher import AES
        except ImportError:
            print(json.dumps({"error": "MISSING_DEPENDENCY", "message": "Please install pycryptodome: pip install pycryptodome"}))
            sys.exit(1)

        # 1. Try System Extraction First (Silent)
        # Note: Disabled to force Portable Browser for reliability
        # all_cookies = get_all_browser_cookies("Chrome")
        # if not all_cookies:
        #    all_cookies = get_all_browser_cookies("Edge")
            
        # if all_cookies:
        #     print(json.dumps(all_cookies))
        #     sys.exit(0)

        # 2. Fallback: Standalone Stealth Browser (Portable Chromium)
        stealth_cookies = launch_stealth_browser()
        
        if stealth_cookies:
            print(json.dumps(stealth_cookies))
        else:
            print(json.dumps({"error": "NO_COOKIES", "message": "Login timeout or closed."}))

    except Exception as e:
        print(json.dumps({"error": "CRASH", "message": str(e)}))
