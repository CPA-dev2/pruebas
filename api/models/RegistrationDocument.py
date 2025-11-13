from django.db import models

from api.models import RegistrationRequest
from .base_model import BaseModel

class RegistrationDocument(BaseModel):
    """
    Representa un documento asociado a un distribuidor.

    Los documentos son archivos que contienen información relevante sobre
    un distribuidor. Hereda de `BaseModel` para incluir campos de auditoría
    y borrado lógico.

    Attributes:
        distribuidor (ForeignKey): Relación con el modelo `Distributor`.
        tipo_documento (str): El tipo de documento (ej. "Contrato", "Identificación").
        archivo (FileField): El archivo del documento.
    """
    registration_request = models.ForeignKey(
        RegistrationRequest.RegistrationRequest,
        on_delete=models.CASCADE,
        related_name="documentos",
        help_text="Solicitud asociada al documento."
    )
    tipo_documento = models.CharField(
        max_length=100,
        help_text="Tipo de documento (ej. 'Contrato', 'Identificación')."
    )
    archivo = models.FileField(
        upload_to='distribuidor/documentos/',
        help_text="Archivo del documento."
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
        Devuelve una representación en cadena del documento.
        """
        return f"{self.tipo_documento} - {self.registration_request.nombres}"

    class Meta:
        verbose_name = "Documento"
        verbose_name_plural = "Documentos"