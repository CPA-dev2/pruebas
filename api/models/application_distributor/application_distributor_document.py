from django.db import models
from ..base_model import BaseModel
from .application_distributor_request import DistributorRequest
from django.db import transaction
class AbstractDocument(BaseModel):
    """
    Modelo Abstracto Reutilizable (Requisito 3) para Documentos.
    Contiene todos los campos comunes para un documento.
    """
    DOCTYPE_CHOICES = [
        ('DPI_FRONT', 'DPI (Frente)'),
        ('DPI_BACK', 'DPI (Reverso)'),
        ('RTU', 'RTU Digital'),
        ('PATENTE', 'Patente de Comercio'),
        ('OTHER', 'Otro'),
    ]
    
    document_type = models.CharField(
        max_length=20,
        choices=DOCTYPE_CHOICES,
    )
    file = models.FileField(
        upload_to='distributor_docs/%Y/%m/',
        help_text="Archivo físico subido."
    )
    
    # --- OCR Metadata ---
    OCR_STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('PROCESSING', 'Procesando'),
        ('COMPLETED', 'Completado'),
        ('FAILED', 'Falló'),
    ]
    ocr_status = models.CharField(
        max_length=20,
        choices=OCR_STATUS_CHOICES,
        default='PENDING',
    )
    raw_text = models.TextField(
        blank=True,
        help_text="Texto crudo extraído por el motor OCR."
    )
    extracted_data = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos estructurados (JSON) extraídos del texto."
    )
    
    # --- Revisión Manual ---
    REVISION_STATUS = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    revision_status = models.CharField(
        max_length=20, 
        choices=REVISION_STATUS, 
        default='pending',
        help_text="Estado de la revisión manual de este documento."
    )
    revision_notes = models.TextField(
        blank=True, 
        help_text="Notas del revisor si el documento es rechazado."
    )
    def save(self, *args, **kwargs):
        # Detectar si es una creación (no tiene ID aún)
        is_new = self._state.adding
        super().save(*args, **kwargs)
        
        if is_new and self.file:
            # Importar aquí para evitar ciclos circulares
            from api.tasks import process_document_ocr
            
            # Ejecutar tarea al confirmar la transacción en DB
            transaction.on_commit(
                lambda: process_document_ocr.delay(self.id)
            )

    class Meta:
        abstract = True

class RequestDocument(AbstractDocument):
    """
    Documento VINCULADO A LA SOLICITUD (Requisito 1).
    Hereda toda su lógica de AbstractDocument.
    Reemplaza al obsoleto `Document`.
    """
    request = models.ForeignKey(
        DistributorRequest,
        related_name='documents',
        on_delete=models.CASCADE,
        help_text="Solicitud a la que pertenece este documento."
    )

    def __str__(self):
        return f"{self.get_document_type_display()} para Solicitud {self.request.id}"

    class Meta(AbstractDocument.Meta):
        verbose_name =  "Documento de Solicitud"
        verbose_name_plural =  "Documentos de Solicitud"