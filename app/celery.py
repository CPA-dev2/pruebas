import os
from celery import Celery

# Establece el módulo de configuración de Django por defecto para el programa 'celery'.
# Esto asegura que Celery sepa dónde encontrar tus settings.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

app = Celery('app')

# Usar una cadena aquí significa que el trabajador no tiene que serializar
# el objeto de configuración a los procesos hijos.
# - namespace='CELERY' significa que todas las claves de configuración relacionadas con celery
#   deben tener el prefijo 'CELERY_' en tu archivo settings.py.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Carga los módulos de tareas de todas las configuraciones de aplicaciones de Django registradas.
# Esto buscará automáticamente un archivo 'tasks.py' en cada una de tus apps (como 'api/tasks.py').
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')