from typing import List, Dict, Tuple
from graphql import GraphQLError
from django.db import transaction

from api.models import (
    Distributor, Document, Reference, Location, 
    Trackingdistributor, Assignmentdistributor, Revisiondistributor
)
from api.utils.rtu_extractor import extract_rtu  # <-- ya no se usa en el camino principal
from api.utils.distributors.validators import (
    ensure_required_fields, ensure_at_least_n_refs,
    validate_document_payload, validate_state_transition,
    validate_revision_pending, validate_references_pending,
    validate_documents_pending, validate_all_pending
)
from api.utils.files import decode_base64_to_contentfile, write_bytes_to_temp_pdf

# ✨ Celery task
from api.tasks import process_distributor_rtu


# -------------------helpers para DistributorService ------------------- #

def _create_tracking_distributor(distributor, estado, observacion):
    """
    Crea un registro de Trackingdistributor para el distribuidor dado.
    """
    tracking_entry = Trackingdistributor(
        distribuidor=distributor,
        estado=estado,
        observacion=observacion
    )
    tracking_entry.save()


def _create_locations_from_rtu(distributor: Distributor, establecimientos: List[Dict]) -> List[Location]:
    """
    Crea registros de Location basados en los datos RTU extraídos.
    (Se mantiene para reutilizar en casos síncronos o utilidades.)
    """
    for est in establecimientos:
        nombre = est.get('nombre_comercial') or est.get('nombre') or 'Sin nombre'
        direccion = est.get('direccion') or 'No especificada'
        departamento = est.get('departamento') or 'No especificado'
        municipio = est.get('municipio') or 'No especificado'
        telefono = distributor.telefono_negocio or distributor.telefono or '00000000'
        location = Location(
            distribuidor=distributor,
            nombre=nombre,
            direccion=direccion,
            departamento=departamento,
            municipio=municipio,
            telefono=telefono
        )
        location.save()


def _persist_documents(distributor: Distributor, docs: List[Dict]) -> List[Document]:
    """
    Persiste los documentos asociados al distribuidor.
    Retorna la lista de Document creados.
    """
    out: List[Document] = []
    for dto in docs:
        validate_document_payload(dto.tipoDocumento, dto.nombreArchivo)
        content_file = dto.archivoData
        doc = Document.objects.create(
            distribuidor=distributor,
            tipo_documento=dto.tipoDocumento,
            archivo=content_file
        )
        out.append(doc)
    return out


# --- (Opcional) Camino SINCRONO antiguo: mantener como fallback/testing -------
def _extract_core_data_from_rtu(documents: List[Dict]) -> Tuple[str, str, List[Dict]]:
    """
    [LEGACY / Fallback] Busca RTU en documents, lo decodifica a PDF temporal,
    y extrae nit, razón social y establecimientos. Úsalo sólo si necesitas
    procesamiento in-line (tests/local), el camino principal ahora es Celery.
    """
    rtu = next((d for d in documents if d.tipoDocumento == "rtu"), None)
    if not rtu:
        raise GraphQLError("El documento RTU es obligatorio para crear un distribuidor.")

    pdf_upload = rtu.archivoData
    pdf_bytes = pdf_upload.read()

    # Asegura cleanup automático
    with write_bytes_to_temp_pdf(pdf_bytes) as pdf_path:
        data = extract_rtu(pdf_path)

    nit = data.get("nit")
    razon = data.get("razon_social")
    establecimientos = data.get("establecimientos", []) or []
    if not establecimientos:
        raise GraphQLError("El RTU debe contener al menos un establecimiento.")
    return nit, razon, establecimientos
# -----------------------------------------------------------------------------


def _switch_distributor_state(distributor: Distributor, new_state: str):
    """
    Cambia el estado del distribuidor y crea un registro de tracking.
    """
    old_state = distributor.estado
    validate_state_transition(old_state, new_state, distributor)
    distributor.estado = new_state
    distributor.save()


# ------------------- DistributorService ------------------- #

