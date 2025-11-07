"""
Función para el formateo de tiempo.
HH:MM:SS o Xd HH:MM:SS según la duración (en horas o en días).
"""

def humanize_seconds(s: int) -> str:
    if not s or s < 0: return "00:00:00"
    s = int(s)
    d, r = divmod(s, 86400); h, r = divmod(r, 3600); m, s = divmod(r, 60)
    return f"{d}d {h:02}:{m:02}:{s:02}" if d else f"{h:02}:{m:02}:{s:02}"
