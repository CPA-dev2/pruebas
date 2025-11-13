from django.db import models

from api.models import distributor
from .base_model import BaseModel

class Revisiondistributor(BaseModel):
    """
    Representa la revisión de un distribuidor en el sistema.

    Este modelo almacena información sobre las revisiones realizadas
    a un distribuidor específico. Hereda de `BaseModel` para incluir
    campos de auditoría y borrado lógico.

    Attributes:
        distribuidor (ForeignKey): Relación con el modelo `Distributor`.
        comentarios (TextField): Comentarios sobre la revisión del distribuidor.
        aprobado (BooleanField): Indica si el distribuidor fue aprobado en la revisión.
    """
    distribuidor = models.ForeignKey(
        distributor.Distributor,
        on_delete=models.CASCADE,
        related_name="revisions",
        help_text="Distribuidor asociado a la revisión."
    )
    seccion = models.CharField(
        max_length=100,
        blank=True,
        help_text="Sección del distribuidor que está siendo revisada."
    )
    campo = models.CharField(
        max_length=100,
        blank=True,
        help_text="Campo específico dentro de la sección que está siendo revisado."
    )
    comentarios = models.TextField(
        blank=True,
        help_text="Comentarios sobre la revisión del distribuidor."
    )
    aprobado = models.BooleanField(
        default=False,
        help_text="Indica si el distribuidor fue aprobado en la revisión."
    )

    def __str__(self):
        """
        Devuelve una representación en cadena de la revisión del distribuidor.
        """

        return f"Revisión de {self.distribuidor.negocio_nombre} - {self.distribuidor.estado}"

    class Meta:
        verbose_name = "Revisión Distributor"
        verbose_name_plural = "Revisiones Distributors"