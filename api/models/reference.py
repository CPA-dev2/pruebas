"""
Define el modelo de la base de datos para las Referencias
de un Distribuidor APROBADO.
"""
from django.db import models
from .base_model import BaseModel
from .distributor import Distributor # <-- Importa el modelo Distributor principal

class Reference(BaseModel):
    """
    Almacena una referencia (comercial o personal) asociada a un
    Distribuidor activo.
    """
    ESTADO_CHOICES = [
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]

    distribuidor = models.ForeignKey(
        Distributor,
        on_delete=models.CASCADE,
        related_name="referencias", # Permite hacer `distributor.referencias.all()`
        help_text="El distribuidor al que pertenece esta referencia."
    )
    
    nombres = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20)
    relacion = models.CharField(max_length=100)
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='aprobado',
        help_text="Estado de la referencia (copiado de la solicitud)."
    )

    def __str__(self):
        return f"Referencia '{self.nombres}' para {self.distribuidor.negocio_nombre}"

    class Meta:
        verbose_name = "Referencia de Distribuidor"
        verbose_name_plural = "Referencias de Distribuidor"