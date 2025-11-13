"""
Módulo de Tareas Asíncronas (Celery).

Contiene tareas pesadas o de larga duración que se ejecutan en segundo plano
para no bloquear el servidor web, como el procesamiento de archivos PDF.
"""
import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from api.models import (
    RegistrationRequest, RegistrationDocument, RegistrationLocation, RegistrationTracking
)
from api.utils.rtu_extractor import extract_rtu

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_rtu_for_request(self, request_id: int):
    """
    Tarea asíncrona de Celery para procesar el RTU de una Solicitud de Registro.

    Esta tarea es bloqueante (CPU/IO) y se ejecuta en un worker de Celery.
    1.  Encuentra la solicitud y su documento RTU.
    2.  Extrae datos del PDF.
    3.  Actualiza la solicitud con el NIT, Razón Social y estado 'PENDIENTE'.
    4.  Crea las Ubicaciones (sucursales) extraídas del RTU.
    5.  Crea un registro de tracking para reflejar el resultado.
    
    Args:
        self (celery.Task): La instancia de la tarea (inyectada por `bind=True`).
        request_id (int): El ID de la RegistrationRequest a procesar.

    Raises:
        ValueError: Si los datos del RTU son inválidos o faltan.
        RegistrationRequest.DoesNotExist: Si la solicitud no se encuentra.
    """
    logger.info(f"Iniciando procesamiento de RTU para Solicitud ID: {request_id}")
    
    # Usamos 'request_obj' para mantener una referencia en caso de error
    request_obj = None 
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
        
        # Validar estado: solo procesar si está en 'nuevo'
        if request_obj.estado != RegistrationRequest.Estado.NUEVO:
            logger.warning(f"Solicitud ID {request_id} ya no está en estado 'nuevo'. Abortando.")
            return

        rtu_document = RegistrationDocument.objects.filter(
            registration_request=request_obj,
            tipo_documento='rtu',
            is_deleted=False
        ).first()

        if not rtu_document:
            raise ValueError("No se encontró el documento RTU para procesar.")

        # --- 1. Procesamiento de PDF (Lento, pero seguro en Celery) ---
        pdf_path = rtu_document.archivo.path
        data = extract_rtu(pdf_path)

        nit = data.get("nit")
        razon = data.get("razon_social")
        establecimientos = data.get("establecimientos", []) or []

        if not nit or not razon:
            raise ValueError("No se pudo extraer el NIT o la Razón Social del RTU.")
        if not establecimientos:
            raise ValueError("El RTU debe contener al menos un establecimiento.")

        with transaction.atomic():
            # --- 2. Actualizar Solicitud ---
            request_obj.nit = nit
            request_obj.negocio_nombre = razon
            request_obj.estado = RegistrationRequest.Estado.PENDIENTE
            request_obj.save(update_fields=['nit', 'negocio_nombre', 'estado'])

            # --- 3. Crear Ubicaciones (Sucursales) ---
            for est in establecimientos:
                RegistrationLocation.objects.create(
                    registration_request=request_obj,
                    nombre=est.get('nombre_comercial') or est.get('nombre') or 'Sin nombre',
                    direccion=est.get('direccion') or 'No especificada',
                    departamento=est.get('departamento') or 'No especificado',
                    municipio=est.get('municipio') or 'No especificado',
                    telefono=request_obj.telefono_negocio or request_obj.telefono or '00000000'
                )
            
            # --- 4. Actualizar Tracking (Directamente) ---
            RegistrationTracking.objects.create(
                registration_request=request_obj,
                estado=RegistrationRequest.Estado.PENDIENTE,
                observacion='Perfil creado y RTU procesado automáticamente.'
            )
        
        logger.info(f"Procesamiento de RTU completado para Solicitud ID: {request_id}")

    except RegistrationRequest.DoesNotExist:
        logger.error(f"Fallo la tarea: Solicitud ID {request_id} no existe.")
        # No se reintenta si el objeto no existe.
        
    except Exception as e:
        logger.error(f"Fallo el procesamiento de RTU para Solicitud ID {request_id}: {str(e)}")
        if request_obj:
            # Si hay un error de validación o procesamiento, marcar para revisión manual.
            request_obj.estado = RegistrationRequest.Estado.ERROR_RTU
            request_obj.save(update_fields=['estado'])
            RegistrationTracking.objects.create(
                registration_request=request_obj,
                estado=RegistrationRequest.Estado.ERROR_RTU,
                observacion=f"Fallo en el procesamiento automático del RTU: {str(e)}"
            )
        
        # Reintentar la tarea (ej. por bloqueo de archivo, error de red temporal)
        self.retry(exc=e)