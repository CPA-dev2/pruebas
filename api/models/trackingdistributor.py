from django.db import models

from api.models import registration_request
from .base_model import BaseModel


class Trackingdistributor(BaseModel):
    """
    Representa el seguimiento de un distribuidor en el sistema.

    Este modelo almacena información sobre las interacciones y el estado
    de un distribuidor específico. Hereda de `BaseModel` para incluir
    campos de auditoría y borrado lógico.

    Attributes:
        distribuidor (ForeignKey): Relación con el modelo `Distributor`.
        estado (str): El estado actual del distribuidor (ej. "Activo", "Inactivo").
        notas (TextField): Notas adicionales sobre el distribuidor.
    """
    registration_request = models.ForeignKey(
        registration_request.RegistrationRequest,
        on_delete=models.CASCADE,
        related_name="documentos",
        help_text="Solicitud asociada a la referencia."
    )
    estado = models.CharField(
        max_length=50,
        help_text="Estado actual del distribuidor (ej. 'Activo', 'Inactivo')."
    )
    observacion = models.TextField(
        blank=True,
        help_text="Observaciones adicionales sobre el distribuidor."
    )

    def __str__(self):
        """
        Devuelve una representación en cadena del seguimiento del distribuidor.
        """
        return f"Tracking de {self.registration_request.negocio_nombre} - {self.estado}"

    class Meta:
        verbose_name = "Tracking Solicitud"
        verbose_name_plural = "Tracking Solicitudes"