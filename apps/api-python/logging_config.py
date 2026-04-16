"""Structured JSON logging with request-scoped correlation IDs.

Every log line includes:
- timestamp
- level
- logger name
- message
- request_id (if inside a request context)
- service: "api-python"
"""

import logging
from contextvars import ContextVar

from pythonjsonlogger import jsonlogger

request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    """Inject the current request_id into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get() or "-"
        record.service = "api-python"
        return True


def configure_logging(level: str = "INFO") -> None:
    """Replace stdlib logging config with a JSON formatter."""
    root = logging.getLogger()
    # Clear any existing handlers (uvicorn installs its own)
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s %(request_id)s %(service)s",
        rename_fields={"asctime": "timestamp", "levelname": "level"},
    )
    handler.setFormatter(formatter)
    handler.addFilter(RequestIdFilter())
    root.addHandler(handler)
    root.setLevel(level)

    # Align uvicorn's loggers with our config
    for uvicorn_logger in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        lg = logging.getLogger(uvicorn_logger)
        lg.handlers = []
        lg.propagate = True
