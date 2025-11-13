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
from api.tasks import process_rtu_for_request

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
    Crea una nueva Solicitud de Registro (Paso 1: Sincrónico y Rápido).
    
    Valida los datos JSON, guarda los archivos físicos y lanza la tarea
    asíncrona (Celery) para el procesamiento pesado del RTU.
    Responde instantáneamente a la API.

    Args:
        data: Diccionario con los datos del formulario (personales, negocio, etc.).
        referencias: Lista de diccionarios con datos de referencias.
        files: Diccionario de objetos UploadedFile (multipart/form-data).

    Returns:
        RegistrationRequest: La nueva instancia de solicitud creada (en estado 'nuevo').
    
    Raises:
        ValidationError: Si faltan campos, no hay suficientes referencias,
                         faltan documentos o hay un error de guardado.
    """
    try:
        # 1. Validar datos JSON
        required_fields = [
            "nombres", "apellidos", "dpi", "correo", "telefono",
            "departamento", "municipio", "direccion", "antiguedad", 
            "productos_distribuidos", "tipo_persona"
        ]
        ensure_required_fields(data, required_fields)
        ensure_at_least_n_refs(referencias, n=2)

        # 2. Crear la Solicitud en estado 'NUEVO'
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
            estado=RegistrationRequest.Estado.NUEVO,
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

        # 5. Lanzar Tarea Asíncrona (RTU)
        process_rtu_for_request.delay(request_obj.id)

        # 6. Tracking inicial
        _create_tracking(request_obj, "nuevo", "Solicitud recibida. RTU en cola de procesamiento.")

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
def assign_registration_request(request_id: int, user: Usuario) -> RegistrationRequest:
    """
    Asigna una solicitud de registro a un usuario (revisor).
    Cambia el estado de 'pendiente' a 'revision'.

    Args:
        request_id: El ID de la solicitud a asignar.
        user: El usuario al que se le asignará la solicitud.

    Returns:
        RegistrationRequest: La solicitud actualizada.
    
    Raises:
        ValidationError: Si la solicitud no está en estado 'pendiente'
                         o si ya está asignada.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    if request_obj.estado != RegistrationRequest.Estado.PENDIENTE:
        raise ValidationError("La solicitud solo puede asignarse si está en estado 'pendiente'.")
    
    if request_obj.asignado_a is not None:
        raise ValidationError(f"La solicitud ya está asignada a {request_obj.asignado_a.username}.")
        
    # Asignar y cambiar estado
    request_obj.asignado_a = user
    request_obj.estado = RegistrationRequest.Estado.REVISION
    request_obj.save(update_fields=['asignado_a', 'estado'])

    _create_tracking(
        request_obj,
        RegistrationRequest.Estado.REVISION,
        f"Solicitud asignada a {user.username} para revisión.",
        user
    )
    return request_obj

@transaction.atomic
def create_registration_revision(request_id: int, revisions_data: List[Dict], user: Usuario) -> List[RegistrationRevision]:
    """
    Crea una o más observaciones (revisiones) para una solicitud.
    
    Args:
        request_id: El ID de la solicitud.
        revisions_data: Lista de diccionarios con los datos de la revisión.
        user: El usuario (revisor) que crea las revisiones.
    
    Returns:
        List[RegistrationRevision]: Las revisiones creadas.
        
    Raises:
        PermissionDenied: Si el usuario no es el asignado a la solicitud.
        ValidationError: Si faltan datos en la revisión.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    if request_obj.asignado_a != user:
        raise PermissionDenied("No tienes esta solicitud asignada para crear revisiones.")
    
    if not revisions_data:
        raise ValidationError("Se requiere al menos una revisión.")

    revisions_created = []
    for rev in revisions_data:
        ensure_required_fields(rev, ["seccion", "campo"])
        revision = RegistrationRevision.objects.create(
            registration_request=request_obj,
            seccion=rev.get("seccion"),
            campo=rev.get("campo"),
            comentarios=rev.get("comentarios", "")
            # created_by=user (si el modelo lo soporta)
        )
        revisions_created.append(revision)

    _create_tracking(
        request_obj,
        RegistrationRequest.Estado.REVISION,
        f"Se agregaron {len(revisions_created)} nuevas observaciones por {user.username}.",
        user
    )

    return revisions_created
    
@transaction.atomic
def update_registration_revision_status(revision_id: int, data: Dict, user: Usuario) -> RegistrationRevision:
    """
    Actualiza una revisión (ej. la marca como aprobada).
    Si es la última revisión pendiente, actualiza el estado de la solicitud a 'validado'.

    Args:
        revision_id: El ID de la revisión a actualizar.
        data: Diccionario con los campos a actualizar (ej. {'aprobado': True}).
        user: El usuario que realiza la acción.

    Returns:
        RegistrationRevision: La revisión actualizada.
        
    Raises:
        PermissionDenied: Si el usuario no es el asignado.
        ValidationError: Si la revisión no se encuentra.
    """
    try:
        revision = RegistrationRevision.objects.get(pk=revision_id)
    except RegistrationRevision.DoesNotExist:
        raise ValidationError("Revisión no encontrada.")

    if revision.registration_request.asignado_a != user:
        raise PermissionDenied("No tienes esta solicitud asignada para modificar revisiones.")

    # Actualizar campos
    updatable_fields = ['aprobado', 'seccion', 'campo', 'comentarios']
    for field in updatable_fields:
        if field in data and data[field] is not None:
            setattr(revision, field, data[field])
    revision.save()

    # Si se acaba de aprobar, verificar si ya no quedan pendientes
    if data.get('aprobado') is True:
        try:
            # `validate_all_pending` lanza un error si algo sigue pendiente
            validate_all_pending(revision.registration_request, revision=revision)
            
            # Si no hay error, todo está aprobado. Cambiamos el estado a 'validado'.
            revision.registration_request.estado = RegistrationRequest.Estado.VALIDADO
            revision.registration_request.save(update_fields=['estado'])
            
            _create_tracking(
                revision.registration_request,
                RegistrationRequest.Estado.VALIDADO,
                "Todas las revisiones, documentos y referencias han sido aprobados. Listo para aprobación final.",
                user
            )
        except ValidationError:
            # Aún quedan pendientes, no hacemos nada.
            pass
            
    return revision