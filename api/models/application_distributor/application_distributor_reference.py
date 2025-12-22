from django.db import models
from ..base_model import BaseModel
from .application_distributor_request import DistributorRequest

class AbstractReference(BaseModel):
    """
    Modelo Abstracto Reutilizable (Requisito 3) para Referencias.
    """
    nombres = models.CharField(max_length=200)
    telefono = models.CharField(max_length=20)
    relacion = models.CharField(max_length=100)
    
    REVISION_STATUS = [
        ('pending', 'Pendiente'),
        ('verified', 'Verificado'),
        ('rejected', 'Rechazado'),
    ]
    revision_status = models.CharField(
        max_length=20, 
        choices=REVISION_STATUS, 
        default='pending'
    )
    revision_notes = models.TextField(
        blank=True, 
        help_text="Notas del revisor si la referencia es rechazada."
    )

    class Meta:
        abstract = True

class RequestReference(AbstractReference):
    """
    Referencia VINCULADA A LA SOLICITUD (Requisito 1).
    Hereda toda su lógica de AbstractReference.
    Reemplaza al obsoleto `Reference`.
    """
    request = models.ForeignKey(
        DistributorRequest,
        related_name='references',
        on_delete=models.CASCADE,
        help_text="Solicitud a la que pertenece esta referencia."
    )

    def __str__(self):
        return f"Referencia: {self.nombres} (Solicitud {self.request.id})"
        
    class Meta(AbstractReference.Meta):
        verbose_name = "Referencia de Solicitud"
        verbose_name_plural = "Referencias de Solicitud"