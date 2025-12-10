from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "avanza_ocr_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["worker.tasks"]
)

# Configuración óptima para tareas cortas/medianas
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Guatemala",
    enable_utc=True,
    worker_prefetch_multiplier=1,  # Un task a la vez por worker para no saturar RAM con OCR
    task_acks_late=True,
    broker_connection_retry_on_startup=True,
)