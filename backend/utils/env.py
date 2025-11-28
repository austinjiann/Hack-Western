from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    GOOGLE_CLOUD_PROJECT: str
    GOOGLE_CLOUD_LOCATION: str
    GOOGLE_GENAI_USE_VERTEXAI: bool
    GOOGLE_CLOUD_BUCKET_NAME: str
    REDIS_URL: str
    SUPABASE_URL: str
    SUPABASE_KEY: str
    AUTUMN_SECRET_KEY: str
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True  # Add this line
    )
settings = Settings()
