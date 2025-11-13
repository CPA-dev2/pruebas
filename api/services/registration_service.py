"""
Capa de Servicio para la Lógica de Negocio del Flujo de Registro.

Este módulo centraliza todos los "casos de uso" para manejar una Solicitud de Registro.
Está completamente desacoplado de GraphQL:
- No importa `GraphQLError`.
- Lanza `django.core.exceptions.ValidationError` para errores de negocio.
- Lanza `PermissionDenied` para errores de autorización.
"""
from typing import List, Dict, Tuple, Any
from django.db import transaction
from django.core.exceptions import ValidationError, PermissionDenied
from django.core.files.uploadedfile import UploadedFile
from api.models import (
    Distributor, RegistrationRequest, RegistrationDocument, 
    RegistrationReference, RegistrationLocation, RegistrationTracking, 
    RegistrationRevision, Usuario, Document, Reference, Location
)
from api.utils.distributors.validators import (
    ensure_required_fields, ensure_at_least_n_refs,
    validate_document_payload, validate_state_transition,
    validate_all_pending
)
# Se importa la tarea de Celery para lanzarla
from api.tasks import process_documents_ocr

# --- Helpers Internos (reutilizables dentro de este servicio) ---

def _create_tracking(request_obj: RegistrationRequest, estado: str, observacion: str, user: Usuario = None):
    """
    Crea un registro de tracking para la solicitud.
    
    Args:
        request_obj: La solicitud a la que se asocia el tracking.
        estado: El estado actual que se está registrando.
        observacion: Una descripción legible de la acción.
        user: El usuario que realiza la acción (opcional).
    """
    RegistrationTracking.objects.create(
        registration_request=request_obj,
        estado=estado,
        observacion=observacion,
        # created_by=user  # Descomentar si tu modelo Tracking lo soporta
    )

def _persist_documents(request_obj: RegistrationRequest, files: Dict[str, UploadedFile]) -> RegistrationDocument:
    """
    Guarda los archivos físicos y crea los registros en la base de datos.
    
    Args:
        request_obj: La solicitud a la que se asocian los documentos.
        files: Un diccionario de archivos subidos (ej. {'rtu': <File>}).

    Returns:
        RegistrationDocument: El objeto del documento RTU que se guardó.
    
    Raises:
        ValidationError: Si faltan documentos requeridos o si un archivo no es válido.
    """
    rtu_document = None
    required_docs = ['dpi_frontal', 'dpi_posterior', 'rtu', 'patente_comercio', 'factura_servicio']
    
    if not all(key in files for key in required_docs):
        missing = [key for key in required_docs if key not in files]
        raise ValidationError(f"Faltan documentos requeridos: {', '.join(missing)}")

    for tipo_documento, file_obj in files.items():
        if not file_obj:
            raise ValidationError(f"El archivo para '{tipo_documento}' no puede estar vacío.")
            
        validate_document_payload(tipo_documento, file_obj.name)
        
        doc = RegistrationDocument.objects.create(
            registration_request=request_obj,
            tipo_documento=tipo_documento,
            archivo=file_obj
        )
        if tipo_documento == 'rtu':
            rtu_document = doc
    
    if not rtu_document:
        raise ValidationError("El documento RTU es obligatorio.")
    return rtu_document

@transaction.atomic
def _create_distributor_from_request(request_obj: RegistrationRequest) -> Distributor:
    """
    "Gradúa" una Solicitud de Registro a un Distribuidor activo.
    Copia todos los datos validados de las tablas de 'Registration'
    a las tablas de producción 'Distributor'.
    
    Args:
        request_obj: La solicitud de registro aprobada.

    Returns:
        Distributor: El nuevo objeto de distribuidor activo.
    """
    # 1. Crear el Distribuidor principal
    distributor = Distributor.objects.create(
        registration_request=request_obj,
        nombres=request_obj.nombres,
        apellidos=request_obj.apellidos,
        dpi=request_obj.dpi,
        correo=request_obj.correo,
        telefono=request_obj.telefono,
        departamento=request_obj.departamento,
        municipio=request_obj.municipio,
        direccion=request_obj.direccion,
        negocio_nombre=request_obj.negocio_nombre,
        nit=request_obj.nit,
        telefono_negocio=request_obj.telefono_negocio,
        equipamiento=request_obj.equipamiento,
        sucursales=request_obj.sucursales,
        antiguedad=request_obj.antiguedad,
        productos_distribuidos=request_obj.productos_distribuidos,
        tipo_persona=request_obj.tipo_persona,
        cuenta_bancaria=request_obj.cuenta_bancaria,
        numero_cuenta=request_obj.numero_cuenta,
        tipo_cuenta=request_obj.tipo_cuenta,
        banco=request_obj.banco,
        estado=Distributor.Estado.ACTIVO
    )
    
    # 2. Copiar/Promover entidades relacionadas (solo las aprobadas)
    
    for reg_doc in request_obj.registrationdocument_set.filter(is_deleted=False, estado='aprobado'):
        Document.objects.create(
            distribuidor=distributor,
            tipo_documento=reg_doc.tipo_documento,
            archivo=reg_doc.archivo,
            estado='aprobado'
        )
        
    for reg_ref in request_obj.registrationreference_set.filter(is_deleted=False, estado='aprobado'):
        Reference.objects.create(
            distribuidor=distributor,
            nombres=reg_ref.nombres,
            telefono=reg_ref.telefono,
            relacion=reg_ref.relacion,
            estado='aprobado'
        )
        
    for reg_loc in request_obj.registrationlocation_set.filter(is_deleted=False, estado='aprobado'):
        Location.objects.create(
            distribuidor=distributor,
            nombre=reg_loc.nombre,
            direccion=reg_loc.direccion,
            departamento=reg_loc.departamento,
            municipio=reg_loc.municipio,
            telefono=reg_loc.telefono,
            estado='aprobado'
        )
        
    return distributor

