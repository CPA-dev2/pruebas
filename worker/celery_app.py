from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "avanza_ocr_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["worker.tasks"]
)

# Configuración optimizada para IA
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="America/Guatemala",
    enable_utc=True,
    worker_prefetch_multiplier=1, # IMPORTANTE: 1 a la vez para no saturar RAM con la IA
    task_acks_late=True,
    broker_connection_retry_on_startup=True,
    # Aislamiento de Cola
    task_default_queue="avanza_ocr_queue",
    task_default_exchange="avanza_ocr_exchange",
    task_default_routing_key="avanza_ocr_key",
)