from django.db import models

from api.models import registration_request
from .base_model import BaseModel

class Reference(BaseModel):
    """
    Representa una referencia asociada a un distribuidor.

    Las referencias son contactos que pueden proporcionar información adicional
    sobre un distribuidor. Hereda de `BaseModel` para incluir campos de auditoría
    y borrado lógico.

    Attributes:
        distribuidor (ForeignKey): Relación con el modelo `Distributor`.
        nombres (str): El nombre de la referencia.
        telefono (str): El número de teléfono de la referencia.
        relacion (str): La relación de la referencia con el distribuidor.
    """
    registration_request = models.ForeignKey(
        registration_request.RegistrationRequest,
        on_delete=models.CASCADE,
        related_name="documentos",
        help_text="Solicitud asociada a la referencia."
    )
    nombres = models.CharField(
        max_length=200,
        help_text="Nombre de la referencia."
    )
    telefono = models.CharField(
        max_length=20,
        help_text="Número de teléfono de la referencia."
    )
    relacion = models.CharField(
        max_length=100,
        help_text="Relación de la referencia con el distribuidor."
    )
    estado = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        default=None,
        help_text="Estado de verificación: NULL=no verificado, 'verificado'=aprobado, 'rechazado'=desestimado."
    )

    def __str__(self):
        """
        Devuelve el nombre de la referencia como su representación en cadena.
        """
        return self.nombres
    class Meta:
        verbose_name = "Referencia"
        verbose_name_plural = "Referencias"
        