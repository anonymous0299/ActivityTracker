import win32gui
import win32process
import psutil
import logging

logging.basicConfig(level=logging.INFO)

def get_active_window():
    """
    Returns (app_name, window_title) of the current foreground window.
    """
    try:
        hwnd = win32gui.GetForegroundWindow()
        if not hwnd:
            return None, None

        title = win32gui.GetWindowText(hwnd)
        
        # Get process ID
        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        if pid == 0:
            return None, None
            
        try:
            proc = psutil.Process(pid)
            app_name = proc.name()
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            app_name = "Unknown"

        return app_name, title
    except Exception as e:
        logging.error(f"Error in win_tracker: {e}")
        return None, None
