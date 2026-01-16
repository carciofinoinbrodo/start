"""Configuration management using Pydantic Settings."""

from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# Base directory of the project
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class BrowserSettings(BaseSettings):
    """Browser automation settings."""

    model_config = SettingsConfigDict(env_prefix="BROWSER_")

    headless: bool = False
    timeout_seconds: int = 60


class ScraperSettings(BaseSettings):
    """Scraper behavior settings."""

    model_config = SettingsConfigDict(env_prefix="SCRAPER_")

    min_delay_seconds: int = 30
    max_delay_seconds: int = 60
    take_screenshots: bool = False


class Settings(BaseSettings):
    """Main application settings."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Application
    app_name: str = "AISEO Scraper"
    debug: bool = False
    log_level: str = "INFO"

    # Sub-settings
    browser: BrowserSettings = Field(default_factory=BrowserSettings)
    scraper: ScraperSettings = Field(default_factory=ScraperSettings)

    # Paths
    data_dir: Path = BASE_DIR / "data"
    results_dir: Path = BASE_DIR / "data" / "results"
    screenshots_dir: Path = BASE_DIR / "data" / "screenshots"

    def ensure_directories(self) -> None:
        """Create required directories if they don't exist."""
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.results_dir.mkdir(parents=True, exist_ok=True)
        self.screenshots_dir.mkdir(parents=True, exist_ok=True)


# Global settings instance
settings = Settings()
