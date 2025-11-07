
from celery import shared_task, Task
from celery.utils.log import get_task_logger
from django.db import transaction
from django.apps import apps
from api.models import Distributor, Trackingdistributor, Location, Document
from api.utils.rtu_extractor import extract_rtu

logger = get_task_logger(__name__)

class BaseDistributorTask(Task):
    """
    Clase base de Tarea Celery personalizada.
    
    Hereda de 'celery.Task' para definir comportamientos reusables
    como 'on_failure' y 'on_success' que se ejecutarán
    automáticamente para todas las tareas que usen esta base.
    """
    
    # Define un nombre para la tarea base (opcional pero recomendado)
    name = "BaseDistributorTask"

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        """
        Manejador de evento que se ejecuta cuando la tarea falla permanentemente.
        """
        logger.error(f'Tarea {task_id} falló: {exc}', exc_info=True)
        
        # Intenta registrar el fallo en el tracking del distribuidor
        try:
            # Asumimos que el primer argumento de nuestras tareas es siempre 'distributor_id'
            distributor_id = args[0] 
            distributor = Distributor.objects.get(pk=distributor_id)
            Trackingdistributor.objects.create(
                distributor=distributor,
                estado='error_procesamiento',
                comments=f"Error fatal en Tarea Celery {task_id}: {exc}"
            )
        except Exception as e:
            logger.error(f"No se pudo guardar el error de la tarea en el tracking: {e}")

    def on_success(self, retval, task_id, args, kwargs):
        """
        Manejador de evento que se ejecuta cuando la tarea tiene éxito.
        """
        logger.info(f'Tarea {task_id} completada exitosamente. Resultado: {retval}')

# REFACTOR: El decorador '@shared_task' sigue igual, pero ahora
# apunta a nuestra clase base correcta usando 'base=BaseDistributorTask'.
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
        # Usar apps.get_model es más seguro dentro de tareas de Celery
        Distributor = apps.get_model('api', 'Distributor')
        distributor = Distributor.objects.get(pk=distributor_id)
        logger.info(f"Iniciando procesamiento de RTU para Distribuidor ID: {distributor_id}")

        # 1. Encontrar el documento RTU
        Document = apps.get_model('api', 'Document')
        rtu_document = Document.objects.filter(
            distributor=distributor, 
            tipoDocumento='rtu',
            is_deleted=False
        ).first()

        if not rtu_document or not rtu_document.archivo:
            logger.warning(f"No se encontró documento RTU para el distribuidor {distributor_id}. Abortando.")
            return f"No RTU document found for distributor {distributor_id}."

        # 2. Intentar la extracción de datos
        try:
            rtu_data = extract_rtu(rtu_document.archivo.path)
            logger.info(f"Extracción de RTU exitosa para {distributor_id}. Data: {rtu_data}")

            if not rtu_data or not rtu_data.get('nit') or not rtu_data.get('nombre_negocio'):
                raise ValueError("La extracción de RTU no devolvió los datos esperados (NIT o Nombre).")

        # 3. MEJORA DE ROBUSTEZ: Manejar fallos de extracción
        except Exception as e:
            logger.error(f"Fallo al extraer datos del RTU para {distributor_id}: {e}", exc_info=True)
            
            with transaction.atomic():
                distributor.estado = 'correccion'
                distributor.save()
                
                Trackingdistributor = apps.get_model('api', 'Trackingdistributor')
                Trackingdistributor.objects.create(
                    distributor=distributor,
                    estado='correccion',
                    comments=f"Error automático al procesar RTU: {str(e)}. Requiere revisión manual."
                )
            return f"RTU extraction failed for {distributor_id}."

        # 4. MEJORA DE ATOMICIDAD: Guardar los datos extraídos en la BD
        try:
            with transaction.atomic():
                # 4.1. Actualizar el distribuidor
                distributor.negocio_nombre = rtu_data.get('nombre_negocio')
                distributor.nit = rtu_data.get('nit')
                distributor.save()

                # 4.2. Crear las ubicaciones (Locations)
                if rtu_data.get('locations'):
                    Location = apps.get_model('api', 'Location')
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
                
                # 4.3. Registrar en el tracking
                Trackingdistributor = apps.get_model('api', 'Trackingdistributor')
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