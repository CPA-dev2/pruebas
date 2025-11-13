from typing import List, Dict, Any
from django.db.models import Q
from graphql import GraphQLError
from api.models import Revisiondistributor, Reference, Document

def ensure_required_fields(data: Dict[str, Any], fields: List[str]):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise GraphQLError(f"Campos obligatorios faltantes: {', '.join(missing)}")

def ensure_at_least_n_refs(refs: List[Any], n: int):
    if len(refs) < n:
        raise GraphQLError(f"Se requieren al menos {n} referencias.")

def validate_document_payload(tipo: str, nombre: str):
    if tipo in ['dpi_frontal', 'dpi_posterior', 'patente_comercio']:
        if not (nombre.lower().endswith(('.png', '.jpg', '.jpeg'))):
            raise GraphQLError(f"El documento '{tipo}' debe ser imagen PNG o JPG.")
    elif tipo == 'rtu':
        if not nombre.lower().endswith('.pdf'):
            raise GraphQLError("El documento 'RTU' debe ser un archivo PDF.")

# Máquina de estados para la validación de transiciones de estado de distribuidores
ALLOWED = {
    "pendiente": {"revision"},
    "revision": {"validado", "aprobado", "rechazado"},
    "validado": {"aprobado", "rechazado", "revision"},
    "aprobado": set(),
    "rechazado": set(),
}

def validate_state_transition(old: str, new: str):
    if old in ("aprobado", "rechazado"):
        raise GraphQLError(f"No se puede modificar el estado desde '{old}'.")
    if new not in ALLOWED.get(old, set()):
        raise GraphQLError(f"Transición de estado inválida: {old} -> {new}")
    

def validate_revision_pending(distributor, revision) -> bool:
    pending_revisions = Revisiondistributor.objects.filter(
        distribuidor=distributor, 
        aprobado=False, 
        is_deleted=False
    ).exclude(pk=revision.pk)
    return pending_revisions.exists()

def validate_references_pending(distributor) -> bool:
    pending_refs = Reference.objects.filter(
        Q(estado__isnull=True) | Q(estado="rechazado"),
        distribuidor=distributor, 
        is_deleted=False
    )
    return pending_refs.exists()

def validate_documents_pending(distributor) -> bool:
    pending_docs = Document.objects.filter(
        Q(estado__isnull=True) | Q(estado="rechazado"),
        distribuidor=distributor, 
        is_deleted=False
    )
    return pending_docs.exists()

def validate_all_pending(distributor, revision) -> bool:

    if validate_revision_pending(distributor, revision):
        raise GraphQLError("Existen revisiones pendientes que deben ser resueltas antes de cambiar el estado.")
    if validate_references_pending(distributor):
        raise GraphQLError("Existen referencias pendientes que deben ser resueltas antes de cambiar el estado.")
    if validate_documents_pending(distributor):
        raise GraphQLError("Existen documentos pendientes que deben ser resueltos antes de cambiar el estado.")
    return False


