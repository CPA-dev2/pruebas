from django.db import models
from ..distributor.distributor import Distributor
from ..application_distributor.application_distributor_reference import AbstractReference

class DistributorReference(AbstractReference):
    """
    Referencia VINCULADA AL DISTRIBUIDOR FINAL (Requisito 2).
    
    Hereda de AbstractReference. Las filas de esta tabla se *crean*
    durante la aprobación, copiando los datos de los 
    `RequestReference` que fueron verificados/aprobados.
    """
    distributor = models.ForeignKey(
        Distributor,
        related_name='references', # Permite usar distributor.references.all()
        on_delete=models.CASCADE,
        help_text="Distribuidor al que pertenece esta referencia."
    )

    def __str__(self):
        return f"Referencia: {self.nombres} (Distribuidor {self.distributor.nit})"

    class Meta:
        verbose_name = "Referencia de Distribuidor"
        verbose_name_plural = "Referencias de Distribuidores"