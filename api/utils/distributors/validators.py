from typing import List, Dict, Any
from django.db.models import Q
from django.core.exceptions import ValidationError # <-- Se importa la excepción correcta
from api.models import Revisiondistributor, Reference, Document

def ensure_required_fields(data: Dict[str, Any], fields: List[str]):
    missing = [f for f in fields if not data.get(f)]
    if missing:
        raise ValidationError(f"Campos obligatorios faltantes: {', '.join(missing)}")

def ensure_at_least_n_refs(refs: List[Any], n: int):
    if not refs or len(refs) < n:
        raise ValidationError(f"Se requieren al menos {n} referencias.")

def validate_document_payload(tipo: str, nombre: str):
    if tipo in ['dpi_frontal', 'dpi_posterior', 'patente_comercio']:
        if not (nombre.lower().endswith(('.png', '.jpg', '.jpeg'))):
            raise ValidationError(f"El documento '{tipo}' debe ser imagen PNG o JPG.")
    elif tipo == 'rtu':
        if not nombre.lower().endswith('.pdf'):
            raise ValidationError("El documento 'RTU' debe ser un archivo PDF.")

# Máquina de estados para la validación de transiciones
ALLOWED = {
    "nuevo": {"pendiente", "error_rtu"}, # Estado inicial
    "pendiente": {"revision"},
    "revision": {"validado", "aprobado", "rechazado"},
    "validado": {"aprobado", "rechazado", "revision"},
    "error_rtu": {"pendiente"}, # Estado de fallo que requiere acción manual
    "aprobado": set(),
    "rechazado": set(),
}

def validate_state_transition(old: str, new: str):
    """
    Valida que una transición de estado sea permitida por la máquina de estados.
    Lanza ValidationError si la transición es inválida.
    """
    if old not in ALLOWED:
        raise ValidationError(f"Estado de origen desconocido: '{old}'.")
    if new not in ALLOWED.get(old, set()):
        raise ValidationError(f"Transición de estado inválida: {old} -> {new}")

# --- Funciones auxiliares para verificar pendientes ---

def validate_revision_pending(distributor, revision=None) -> bool:
    """Verifica si hay revisiones pendientes, opcionalmente excluyendo la actual."""
    qs = Revisiondistributor.objects.filter(
        distribuidor=distributor, 
        aprobado=False, 
        is_deleted=False
    )
    if revision:
        qs = qs.exclude(pk=revision.pk)
    return qs.exists()

def validate_references_pending(distributor) -> bool:
    """Verifica si hay referencias pendientes."""
    return Reference.objects.filter(
        Q(estado__isnull=True) | Q(estado="rechazado"),
        distribuidor=distributor, 
        is_deleted=False
    ).exists()

def validate_documents_pending(distributor) -> bool:
    """Verifica si hay documentos pendientes."""
    return Document.objects.filter(
        Q(estado__isnull=True) | Q(estado="rechazado"),
        distribuidor=distributor, 
        is_deleted=False
    ).exists()

def validate_all_pending(distributor, revision=None):
    """
    Verifica todos los pendientes y lanza un error si se encuentra alguno.
    """
    if validate_revision_pending(distributor, revision):
        raise ValidationError("Existen revisiones pendientes que deben ser resueltas.")
    if validate_references_pending(distributor):
        raise ValidationError("Existen referencias pendientes que deben ser resueltas.")
    if validate_documents_pending(distributor):
        raise ValidationError("Existen documentos pendientes que deben ser resueltos.")