@transaction.atomic
def create_distributor(
    data: Dict,
    referencias: List[Dict],
    documentos: List[Dict]
) -> Distributor:
    """
    Crea un nuevo distribuidor con sus referencias y documentos asociados.
    Ahora el procesamiento del RTU se hace en background con Celery.
    """

    try:
        # 1) Validaciones de entrada
        required = [
            "nombres", "apellidos", "dpi", "correo", "telefono",
            "departamento", "municipio", "direccion",
            "antiguedad", "productos_distribuidos", "tipo_persona",
            "telefono_negocio", "equipamiento", "sucursales",
            "cuenta_bancaria", "numero_cuenta", "tipo_cuenta", "banco",
        ]
        ensure_required_fields(data, required)
        ensure_at_least_n_refs(referencias, n=2)

        # 2) Persistir Distributor (sin extraer RTU aquí)
        distributor = Distributor.objects.create(
            nombres=data["nombres"],
            apellidos=data["apellidos"],
            dpi=data["dpi"],
            correo=data["correo"],
            telefono=data["telefono"],
            departamento=data["departamento"],
            municipio=data["municipio"],
            direccion=data["direccion"],
            negocio_nombre=None,  # se llenará tras Celery
            nit=None,             # se llenará tras Celery
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
            estado=data.get("estado", "pendiente"),
        )

        # 3)  Persiste Referencias
        for r in referencias:
            Reference.objects.create(
                distribuidor=distributor, 
                nombres=r.nombres, 
                telefono=r.telefono, 
                relacion=r.relacion
            )

        # 4) Documentos
        created_docs = _persist_documents(distributor, documentos)

        # 5) Encolar procesamiento del RTU si hay RTU entre los documentos
        has_rtu = any(getattr(d, "tipoDocumento", None) == "rtu" for d in documentos)
        if has_rtu:
            process_distributor_rtu.delay(distributor.id)
            _create_tracking_distributor(
                distributor, "pendiente",
                "Distribuidor creado; RTU en proceso en background."
            )
        else:
            _create_tracking_distributor(
                distributor, "pendiente",
                "Distribuidor creado sin RTU; pendiente de carga de RTU."
            )

        return distributor
    except Exception as e:
        raise GraphQLError(f"Error al crear el distribuidor: {str(e)}")


@transaction.atomic
def update_distributor(distributor: Distributor, data: Dict) -> Distributor:
    try:
        distributor = Distributor.objects.get(pk=distributor.id)
    except Distributor.DoesNotExist:
        raise GraphQLError("Distribuidor no encontrado.")

    try:
        # Manejo de transición de estado (si viene)
        if "estado" in data:
            old = distributor.estado
            new = data["estado"]
            validate_state_transition(old, new)
            if new == "aprobado":
                validate_all_pending(distributor)

        # Campos simples
        updatable = [
            "nombres","apellidos","dpi","correo","telefono",
            "departamento","municipio","direccion",
            "negocio_nombre","nit","telefono_negocio","equipamiento",
            "sucursales","antiguedad","productos_distribuidos","tipo_persona",
            "cuenta_bancaria","numero_cuenta","tipo_cuenta","banco","estado",
        ]
        for f in updatable:
            if f in data and data[f] is not None:
                setattr(distributor, f, data[f])
        distributor.save()
        
        # Tracking si el estado cambió
        if "estado" in data and data["estado"] != old:
            _create_tracking_distributor(
                distributor, data["estado"],
                f"El distribuidor ha sido {data['estado']}."
            )

        return distributor
    except Exception as e:
        raise GraphQLError(f"Error al actualizar el distribuidor: {str(e)}")


@transaction.atomic
def add_documents_to_distributor(distributor: Distributor, document: dict) -> Document:
    """
    Agrega documentos adicionales a un distribuidor existente.
    Si el documento es RTU, encola re-procesamiento en background.
    """
    try:
        ensure_required_fields(document, ["archivo_data", "tipo_documento"])
        validate_document_payload(document["tipo_documento"], document["archivo_data"].name)

        # validación de duplicados
        existing_document = Document.objects.filter(
            distribuidor=distributor,
            tipo_documento=document["tipo_documento"],
            is_deleted=False
        ).first()
        if existing_document:
            raise GraphQLError(f"El documento de tipo '{existing_document.tipo_documento}' ya existe.")

        content = document["archivo_data"]

        new_document = Document(
            distribuidor=distributor, 
            tipo_documento=document["tipo_documento"], 
            archivo=content
        )
        new_document.save()

        # 🚀 Si es RTU, re-procesar en background
        if document["tipo_documento"] == "rtu":
            process_distributor_rtu.delay(distributor.id)
            _create_tracking_distributor(
                distributor, distributor.estado,
                "RTU cargado/actualizado; procesamiento en background encolado."
            )

        return new_document

    except Exception as e:
        raise GraphQLError(f"Error al agregar documento: {str(e)}")


