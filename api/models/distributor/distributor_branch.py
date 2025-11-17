from django.db import models
from ..application_distributor.application_distributor_branch import AbstractBranch
from ..distributor.distributor import Distributor


class DistributorBranch(AbstractBranch):
    """
    Sucursal VINCULADA AL DISTRIBUIDOR FINAL (Requisito 2).
    
    Hereda de AbstractBranch. Las filas de esta tabla se *crean*
    durante la aprobación, copiando los datos de los 
    `RequestBranch` que fueron aprobados.
    """
    distributor = models.ForeignKey(
        Distributor,
        related_name='branches', # Permite usar distributor.branches.all()
        on_delete=models.CASCADE,
        help_text="Distribuidor al que pertenece esta sucursal."
    )

    def __str__(self):
        return f"Sucursal: {self.nombre} (Distribuidor {self.distributor.nit})"

    class Meta:
        verbose_name = "Sucursal de Distribuidor"
        verbose_name_plural = "Sucursales de Distribuidores"