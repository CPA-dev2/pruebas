import os
from celery import Celery

# Establece el módulo de settings de Django para el programa 'celery'.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')

# Crea la instancia de la aplicación Celery
# 'app' es el nombre de tu proyecto (la carpeta que contiene settings.py)
app = Celery('app')

# Carga la configuración desde los settings de Django
# El 'namespace='CELERY'' significa que todas las claves de 
# configuración en settings.py deben empezar con "CELERY_"
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-descubre tareas en todas las apps de Django
# Celery buscará automáticamente archivos llamados 'tasks.py' 
# dentro de cada app en INSTALLED_APPS (como 'api/tasks.py')
app.autodiscover_tasks()