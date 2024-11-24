"""Session management configuration"""

# Session lifetime in seconds (1 hour)
SESSION_LIFETIME = 3600

# Session refresh threshold in seconds (5 minutes)
SESSION_REFRESH_THRESHOLD = 300

# Cookie security settings
COOKIE_SECURE = True
COOKIE_HTTPONLY = True
COOKIE_SAMESITE = "lax"

# Cleanup interval in seconds (1 hour)
SESSION_CLEANUP_INTERVAL = 3600
