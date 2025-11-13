from django.db import models
from .base_model import BaseModel


class Rol(BaseModel):
    """
    Define un rol de usuario y los permisos asociados a él.

    Los roles se utilizan para agrupar un conjunto de permisos que pueden ser
    asignados a los usuarios, simplificando la gestión de la autorización.
    Hereda de `BaseModel` para incluir campos de auditoría y borrado lógico.

    Attributes:
        nombre (str): El nombre único del rol (ej. "Administrador").
        can_create_items (bool): Permiso para crear nuevos `Item`.
        can_update_items (bool): Permiso para modificar `Item` existentes.
        can_delete_items (bool): Permiso para eliminar `Item`.
    """
    nombre = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nombre único del rol."
    )
    can_create_items = models.BooleanField(
        default=False,
        help_text="Permite al rol crear nuevos items."
    )
    can_update_items = models.BooleanField(
        default=False,
        help_text="Permite al rol editar items existentes."
    )
    can_delete_items = models.BooleanField(
        default=False,
        help_text="Permite al rol eliminar items."
    )

    def __str__(self):
        """
        Devuelve el nombre del rol como su representación en cadena.
        """
        return self.nombre

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
