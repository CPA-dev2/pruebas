from django.db import models
from django.contrib.auth import get_user_model
from .base_model import BaseModel

Usuario = get_user_model()

class Auditlog(BaseModel):
    """
    Modelo con enfoque simple para registrar quién hizo qué y cuándo.
    Enfoque en los datos esenciales de auditoría.
    """
    
    # QUIÉN - Usuario que realizó la acción
    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.PROTECT,# Evita borrar usuarios con auditlogs
        related_name='auditlogs',
        help_text="Usuario que ejecutó la acción"
    )
    
    # QUÉ - Acción realizada  
    accion = models.CharField(
        max_length=100,
        help_text="Descripción de la acción realizada"
    )
    
    # DETALLES - Descripción adicional (opcional)
    descripcion = models.TextField(
        blank=True,
        null=True,
        help_text="Detalles adicionales de la acción"
    )

    class Meta:
        verbose_name = "Auditlog"
        verbose_name_plural = "Auditlogs"
        ordering = ['-created']  # Más recientes primero
        indexes = [
            models.Index(fields=['usuario', 'created']),
            models.Index(fields=['created']),
        ]

    def __str__(self):
        return f"{self.usuario.username} - {self.accion} - {self.created.strftime('%Y-%m-%d %H:%M:%S')}"