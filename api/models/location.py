"""
Define el modelo de la base de datos para las Ubicaciones (Sucursales)
de un Distribuidor APROBADO.
"""
from django.db import models
from .base_model import BaseModel
from .distributor import Distributor # <-- Importa el modelo Distributor principal

class Location(BaseModel):
    """
    Almacena una ubicación o sucursal (extraída del RTU o manual) asociada a un
    Distribuidor activo.
    """
    ESTADO_CHOICES = [
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]
    
    distribuidor = models.ForeignKey(
        Distributor,
        on_delete=models.CASCADE,
        related_name="ubicaciones", # Permite hacer `distributor.ubicaciones.all()`
        help_text="El distribuidor al que pertenece esta ubicación."
    )
    
    nombre = models.CharField(max_length=255, help_text="Nombre comercial de la sucursal.")
    departamento = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    direccion = models.TextField()
    telefono = models.CharField(max_length=8, blank=True)
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='aprobado',
        help_text="Estado de la ubicación (copiado de la solicitud)."
    )

    def __str__(self):
        return f"Sucursal '{self.nombre}' de {self.distribuidor.negocio_nombre}"

    class Meta:
        verbose_name = "Ubicación de Distribuidor"
        verbose_name_plural = "Ubicaciones de Distribuidor"