"""Custom exceptions for the scraper."""


class ScraperException(Exception):
    """Base exception for scraper errors."""

    pass


class AuthenticationError(ScraperException):
    """Raised when not authenticated on a platform."""

    pass


class RateLimitError(ScraperException):
    """Raised when rate limited by a platform."""

    pass


class CaptchaError(ScraperException):
    """Raised when a CAPTCHA is detected."""

    pass


class ResponseExtractionError(ScraperException):
    """Raised when unable to extract response from page."""

    pass