@transaction.atomic
def update_document_to_distributor(document: Document, documentUpdate: dict) -> Document:
    """
    Actualiza un documento específico.
    Si el documento es RTU y cambia el archivo, re-encola el procesamiento.
    """
    try:
        archivo_cambiado = False

        if documentUpdate.get("archivo_data"):
            content = documentUpdate["archivo_data"]
            document.archivo = content
            archivo_cambiado = True

        if documentUpdate.get("estado") is not None:
            new_status = documentUpdate["estado"]
            document.estado = new_status

        document.save()

        # 🚀 Si es un RTU y cambiamos el archivo, re-procesar
        if archivo_cambiado and document.tipo_documento == "rtu":
            process_distributor_rtu.delay(document.distribuidor_id)
            _create_tracking_distributor(
                document.distribuidor, document.distribuidor.estado,
                "RTU actualizado; procesamiento en background encolado."
            )

        return document
    except Exception as e:
        raise GraphQLError(f"Error al actualizar el documento: {str(e)}")


@transaction.atomic
def assignment_distributor(distributor: Distributor, user) -> Assignmentdistributor:
    """
    Agrega una asignación al distribuidor.
    """
    try:
        existing = Assignmentdistributor.objects.filter(
            usuario=user,
            distribuidor=distributor,
            is_deleted=False
        ).first()
        if existing:
            raise GraphQLError("Ya existe una asignación activa para este distribuidor y usuario.")
        
        _switch_distributor_state(distributor, "revision")

        _create_tracking_distributor(
            distributor,
            "revision",
            f"El distribuidor ha sido asignado para revisión por el usuario {user.username}."
        )

        assignment = Assignmentdistributor.objects.create(
            usuario=user,
            distribuidor=distributor
        )
        return assignment

    except Exception as e:
        raise GraphQLError(f"Error al agregar asignación: {str(e)}")
    

@transaction.atomic
def create_revision_distributor(distributor: Distributor, revisions: List[Dict]) -> Revisiondistributor:
    """
    Crea una revisión para el distribuidor.
    """
    try:
        if not revisions or len(revisions) == 0:
            raise GraphQLError("Se requiere al menos una revisión para crear una entrada de revisión.")
        
        assignment = Assignmentdistributor.objects.filter(
            distribuidor=distributor,
            is_deleted=False
        ).first()
        if not assignment:
            raise GraphQLError("El distribuidor no tiene una asignación activa para revisión.")

        revisions_created = []
        for rev in revisions:
            ensure_required_fields(rev, ["seccion", "campo"])
            seccion = rev.get("seccion")
            campo = rev.get("campo")
            comentarios = rev.get("comentarios")
          
            revision = Revisiondistributor.objects.create(
                distribuidor=distributor,
                seccion=seccion,
                campo=campo,
                comentarios=comentarios or ""
            )
            revision.save()
            revisions_created.append(revision)

        if distributor.estado != "revision":
            _switch_distributor_state(distributor, "revision")
            _create_tracking_distributor(
                distributor,
                "revision",
                "El distribuidor ha sido puesto en revisión debido a nuevas observaciones."
            )

        return revisions_created

    except Exception as e:
        raise GraphQLError(f"Error al crear la revisión: {str(e)}")
    

@transaction.atomic
def update_revision_status(revision_id: int, data: Dict) -> Revisiondistributor:
    """
    Actualiza el estado de una revisión específica.
    """
    try:
        revision = Revisiondistributor.objects.get(pk=revision_id)
    except Revisiondistributor.DoesNotExist:
        raise GraphQLError("Revisión no encontrada.")

    # Actualizar campos de la revisión
    updatable_fields = ['aprobado', 'seccion', 'campo', 'comentarios']
    for field in updatable_fields:
        if field in data and data[field] is not None:
            setattr(revision, field, data[field])
    
    revision.save()

    # Si se aprueba, validar pendientes globales y mover estado
    if 'aprobado' in data and data['aprobado'] is True:
        if not validate_all_pending(revision.distribuidor, revision):
            _switch_distributor_state(revision.distribuidor, "validado")
            _create_tracking_distributor(
                revision.distribuidor,
                "validado",
                "El distribuidor ha sido validado tras la revisión de todas las observaciones."
            )
    return revision


@transaction.atomic
def delete_revision(revision_id: int) -> bool:
    """
    Marca una revisión como eliminada (soft delete).
    """
    try:
        revision = Revisiondistributor.objects.get(pk=revision_id)
    except Revisiondistributor.DoesNotExist:
        raise GraphQLError("Revisión no encontrada.")
    
    revision.is_deleted = True
    revision.save()
    return True














