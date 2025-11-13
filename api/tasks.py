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
from api.utils.ocr_extractor import (
    extract_text_from_file, extract_dpi_data, extract_rtu_data, extract_patente_data
)

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def process_documents_ocr(self, request_id: int):
    """
    Tarea asíncrona de Celery para procesar todos los documentos de una
    solicitud de registro a través de OCR.

    Orquesta la extracción de datos de DPI, RTU y Patente, actualiza
    la solicitud y gestiona los estados del flujo.
    """
    logger.info(f"Iniciando procesamiento OCR para Solicitud ID: {request_id}")
    
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        logger.error(f"Abortando: Solicitud ID {request_id} no existe.")
        return

    try:
        # Validar estado
        if request_obj.estado != RegistrationRequest.Estado.PROCESANDO_DOCUMENTOS:
            logger.warning(f"Solicitud ID {request_id} ya no está en estado 'PROCESANDO'. Abortando.")
            return

        documents = request_obj.registrationdocument_set.filter(is_deleted=False)
        doc_paths = {doc.tipo_documento: doc.archivo.path for doc in documents}

        updates = {}
        cross_validation_errors = []

        # --- 1. Procesar DPI ---
        if 'dpi_file' in doc_paths:
            dpi_text = extract_text_from_file(doc_paths['dpi_file'])
            dpi_data = extract_dpi_data(dpi_text)
            if dpi_data.get('dpi') and dpi_data['dpi'] != request_obj.dpi:
                cross_validation_errors.append(f"DPI del documento ({dpi_data['dpi']}) no coincide con el ingresado ({request_obj.dpi}).")
            # Podríamos opcionalmente rellenar nombres/apellidos si están vacíos
            # updates['nombres'] = dpi_data.get('nombres') or request_obj.nombres

        # --- 2. Procesar RTU ---
        if 'rtu_file' in doc_paths:
            rtu_data = extract_rtu_data(doc_paths['rtu_file'])
            if rtu_data.get('nit'):
                updates['nit'] = rtu_data['nit']
            if rtu_data.get('razon_social'):
                updates['negocio_nombre'] = rtu_data['razon_social']

            establecimientos = rtu_data.get("establecimientos", [])
            if not establecimientos:
                raise ValueError("El RTU debe contener al menos un establecimiento.")

        # --- 3. Procesar Patente de Comercio (opcional) ---
        if 'patente_comercio_file' in doc_paths:
            patente_text = extract_text_from_file(doc_paths['patente_comercio_file'])
            patente_data = extract_patente_data(patente_text)
            # Lógica para usar datos de la patente...

        with transaction.atomic():
            # Aplicar actualizaciones a la solicitud
            for key, value in updates.items():
                setattr(request_obj, key, value)

            # Crear ubicaciones del RTU
            RegistrationLocation.objects.filter(registration_request=request_obj).delete() # Limpiar previas
            for est in establecimientos:
                RegistrationLocation.objects.create(
                    registration_request=request_obj,
                    nombre=est.get('nombre_comercial', 'Sin nombre'),
                    direccion=est.get('direccion', 'No especificada'),
                    departamento=est.get('departamento'),
                    municipio=est.get('municipio'),
                    telefono=request_obj.telefono_negocio or request_obj.telefono
                )
            
            # Gestionar estado final y observaciones
            if cross_validation_errors:
                request_obj.observaciones = "Errores de validación cruzada:\n" + "\n".join(cross_validation_errors)
                request_obj.estado = RegistrationRequest.Estado.PENDIENTE_ASIGNACION # Aún se puede asignar, pero con errores
            else:
                request_obj.estado = RegistrationRequest.Estado.PENDIENTE_ASIGNACION

            request_obj.save()

            RegistrationTracking.objects.create(
                registration_request=request_obj,
                estado=request_obj.estado,
                observacion='Procesamiento OCR completado.' + (' Con errores de validación.' if cross_validation_errors else '')
            )
        
        logger.info(f"Procesamiento OCR completado para Solicitud ID: {request_id}")

    except Exception as e:
        logger.error(f"Fallo el procesamiento OCR para Solicitud ID {request_id}: {str(e)}")
        request_obj.estado = RegistrationRequest.Estado.ERROR_OCR
        request_obj.save(update_fields=['estado'])
        RegistrationTracking.objects.create(
            registration_request=request_obj,
            estado=RegistrationRequest.Estado.ERROR_OCR,
            observacion=f"Fallo en el procesamiento automático de documentos: {str(e)}"
        )
        self.retry(exc=e)