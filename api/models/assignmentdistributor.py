from django.db import models

from api.models import distributor
from api.models import usuario
from .base_model import BaseModel

class Assignmentdistributor(BaseModel):
    """
    Representa la asignación de un distribuidor a un usuario.

    Este modelo almacena información sobre qué usuario está asignado
    a qué distribuidor para su revisión. Hereda de `BaseModel` para incluir
    campos de auditoría y borrado lógico.

    Attributes:
        distribuidor (ForeignKey): Relación con el modelo `Distributor`.
        usuario (ForeignKey): Relación con el modelo `Usuario`.
        fecha_asignacion (DateTimeField): Fecha y hora de la asignación.
    """
    distribuidor = models.ForeignKey(
        distributor.Distributor,
        on_delete=models.CASCADE,
        related_name="assignments",
        help_text="Distribuidor asignado al usuario."
    )
    usuario = models.ForeignKey(
        usuario.Usuario,
        on_delete=models.CASCADE,
        related_name="assignments",
        help_text="Usuario al que se le asigna el distribuidor."
    )
    def __str__(self):
        """
        Devuelve una representación en cadena de la asignación.
        """
        return f"Asignación de {self.distribuidor.negocio_nombre} a {self.usuario.username}"

    class Meta:
        verbose_name = "Asignación"
        verbose_name_plural = "Asignaciones"