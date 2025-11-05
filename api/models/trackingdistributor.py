from django.db import models

from api.models import distributor
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
    distribuidor = models.ForeignKey(
        distributor.Distributor,
        on_delete=models.CASCADE,
        related_name="trackingdistributors",
        help_text="Distribuidor asociado al seguimiento."
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
        return f"Tracking de {self.distribuidor.negocio_nombre} - {self.estado}"

    class Meta:
        verbose_name = "Tracking Distributor"
        verbose_name_plural = "Tracking Distributors"