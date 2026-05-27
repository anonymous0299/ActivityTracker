import os
import json
import sqlite3
import requests
import logging
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from config import CONFIG_FILE, SQLITE_DB, BACKEND_URL

logging.basicConfig(level=logging.INFO)

# Setup offline SQLite DB
def init_db():
    conn = sqlite3.connect(SQLITE_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pending_pings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            appName TEXT,
            windowTitle TEXT,
            browserUrl TEXT,
            isIdle INTEGER,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

def save_ping_offline(appName, windowTitle, browserUrl, isIdle, timestamp):
    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO pending_pings (appName, windowTitle, browserUrl, isIdle, timestamp)
            VALUES (?, ?, ?, ?, ?)
        ''', (appName, windowTitle, browserUrl, 1 if isIdle else 0, timestamp))
        conn.commit()
        conn.close()
        logging.info("Cached tracking ping offline.")
    except Exception as e:
        logging.error(f"Error saving offline ping: {e}")

def load_token():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                data = json.load(f)
                return data.get('token')
        except Exception:
            pass
    return None

def is_tracking_enabled():

    token = load_token()

    if not token:
        return True

    headers = {
        "Authorization": f"Bearer {token}"
    }

    try:
        response = requests.get(
            "http://localhost:5005/api/settings",
            headers=headers,
            timeout=5
        )

        if response.status_code == 200:
            settings = response.json()

            return settings.get(
                "trackingEnabled",
                True
            )

    except Exception as e:
        logging.error(f"Settings error: {e}")

    return True

def send_ping_to_backend(appName, windowTitle, browserUrl, isIdle, timestamp):
    token = load_token()
    if not token:
        # Buffer offline if token is not available yet
        save_ping_offline(appName, windowTitle, browserUrl, isIdle, timestamp)
        logging.warning("User is not authenticated. Ping cached offline.")
        return False

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Always save the live ping offline FIRST to guarantee chronological order
    save_ping_offline(appName, windowTitle, browserUrl, isIdle, timestamp)
    
    # Then sync the entire offline buffer in chronological order
    return sync_offline_buffer(headers)

def sync_offline_buffer(headers):
    try:
        conn = sqlite3.connect(SQLITE_DB)
        cursor = conn.cursor()
        cursor.execute("SELECT id, appName, windowTitle, browserUrl, isIdle, timestamp FROM pending_pings ORDER BY id ASC LIMIT 50")
        rows = cursor.fetchall()
        
        if not rows:
            conn.close()
            return True

        logging.info(f"Syncing {len(rows)} cached offline logs...")
        
        to_delete = []
        success = True
        for row in rows:
            db_id, appName, windowTitle, browserUrl, isIdle, timestamp = row
            payload = {
                "appName": appName,
                "windowTitle": windowTitle,
                "browserUrl": browserUrl,
                "isIdle": bool(isIdle),
                "timestamp": timestamp
            }
            try:
                res = requests.post(BACKEND_URL, json=payload, headers=headers, timeout=5)
                if res.status_code == 200:
                    to_delete.append(db_id)
                elif res.status_code == 401:
                    logging.error("Unauthorized ping: Token expired or invalid.")
                    if os.path.exists(CONFIG_FILE):
                        try:
                            os.remove(CONFIG_FILE)
                        except Exception:
                            pass
                    success = False
                    break
                else:
                    success = False
                    break  # Stop syncing if we hit a server error
            except Exception:
                success = False
                break  # Stop syncing if network went down again

        if to_delete:
            cursor.execute(f"DELETE FROM pending_pings WHERE id IN ({','.join(map(str, to_delete))})")
            conn.commit()
            
        conn.close()
        return success
    except Exception as e:
        logging.error(f"Error syncing offline buffer: {e}")
        return False

# Tiny HTTP Server to receive token from the React client automatically
class TokenReceiverHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass # Suppress server logging console spam

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = self.headers.get('Content-Length')
            if content_length:
                post_data = self.rfile.read(int(content_length))
                data = json.loads(post_data.decode('utf-8'))
            else:
                data = {}
            
            token = data.get('token')
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Headers', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            if token:
                with open(CONFIG_FILE, 'w') as f:
                    json.dump({'token': token}, f)
                logging.info("Authenticated token synchronized successfully from browser.")
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            else:
                self.wfile.write(json.dumps({'success': False, 'message': 'Token field is missing'}).encode('utf-8'))
        except Exception as e:
            logging.error(f"Error handling token post: {e}")
            self.send_error(500)

def start_token_receiver_server():
    def run_server():
        try:
            server = HTTPServer(('127.0.0.1', 5050), TokenReceiverHandler)
            logging.info("Local token receiver gateway initialized on port 5050.")
            server.serve_forever()
        except Exception as e:
            logging.error(f"Failed to start token server: {e}")

    t = threading.Thread(target=run_server, daemon=True)
    t.start()
