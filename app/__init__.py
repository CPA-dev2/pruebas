# Importa la app de Celery para que se cargue al iniciar Django
from  .celery import app as celery_app

__all__ = ('celery_app',)