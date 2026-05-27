import time
import datetime
import logging
import subprocess
import os

from config import PING_INTERVAL, IDLE_THRESHOLD
from modules.win_tracker import get_active_window
from modules.browser_tracker import get_browser_url
from modules.idle_detector import get_idle_duration
from modules.sync_client import (
    init_db,
    send_ping_to_backend,
    start_token_receiver_server,
    is_tracking_enabled
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)


def clean_app_name(app_name):
    if not app_name:
        return ""

    return (
        app_name
        .removesuffix(".exe")
        .replace("_", " ")
        .title()
    )


def start_services():
    """
    Start backend and frontend automatically
    """

    try:
        # Get root project folder
        BASE_DIR = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..")
        )

        backend_path = os.path.join(BASE_DIR, "backend")
        frontend_path = os.path.join(BASE_DIR, "frontend")

        logging.info("Starting backend server...")

        subprocess.Popen(
            ["cmd", "/c", "npm run dev"],
            cwd=backend_path
        )

        time.sleep(5)

        logging.info("Starting frontend server...")

        subprocess.Popen(
            ["cmd", "/c", "npm run dev"],
            cwd=frontend_path
        )

        time.sleep(5)

        logging.info("Frontend + Backend started.")

    except Exception as e:
        logging.error(
            f"Failed to start services: {e}"
        )


def main():
    logging.info("Starting WorkTrack AI Background Agent...")

    # Start frontend/backend
    start_services()

    # Initialize DB
    init_db()

    # Start token receiver
    start_token_receiver_server()

    logging.info(
        "Agent started successfully. Listening for active window changes..."
    )

    while True:
        try:
            if not is_tracking_enabled():
                logging.info("Tracking paused by user.")
                time.sleep(PING_INTERVAL)
                continue

            idle_sec = get_idle_duration()
            is_idle = idle_sec >= IDLE_THRESHOLD

            timestamp = (
                datetime.datetime.now(
                    datetime.UTC
                ).isoformat()
            )

            if is_idle:
                logging.info(
                    f"User is IDLE ({idle_sec:.1f}s inactive)."
                )

                send_ping_to_backend(
                    appName="System Idle",
                    windowTitle="User is Idle",
                    browserUrl="",
                    isIdle=True,
                    timestamp=timestamp
                )

            else:
                app_name, window_title = get_active_window()

                if app_name and window_title:

                    cleaned_app_name = clean_app_name(
                        app_name
                    )

                    browser_url = get_browser_url(
                        app_name,
                        window_title
                    )

                    logging.info(
                        f"Active window: "
                        f"{cleaned_app_name} | "
                        f"{window_title} | "
                        f"URL: {browser_url}"
                    )

                    send_ping_to_backend(
                        appName=cleaned_app_name,
                        windowTitle=window_title,
                        browserUrl="",
                        isIdle=False,
                        timestamp=timestamp
                    )

        except Exception as e:
            logging.error(
                f"Error in tracking loop: {e}"
            )

        time.sleep(PING_INTERVAL)


if __name__ == "__main__":
    main()