# --- Servicios Públicos (Casos de Uso) ---

@transaction.atomic
def create_registration_request(data: Dict[str, Any],
                                referencias: List[Dict[str, Any]],
                                files: Dict[str, UploadedFile]
                               ) -> RegistrationRequest:
    """
    Crea una nueva Solicitud de Registro.
    
    Este es el punto de entrada principal. Valida los datos, guarda la solicitud
    con un estado inicial de 'procesando_documentos', y lanza una tarea asíncrona
    de Celery para el OCR de los documentos.

    Args:
        data: Diccionario con los datos del formulario.
        referencias: Lista de diccionarios con datos de referencias.
        files: Diccionario de archivos subidos.

    Returns:
        RegistrationRequest: La instancia de la solicitud creada.
    
    Raises:
        ValidationError: Si faltan datos, no hay suficientes referencias,
                         o si los documentos son inválidos.
    """
    try:
        # 1. Validar datos JSON
        required_fields = [
            "nombres", "apellidos", "dpi", "correo", "telefono",
            "departamento", "municipio", "direccion", "antiguedad", 
            "productos_distribuidos", "tipo_persona"
        ]
        ensure_required_fields(data, required_fields)
        ensure_at_least_n_refs(referencias, n=3)

        # 2. Crear la Solicitud en estado inicial
        request_obj = RegistrationRequest.objects.create(
            nombres=data["nombres"],
            apellidos=data["apellidos"],
            dpi=data["dpi"],
            correo=data["correo"],
            telefono=data["telefono"],
            departamento=data["departamento"],
            municipio=data["municipio"],
            direccion=data["direccion"],
            telefono_negocio=data.get("telefono_negocio"),
            equipamiento=data.get("equipamiento"),
            sucursales=data.get("sucursales"),
            antiguedad=data["antiguedad"],
            productos_distribuidos=data["productos_distribuidos"],
            tipo_persona=data["tipo_persona"],
            cuenta_bancaria=data.get("cuenta_bancaria"),
            numero_cuenta=data.get("numero_cuenta"),
            tipo_cuenta=data.get("tipo_cuenta"),
            banco=data.get("banco"),
            estado=RegistrationRequest.Estado.PROCESANDO_DOCUMENTOS,
        )

        # 3. Crear Referencias
        for r in referencias:
            RegistrationReference.objects.create(
                registration_request=request_obj, 
                nombres=r.get('nombres'), 
                telefono=r.get('telefono'), 
                relacion=r.get('relacion')
            )

        # 4. Guardar Archivos y obtener el RTU
        rtu_document = _persist_documents(request_obj, files)

        # 5. Lanzar Tarea Asíncrona para OCR
        process_documents_ocr.delay(request_obj.id)

        # 6. Tracking inicial
        _create_tracking(
            request_obj,
            request_obj.estado,
            "Solicitud recibida. Documentos en cola para procesamiento OCR."
        )

        return request_obj
    except Exception as e:
        # Lanza un error de validación genérico que la mutación puede capturar
        raise ValidationError(f"Error al crear la solicitud: {str(e)}")


