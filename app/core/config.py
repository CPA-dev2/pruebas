import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

class Settings:
    """
    Configuración centralizada del microservicio.
    """
    PROJECT_NAME: str = "AvanzaOCR GraphQL Service"
    VERSION: str = "1.0.0"
    
    # Configuración de Redis
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    # Rutas de archivos
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    TEMP_DIR = os.path.join(BASE_DIR, "media", "temp")

settings = Settings()

# Asegurar que existan los directorios
os.makedirs(settings.TEMP_DIR, exist_ok=True)