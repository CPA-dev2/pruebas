from django.db import models

from api.models import registration_request
from .base_model import BaseModel

class Location(BaseModel):
    """
    Representa una ubicación asociada a un distribuidor.

    Las ubicaciones son puntos geográficos donde opera un distribuidor.
    Hereda de `BaseModel` para incluir campos de auditoría y borrado lógico.

    Attributes:
        distribuidor (ForeignKey): Relación con el modelo `Distributor`.
        nombre (str): El nombre de la sucursal o ubicación.
        departamento (str): El departamento donde se encuentra la ubicación.
        municipio (str): El municipio donde se encuentra la ubicación.
        direccion (str): La dirección física de la ubicación.
        telefono (str): El número de teléfono de la ubicación.
    """
    registration_request = models.ForeignKey(
        registration_request.RegistrationRequest,
        on_delete=models.CASCADE,
        related_name="documentos",
        help_text="Solicitud asociada al documento."
    )
    nombre = models.CharField(
        max_length=200,
        help_text="Nombre de la sucursal o ubicación."
    )
    departamento = models.CharField(
        max_length=255,
        help_text="Departamento donde se encuentra la ubicación."
    )
    municipio = models.CharField(
        max_length=100,
        help_text="Municipio donde se encuentra la ubicación."
    )
    direccion = models.CharField(
        max_length=255,
        help_text="Dirección física de la ubicación."
    )
    telefono = models.CharField(
        max_length=20,
        help_text="Número de teléfono de la ubicación."
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
        Devuelve una representación en cadena de la ubicación.
        """
        return self.nombre

    class Meta:
        verbose_name = "Sucursal"
        verbose_name_plural = "Sucursales"