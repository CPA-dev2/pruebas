from django.db import models

from api.models import registration_request
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
    registration_request = models.ForeignKey(
        registration_request.RegistrationRequest,
        on_delete=models.CASCADE,
        related_name="documentos",
        help_text="Solicitud asociada a la referencia."
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

        return f"Revisión de {self.registration_request.negocio_nombre} - {self.registration_request.estado}"

    class Meta:
        verbose_name = "Revisión de Solicitud Distributor"
        verbose_name_plural = "Revisiones de Solicitudes Distributores"