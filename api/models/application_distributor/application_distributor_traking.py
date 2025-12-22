from django.db import models
from django.conf import settings
from ..base_model import BaseModel
from .application_distributor_request import DistributorRequest
from .application_distributor_states import RequestState



class RequestTracking(BaseModel):
    """
    Registra un historial (audit trail) de CADA cambio de estado
    en una solicitud. Cumple Requisito 5 (audit trail).
    
    Reemplaza al obsoleto `Trackingdistributor`,
    vinculándose a la Solicitud, no al Distribuidor final.
    """
    request = models.ForeignKey(
        DistributorRequest,
        related_name='tracking_log',
        on_delete=models.CASCADE
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="Usuario que realizó el cambio (o sistema)."
    )
    estado_anterior = models.CharField(
        max_length=50, 
        choices=RequestState.choices, 
        null=True, blank=True
    )
    estado_nuevo = models.CharField(
        max_length=50, 
        choices=RequestState.choices
    )
    comentario = models.TextField(
        blank=True,
        help_text="Motivo del cambio (ej. 'Rechazado por NIT inválido')."
    )

    class Meta:
        verbose_name = "Log de Seguimiento de Solicitud"
        verbose_name_plural = "Logs de Seguimiento de Solicitud"
        ordering = ['-id']