@transaction.atomic
def approve_registration_request(request_id: int, user: Usuario) -> Distributor:
    """
    Aprueba una solicitud de registro ('validado' -> 'aprobado')
    y la promueve a un Distribuidor activo.

    Args:
        request_id: El ID de la solicitud a aprobar.
        user: El usuario (admin) que realiza la aprobación.

    Returns:
        Distributor: El nuevo objeto de distribuidor activo.
    
    Raises:
        ValidationError: Si la solicitud no existe, no está en el
                         estado 'validado', o si aún tiene revisiones pendientes.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    # 1. Validar estado
    validate_state_transition(request_obj.estado, RegistrationRequest.Estado.APROBADO)
        
    # 2. Validar que no quede nada pendiente
    validate_all_pending(request_obj)

    # 3. Crear el distribuidor activo (copiando los datos)
    distributor = _create_distributor_from_request(request_obj)
    
    # 4. Marcar la solicitud como Aprobada
    request_obj.estado = RegistrationRequest.Estado.APROBADO
    request_obj.save(update_fields=['estado'])
    
    _create_tracking(
        request_obj, 
        RegistrationRequest.Estado.APROBADO, 
        f"Solicitud aprobada por {user.username}. Se creó el Distribuidor ID: {distributor.id}",
        user
    )
    
    return distributor

# --- Servicios de Flujo de Aprobación (Refactorizados) ---

@transaction.atomic
def assign_registration_request(request_id: int, assignee_id: int, assigner_user: Usuario) -> RegistrationRequest:
    """
    Asigna una solicitud de registro a un colaborador para su revisión.
    Cambia el estado de 'pendiente_asignacion' a 'asignada'.

    Args:
        request_id: El ID de la solicitud a asignar.
        assignee_id: El ID del colaborador que revisará la solicitud.
        assigner_user: El usuario (admin/supervisor) que realiza la asignación.

    Returns:
        RegistrationRequest: La solicitud actualizada.
    
    Raises:
        ValidationError: Si la solicitud o el usuario no existen, si no está
                         en el estado correcto, o si ya está asignada.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
        assignee = Usuario.objects.get(pk=assignee_id)
    except (RegistrationRequest.DoesNotExist, Usuario.DoesNotExist):
        raise ValidationError("Solicitud o usuario no encontrado.")

    validate_state_transition(request_obj.estado, RegistrationRequest.Estado.ASIGNADA)
    
    if request_obj.assignment_key is not None:
        raise ValidationError(f"La solicitud ya está asignada a {request_obj.assignment_key.username}.")
        
    # Asignar y cambiar estado
    request_obj.assignment_key = assignee
    request_obj.estado = RegistrationRequest.Estado.ASIGNADA
    request_obj.save(update_fields=['assignment_key', 'estado'])

    _create_tracking(
        request_obj,
        request_obj.estado,
        f"Solicitud asignada a {assignee.username} por {assigner_user.username}.",
        assigner_user
    )
    return request_obj

@transaction.atomic
def submit_review(request_id: int, observaciones: str, user: Usuario) -> RegistrationRequest:
    """
    El revisor envía correcciones/observaciones al solicitante.
    Cambia el estado a 'pendiente_correcciones'.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    if request_obj.assignment_key != user:
        raise PermissionDenied("No tienes permiso para revisar esta solicitud.")

    validate_state_transition(request_obj.estado, RegistrationRequest.Estado.PENDIENTE_CORRECCIONES)

    request_obj.observaciones = observaciones
    request_obj.estado = RegistrationRequest.Estado.PENDIENTE_CORRECCIONES
    request_obj.save(update_fields=['observaciones', 'estado'])

    _create_tracking(
        request_obj,
        request_obj.estado,
        f"El revisor {user.username} solicitó correcciones.",
        user
    )
    return request_obj

@transaction.atomic
def resubmit_request(request_id: int) -> RegistrationRequest:
    """
    El solicitante reenvía la solicitud tras realizar correcciones.
    Cambia el estado a 'en_revision'.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    validate_state_transition(request_obj.estado, RegistrationRequest.Estado.EN_REVISION)

    request_obj.estado = RegistrationRequest.Estado.EN_REVISION
    request_obj.save(update_fields=['estado'])

    _create_tracking(
        request_obj,
        request_obj.estado,
        "El solicitante ha reenviado la solicitud con correcciones."
    )
    return request_obj

@transaction.atomic
def send_to_approval(request_id: int, user: Usuario) -> RegistrationRequest:
    """
    El revisor considera que todo está correcto y lo envía para aprobación final.
    Cambia el estado a 'pendiente_aprobacion'.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    if request_obj.assignment_key != user:
        raise PermissionDenied("No tienes permiso para enviar a aprobación esta solicitud.")

    validate_state_transition(request_obj.estado, RegistrationRequest.Estado.PENDIENTE_APROBACION)

    # Opcional: Validar que no queden documentos o referencias en estado 'rechazado'
    # validate_all_pending(request_obj)

    request_obj.estado = RegistrationRequest.Estado.PENDIENTE_APROBACION
    request_obj.save(update_fields=['estado'])

    _create_tracking(
        request_obj,
        request_obj.estado,
        f"Revisor {user.username} envió la solicitud para aprobación final.",
        user
    )
    return request_obj