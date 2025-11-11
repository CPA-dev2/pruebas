# api/tasks.py

# REFACTOR: Importar 'Task' de celery para usarlo como clase base
from celery import shared_task, Task
from celery.utils.log import get_task_logger
from django.db import transaction
from django.apps import apps
from api.utils.rtu_extractor import extract_rtu

# Es más seguro usar apps.get_model en tareas para evitar
# problemas de registro de apps al arranque.
Distributor = apps.get_model('api', 'Distributor')
Document = apps.get_model('api', 'Document')
Location = apps.get_model('api', 'Location')
Trackingdistributor = apps.get_model('api', 'Trackingdistributor')

logger = get_task_logger(__name__)

# REFACTOR: La clase base debe heredar de 'celery.Task', no de 'shared_task'
class BaseDistributorTask(Task):
    """
    Clase base de Tarea Celery personalizada.
    
    Hereda de 'celery.Task' para definir comportamientos reusables
    como 'on_failure' y 'on_success' que se ejecutarán
    automáticamente para todas las tareas que usen esta base.
    """
    name = "BaseDistributorTask"

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Manejador de evento que se ejecuta cuando la tarea falla permanentemente
        (después de todos los reintentos).
        """
        logger.error(f'Tarea {task_id} falló permanentemente: {exc}', exc_info=True)
        try:
            distributor_id = args[0]
            distributor = Distributor.objects.get(pk=distributor_id)
            Trackingdistributor.objects.create(
                distributor=distributor,
                estado='error_procesamiento',
                comments=f"Error fatal en Tarea Celery {task_id}: {str(exc)}"
            )
        except Exception as e:
            logger.error(f"No se pudo guardar el error de la tarea en el tracking: {e}")

    def on_success(self, retval, task_id, args, kwargs):
        logger.info(f'Tarea {task_id} completada exitosamente. Resultado: {retval}')

# REFACTOR: El decorador '@shared_task' ahora usa 'base=BaseDistributorTask'
@shared_task(bind=True, base=BaseDistributorTask, max_retries=3, default_retry_delay=60)
def process_distributor_rtu(self, distributor_id):
    """
    Tarea asíncrona de Celery para procesar el documento RTU de un distribuidor.
    
    1. Busca el distribuidor y su documento RTU.
    2. Llama al servicio de extracción de OCR (extract_rtu).
    3. Maneja fallos de extracción (PDF corrupto) y actualiza el estado a 'correccion'.
    4. Si tiene éxito, actualiza el distribuidor y crea sus ubicaciones (Location)
       dentro de una transacción de BD atómica.
    """
    try:
        distributor = Distributor.objects.get(pk=distributor_id)
        logger.info(f"Iniciando procesamiento de RTU para Distribuidor ID: {distributor_id}")

        rtu_document = Document.objects.filter(
            distributor=distributor, 
            tipoDocumento='rtu',
            is_deleted=False
        ).first()

        if not rtu_document or not rtu_document.archivo:
            logger.warning(f"No se encontró documento RTU para {distributor_id}. Abortando.")
            return f"No RTU document found for distributor {distributor_id}."

        # 2. Intentar la extracción de datos
        try:
            rtu_data = extract_rtu(rtu_document.archivo.path)
            if not rtu_data or not rtu_data.get('nit') or not rtu_data.get('nombre_negocio'):
                raise ValueError("La extracción de RTU no devolvió los datos esperados (NIT o Nombre).")
            logger.info(f"Extracción de RTU exitosa para {distributor_id}.")

        # 3. MEJORA DE ROBUSTEZ: Manejar fallos de extracción
        except Exception as e:
            logger.error(f"Fallo al extraer datos del RTU para {distributor_id}: {e}", exc_info=True)
            with transaction.atomic():
                distributor.estado = 'correccion'
                distributor.save()
                Trackingdistributor.objects.create(
                    distributor=distributor,
                    estado='correccion',
                    comments=f"Error automático al procesar RTU: {str(e)}. Requiere revisión manual."
                )
            return f"RTU extraction failed for {distributor_id}."

        # 4. MEJORA DE ATOMICIDAD: Guardar los datos extraídos en la BD
        try:
            with transaction.atomic():
                distributor.negocio_nombre = rtu_data.get('nombre_negocio')
                distributor.nit = rtu_data.get('nit')
                distributor.save()

                if rtu_data.get('locations'):
                    Location.objects.bulk_create([
                        Location(
                            distributor=distributor,
                            nombre=loc.get('nombre'),
                            departamento=loc.get('departamento'),
                            municipio=loc.get('municipio'),
                            direccion=loc.get('direccion'),
                            telefono=loc.get('telefono', ''),
                            estado='pendiente'
                        ) for loc in rtu_data['locations']
                    ])
                
                Trackingdistributor.objects.create(
                    distributor=distributor,
                    estado=distributor.estado,
                    comments=f"Procesamiento de RTU completado. NIT: {rtu_data.get('nit')}."
                )
            return f"Distribuidor {distributor_id} actualizado con datos de RTU."

        except Exception as db_e:
            logger.error(f"Error al guardar datos de RTU en BD para {distributor_id}: {db_e}")
            raise self.retry(exc=db_e) # Reintentar si falla el guardado en BD

    except Distributor.DoesNotExist:
        logger.warning(f"La tarea {self.request.id} buscó el Distribuidor {distributor_id} pero no existe.")
        return f"Distributor {distributor_id} not found."
    
    except Exception as e:
        logger.error(f"Error inesperado en tarea process_distributor_rtu para {distributor_id}: {e}")
        raise self.retry(exc=e)

# Aquí irían otras tareas asíncronas, como la validación de DPI
# @shared_task(bind=True, base=BaseDistributorTask)
# def process_distributor_dpi(self, distributor_id, dpi_data_ingresado):
#     ...