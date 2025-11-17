from django.db import models
from ..base_model import BaseModel
from .application_distributor_request import DistributorRequest

class AbstractBranch(BaseModel):
    """
    Modelo Abstracto Reutilizable (Requisito 3) para Sucursales/Ubicaciones.
    """
    nombre = models.CharField(max_length=200)
    departamento = models.CharField(max_length=255)
    municipio = models.CharField(max_length=100)
    direccion = models.CharField(max_length=255)
    telefono = models.CharField(max_length=20, blank=True)
    
    REVISION_STATUS = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    # Reemplaza el campo 'estado' de
    revision_status = models.CharField(
        max_length=20, 
        choices=REVISION_STATUS, 
        default='pending'
    )
    revision_notes = models.TextField(
        blank=True, 
        help_text="Notas del revisor si la ubicación es rechazada."
    )
    
    class Meta:
        abstract = True

class RequestBranch(AbstractBranch):
    """
    Sucursal VINCULADA A LA SOLICITUD.
    Hereda toda su lógica de AbstractBranch.
    Reemplaza al obsoleto `Location`.
    """
    request = models.ForeignKey(
        DistributorRequest,
        related_name='branches',
        on_delete=models.CASCADE,
        help_text="Solicitud a la que pertenece esta sucursal."
    )
    
    def __str__(self):
        return f"Sucursal: {self.nombre} (Solicitud {self.request.id})"

    class Meta(AbstractBranch.Meta):
        verbose_name = "Sucursal de Solicitud"
        verbose_name_plural = "Sucursales de Solicitud"