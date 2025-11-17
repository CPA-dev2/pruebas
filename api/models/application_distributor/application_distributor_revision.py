from django.db import models
from django.conf import settings
from ..base_model import BaseModel
from .application_distributor_request import DistributorRequest
from ..usuario import Usuario


class RequestRevision(BaseModel):
    """
    Almacena una revisión específica (comentario/observación)
    de un campo o sección por un colaborador. Cumple Requisito 5.
    
    Reemplaza al obsoleto `Revisiondistributor`,
    vinculándose a la Solicitud.
    """
    request = models.ForeignKey(
        DistributorRequest,
        related_name='revisions',
        on_delete=models.CASCADE
    )
    usuario = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        help_text="Colaborador que realiza la revisión."
    )
    campo_revisado = models.CharField(
        max_length=100,
        help_text="Campo/sección (ej. 'nit', 'document_dpi', 'referencias')."
    )
    es_aprobado = models.BooleanField(
        help_text="True si el campo está OK, False si requiere corrección."
    )
    observacion = models.TextField(
        blank=True,
        help_text="Observaciones o motivo de rechazo del campo."
    )
    
    class Meta:
        verbose_name = "Revisión de Campo (Solicitud)"
        verbose_name_plural = "Revisiones de Campos (Solicitud)"
        ordering = ['-id']