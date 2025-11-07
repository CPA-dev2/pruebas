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
        can_create_clients (bool): Permiso para crear nuevos `Cliente`.
        can_update_clients (bool): Permiso para modificar `Cliente` existentes.
        can_delete_clients (bool): Permiso para eliminar `Cliente`.
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
    can_update_distributors = models.BooleanField(
        default=False,
        help_text="Permite al rol actualizar distribuidores."
    )    
    can_delete_distributors = models.BooleanField(
        default=False,
        help_text="Permite al rol eliminar distribuidores."
    )
    can_create_clients = models.BooleanField(
        default=False,
        help_text="Permite al rol crear nuevos clientes."
    )
    can_update_clients = models.BooleanField(
        default=False,
        help_text="Permite al rol editar clientes existentes."
    )
    can_delete_clients = models.BooleanField(
            default=False,
            help_text="Permite al rol eliminar clientes."
    )

    def __str__(self):
        """
        Devuelve el nombre del rol como su representación en cadena.
        """
        return self.nombre

    class Meta:
        verbose_name = "Rol"
        verbose_name_plural = "Roles"
