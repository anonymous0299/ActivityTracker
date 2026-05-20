import time
import datetime
import logging
from config import PING_INTERVAL, IDLE_THRESHOLD
from modules.win_tracker import get_active_window
from modules.browser_tracker import get_browser_url
from modules.idle_detector import get_idle_duration
from modules.sync_client import init_db, send_ping_to_backend, start_token_receiver_server

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

def main():
    logging.info("Starting WorkTrack AI Background Agent...")
    
    # 1. Initialize SQLite storage database
    init_db()
    
    # 2. Spawn token synchronizer thread
    start_token_receiver_server()
    
    logging.info("Agent started successfully. Listening for active window changes...")

    while True:
        try:
            # 3. Retrieve system idle state
            idle_sec = get_idle_duration()
            is_idle = idle_sec >= IDLE_THRESHOLD

            timestamp = datetime.datetime.utcnow().isoformat() + "Z"

            if is_idle:
                logging.info(f"User is IDLE ({idle_sec:.1f}s inactive). Sending idle ping...")
                send_ping_to_backend(
                    appName="System Idle",
                    windowTitle="User is Idle",
                    browserUrl="",
                    isIdle=True,
                    timestamp=timestamp
                )
            else:
                # 4. Extract foreground window title/app
                app_name, window_title = get_active_window()
                
                if app_name and window_title:
                    # 5. Extract browser URL if foreground app is a browser
                    browser_url = get_browser_url(app_name, window_title)
                    
                    logging.info(f"Active window: {app_name} | {window_title} | URL: {browser_url}")
                    
                    send_ping_to_backend(
                        appName=app_name,
                        windowTitle=window_title,
                        browserUrl=browser_url or "",
                        isIdle=False,
                        timestamp=timestamp
                    )
                else:
                    logging.debug("No foreground window active.")
                    
        except Exception as e:
            logging.error(f"Error in tracking loop: {e}")
            
        time.sleep(PING_INTERVAL)

if __name__ == "__main__":
    main()
