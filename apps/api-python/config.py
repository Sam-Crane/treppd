"""Environment configuration for the FastAPI intelligence service.

Uses pydantic-settings so all required env vars are validated at startup.
If any are missing or malformed, the process fails immediately with a
readable error listing each problem — no silent None defaults.
"""

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )

    # Anthropic
    ANTHROPIC_API_KEY: str = Field(..., min_length=1)

    # Supabase
    SUPABASE_URL: str = Field(..., min_length=1)
    SUPABASE_SERVICE_KEY: str = Field(..., min_length=1)
    DATABASE_URL: str | None = None

    # Internal API key (shared with NestJS)
    INTERNAL_API_KEY: str = Field(..., min_length=16)

    # Runtime
    ENVIRONMENT: Literal["development", "staging", "production", "test"] = (
        "development"
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings instance.

    The first call validates env vars and raises ValidationError on failure.
    """
    return Settings()  # type: ignore[call-arg]
