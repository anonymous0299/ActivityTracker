import re
import logging

try:
    import uiautomation as auto
except ImportError:
    auto = None

logging.basicConfig(level=logging.INFO)

# Regular expression to extract domain from window titles as fallback
DOMAIN_REGEX = re.compile(r'([a-zA-Z0-9-]+\.[a-zA-Z]{2,63})')

def get_browser_url(app_name, window_title):
    """
    Attempts to fetch URL using UI Automation. Falls back to parsing domain from title if unsuccessful.
    """
    app_lower = app_name.lower()
    
    # Check if app is a supported browser
    is_browser = False
    for browser in ['chrome', 'msedge', 'firefox', 'brave', 'opera']:
        if browser in app_lower:
            is_browser = True
            break
            
    if not is_browser:
        return None

    url = None

    # Try UIAutomation if available
    if auto:
        try:
            # Set search timeout to be small so it doesn't hang the loop
            auto.SetGlobalSearchTimeout(1.0)
            
            # Find the browser window element
            browser_window = auto.WindowControl(searchDepth=1, ClassName='Chrome_WidgetWin_1')
            if not browser_window.Exists(0.5):
                # Try finding by name/title
                browser_window = auto.WindowControl(searchDepth=1, Name=window_title)
                
            if browser_window.Exists(0.5):
                # Chrome / Edge / Brave address bar element search
                # Address bar class name is typically 'Edit' or it has control type EditControl
                edit_ctrl = browser_window.EditControl(searchDepth=8, name='Address and search bar')
                if not edit_ctrl.Exists(0.2):
                    edit_ctrl = browser_window.EditControl(searchDepth=8)
                    
                if edit_ctrl.Exists(0.2):
                    raw_val = edit_ctrl.GetValuePattern().Value
                    if raw_val:
                        if not raw_val.startswith('http://') and not raw_val.startswith('https://'):
                            url = 'https://' + raw_val
                        else:
                            url = raw_val
        except Exception as e:
            # Don't fail, fallback to parsing
            logging.debug(f"UIAutomation URL fetch failed: {e}")

    # Fallback: Parse domain from title if URL is still empty
    if not url:
        matches = DOMAIN_REGEX.findall(window_title)
        if matches:
            # Return first match as a mock URL
            url = f"https://{matches[0]}"
            
    return url
