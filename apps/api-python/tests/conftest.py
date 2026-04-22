"""Pytest conftest — force-set test env vars BEFORE any module imports.

Both main.py and services/roadmap_service.py call get_settings() at import
or instantiation time. Missing or empty env would raise ValidationError
before tests can patch anything. This conftest unconditionally overrides
with safe test placeholder values.
"""

import os

# Use direct assignment (not setdefault) so empty shell values don't win
_TEST_ENV = {
    "SUPABASE_URL": "https://test.supabase.co",
    "SUPABASE_SECRET_KEY": "sb_secret_test",
    "ANTHROPIC_API_KEY": "test-anthropic-key",
    "INTERNAL_API_KEY": "test-internal-key-long-enough-16",
    "ENVIRONMENT": "test",
}

for key, value in _TEST_ENV.items():
    if not os.environ.get(key):
        os.environ[key] = value
