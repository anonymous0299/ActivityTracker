import ctypes

class LASTINPUTINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_uint),
        ("dwTime", ctypes.c_uint)
    ]

def get_idle_duration():
    """
    Returns the idle time of the user (mouse/keyboard inactivity) in seconds.
    Uses lightweight Win32 API GetLastInputInfo.
    """
    lii = LASTINPUTINFO()
    lii.cbSize = ctypes.sizeof(LASTINPUTINFO)
    
    # Get Last Input Info from user32.dll
    if ctypes.windll.user32.GetLastInputInfo(ctypes.byref(lii)):
        # Calculate ticks difference
        uptime_ticks = ctypes.windll.kernel32.GetTickCount()
        idle_ticks = uptime_ticks - lii.dwTime
        return idle_ticks / 1000.0
    return 0.0
