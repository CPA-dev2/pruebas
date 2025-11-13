from django.contrib.auth.models import AbstractUser
from django.db import models
from .base_model import BaseModel
from .rol import Rol
from .managers import CustomUserManager


class Usuario(AbstractUser, BaseModel):
    """
    Modelo de usuario personalizado que extiende `AbstractUser` y `BaseModel`.

    Este modelo representa a un usuario en el sistema, utilizando el email como
    identificador único para la autenticación en lugar del username. Integra
    la funcionalidad de borrado lógico y campos de auditoría de `BaseModel`.

    Attributes:
        email (str): La dirección de correo electrónico única del usuario.
                     Se utiliza para el login.
        rol (ForeignKey): La relación con el modelo `Rol`, que define los
                          permisos del usuario en el sistema. Puede ser nulo.
    """
    email = models.EmailField(
        unique=True,
        help_text="Dirección de correo electrónico única del usuario."
    )
    rol = models.ForeignKey(
        Rol,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="El rol asignado al usuario, que define sus permisos."
    )

    # El campo `username` de AbstractUser sigue siendo el principal para Django.
    USERNAME_FIELD = 'username'
    # Campos requeridos al crear un usuario desde la línea de comandos.
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']

    objects = CustomUserManager()

    def __str__(self):
        """
        Devuelve el nombre completo del usuario si está disponible,
        de lo contrario, devuelve su email.
        """
        full_name = self.get_full_name()
        return full_name if full_name else self.email

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
