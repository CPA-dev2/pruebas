"""
Capa de Servicio para la Lógica de Negocio del Flujo de Registro.
"""
from typing import List, Dict, Tuple, Any
from django.db import transaction
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import UploadedFile
from api.models import (
    Distributor, RegistrationRequest, RegistrationDocument, 
    RegistrationReference, RegistrationLocation, RegistrationTracking, 
    RegistrationAssignment, RegistrationRevision, Usuario
)
from api.utils.distributors.validators import (
    ensure_required_fields, ensure_at_least_n_refs,
    validate_document_payload, validate_state_transition,
    validate_all_pending
)
from api.tasks import process_rtu_for_request # Importar la tarea de Celery (ver archivo de tareas)

# --- Helpers Internos ---

def _create_tracking(request_obj, estado, observacion, user=None):
    """Crea un registro de tracking para la solicitud."""
    RegistrationTracking.objects.create(
        registration_request=request_obj,
        estado=estado,
        observacion=observacion,
        # created_by=user  (si tu modelo lo soporta)
    )

def _persist_documents(request_obj: RegistrationRequest, files: Dict[str, UploadedFile]) -> RegistrationDocument:
    """Guarda los archivos y retorna el documento RTU."""
    rtu_document = None
    required_docs = ['dpi_frontal', 'dpi_posterior', 'rtu', 'patente_comercio', 'factura_servicio']
    if not all(key in files for key in required_docs):
        raise ValidationError("Faltan documentos requeridos.")

    for tipo_documento, file_obj in files.items():
        if not file_obj: continue
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
    Promueve una Solicitud de Registro a un Distribuidor activo.
    Esta es la lógica de "graduación".
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
        estado=Distributor.Estado.ACTIVO
        # ... (copiar todos los demás campos relevantes)
    )
    
    # 2. Copiar/Promover entidades relacionadas
    # (Este es un ejemplo, la lógica puede variar si los modelos son idénticos o no)
    
    # Copiar Documentos
    for reg_doc in request_obj.registrationdocument_set.all():
        Document.objects.create(
            distribuidor=distributor,
            tipo_documento=reg_doc.tipo_documento,
            archivo=reg_doc.archivo, # Asume que se puede re-asignar el archivo
            estado='aprobado'
        )
        
    # Copiar Referencias
    for reg_ref in request_obj.registrationreference_set.all():
        Reference.objects.create(
            distribuidor=distributor,
            nombres=reg_ref.nombres,
            telefono=reg_ref.telefono,
            relacion=reg_ref.relacion,
            estado='aprobado'
        )
        
    # Copiar Ubicaciones
    for reg_loc in request_obj.registrationlocation_set.all():
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
    Crea una nueva Solicitud de Registro (Paso 1: Sincrónico).
    Guarda los datos base y los archivos, y lanza la tarea asíncrona
    para el procesamiento pesado del RTU.
    """
    try:
        # 1. Validar datos JSON
        required = [
            "nombres", "apellidos", "dpi", "correo", "telefono",
            "departamento", "municipio", "direccion", "antiguedad", 
            "productos_distribuidos", "tipo_persona"
        ]
        ensure_required_fields(data, required)
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
        # (Asegúrate de que 'api/tasks.py' tenga 'process_rtu_for_request')
        process_rtu_for_request.delay(request_obj.id, rtu_document.id)

        # 6. Tracking inicial
        _create_tracking(request_obj, "nuevo", "Solicitud recibida. RTU en cola de procesamiento.")

        return request_obj
    except Exception as e:
        raise ValidationError(f"Error al crear la solicitud: {str(e)}")


@transaction.atomic
def approve_registration_request(request_id: int, user: Usuario) -> Distributor:
    """
    Aprueba una solicitud de registro.
    Este es el paso final que "promueve" la solicitud a un Distribuidor.
    """
    try:
        request_obj = RegistrationRequest.objects.get(pk=request_id)
    except RegistrationRequest.DoesNotExist:
        raise ValidationError("Solicitud no encontrada.")

    # 1. Validar estado (solo se puede aprobar desde 'validado')
    if request_obj.estado != RegistrationRequest.Estado.VALIDADO:
        raise ValidationError(f"La solicitud debe estar en estado 'Validado' para ser aprobada. Estado actual: {request_obj.estado}")
        
    # 2. Validar que no quede nada pendiente (doble chequeo)
    validate_all_pending(request_obj)

    # 3. Crear el distribuidor activo
    distributor = _create_distributor_from_request(request_obj)
    
    # 4. Marcar la solicitud como Aprobada
    request_obj.estado = RegistrationRequest.Estado.APROBADO
    request_obj.save(update_fields=['estado'])
    
    _create_tracking(
        request_obj, 
        RegistrationRequest.Estado.APROBADO, 
        f"Solicitud aprobada por {user.username}. Se creó el Distribuidor ID: {distributor.id}"
    )
    
    return distributor

# (Aquí irían el resto de servicios:
# - update_registration_request
# - assign_request_to_user
# - create_registration_revision
# - update_registration_revision_status
# ...etc. Todos operando sobre los nuevos modelos)