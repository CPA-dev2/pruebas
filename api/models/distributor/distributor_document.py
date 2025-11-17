from django.db import models
from api.models import AbstractDocument
from .distributor import Distributor

class DistributorDocument(AbstractDocument):
    """
    Documento VINCULADO AL DISTRIBUIDOR FINAL (Requisito 2).
    
    Hereda de AbstractDocument. Las filas de esta tabla se *crean*
    durante la aprobación, copiando los datos de los 
    `RequestDocument` que fueron aprobados.
    """
    distributor = models.ForeignKey(
        Distributor,
        related_name='documents', # Permite usar distributor.documents.all()
        on_delete=models.CASCADE,
        help_text="Distribuidor al que pertenece este documento."
    )

    def __str__(self):
        return f"{self.get_document_type_display()} para Distribuidor {self.distributor.nit}"

    class Meta:
        verbose_name = "Documento de Distribuidor"
        verbose_name_plural = "Documentos de Distribuidores"