import os
import json
import sqlite3
import shutil
import base64
import sys
import ctypes
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

def get_encryption_key(local_state_path):
    """Extracts and decrypts the AES-256-GCM key from Chrome's Local State file"""
    try:
        if not os.path.exists(local_state_path):
            return None
            
        with open(local_state_path, "r", encoding="utf-8") as f:
            local_state = json.load(f)
            
        encrypted_key = base64.b64decode(local_state["os_crypt"]["encrypted_key"])
        encrypted_key = encrypted_key[5:]  # Remove 'DPAPI' prefix
        
        return decrypt_data(encrypted_key)
    except Exception:
        return None

def get_cookies(browser_name, profile="Default"):
    """Extracts cookies for YouTube/Google from the specified browser."""
    app_data = os.getenv("LOCALAPPDATA")
    
    paths = {
        "Chrome": os.path.join(app_data, "Google", "Chrome", "User Data"),
        "Edge": os.path.join(app_data, "Microsoft", "Edge", "User Data"),
    }
    
    user_data_path = paths.get(browser_name)
    if not user_data_path or not os.path.exists(user_data_path):
        return []

    cookies_path = os.path.join(user_data_path, profile, "Network", "Cookies")
    if not os.path.exists(cookies_path):
        cookies_path = os.path.join(user_data_path, profile, "Cookies")
        
    if not os.path.exists(cookies_path):
        return []

    temp_cookies = os.path.join(os.getenv("TEMP"), "clivon_cookies.db")
    try:
        shutil.copyfile(cookies_path, temp_cookies)
    except:
        return []

    extracted_cookies = []
    
    try:
        conn = sqlite3.connect(temp_cookies)
        cursor = conn.cursor()
        
        query = """
        SELECT host_key, name, value, path, is_secure, is_httponly, expires_utc, encrypted_value 
        FROM cookies 
        WHERE host_key LIKE '%youtube.com%' OR host_key LIKE '%google.com%'
        """
        
        cursor.execute(query)
        
        key_path = os.path.join(user_data_path, "Local State")
        master_key = get_encryption_key(key_path)

        for host, name, value, path, secure, httponly, expires, encrypted_value in cursor.fetchall():
            decrypted_value = value
            
            if not value and encrypted_value:
                decrypted_v = decrypt_data(encrypted_value)
                
                if decrypted_v:
                    decrypted_value = decrypted_v.decode('utf-8')
                elif master_key:
                     try:
                        from Crypto.Cipher import AES
                        nonce = encrypted_value[3:15]
                        ciphertext = encrypted_value[15:-16]
                        tag = encrypted_value[-16:]
                        cipher = AES.new(master_key, AES.MODE_GCM, nonce=nonce)
                        decrypted_value = cipher.decrypt_and_verify(ciphertext, tag).decode('utf-8')
                     except ImportError:
                         pass
                     except Exception:
                         pass
            
            if decrypted_value:
                extracted_cookies.append({
                    "url": f"https://{host.lstrip('.')}{path}",
                    "domain": host,
                    "name": name,
                    "value": decrypted_value,
                    "path": path,
                    "secure": bool(secure),
                    "httpOnly": bool(httponly),
                    "expirationDate": expires / 1000000 - 11644473600
                })
                
        conn.close()
    except Exception:
        pass
    finally:
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

if __name__ == "__main__":
    try:
        # Check dependencies first
        try:
            from Crypto.Cipher import AES
        except ImportError:
            print(json.dumps({"error": "MISSING_DEPENDENCY", "message": "Please install pycryptodome: pip install pycryptodome"}))
            sys.exit(1)

        # Extract from System Browser (Chrome/Edge)
        all_cookies = get_all_browser_cookies("Chrome")
        if not all_cookies:
            all_cookies = get_all_browser_cookies("Edge")
            
        if all_cookies:
            print(json.dumps(all_cookies))
        else:
            print(json.dumps({"error": "NO_COOKIES", "message": "No YouTube/Google cookies found in Chrome or Edge. Please log in to YouTube in your browser first."}))

    except Exception as e:
        print(json.dumps({"error": "CRASH", "message": str(e)}))
