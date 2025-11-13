"""
Define el modelo de la base de datos para los Documentos
de un Distribuidor APROBADO.
"""
from django.db import models
from .base_model import BaseModel
from .distributor import Distributor # <-- Importa el modelo Distributor principal

class Document(BaseModel):
    """
    Almacena un archivo (DPI, RTU, etc.) asociado a un
    Distribuidor activo.
    """
    ESTADO_CHOICES = [
        ('aprobado', 'Aprobado'),
        ('rechazado', 'Rechazado'),
    ]
    
    distribuidor = models.ForeignKey(
        Distributor,
        on_delete=models.CASCADE,
        related_name="documentos", # Permite hacer `distributor.documentos.all()`
        help_text="El distribuidor al que pertenece este documento."
    )
    
    tipo_documento = models.CharField(
        max_length=50,
        help_text="Tipo de documento (ej. 'rtu', 'dpi_frontal')."
    )
    
    archivo = models.FileField(
        upload_to="distributor_documents/",
        help_text="El archivo físico almacenado."
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='aprobado',
        help_text="Estado del documento (copiado de la solicitud)."
    )

    def __str__(self):
        return f"{self.tipo_documento} de {self.distribuidor.negocio_nombre}"

    class Meta:
        verbose_name = "Documento de Distribuidor"
        verbose_name_plural = "Documentos de Distribuidor"