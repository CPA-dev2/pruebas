from django.contrib.auth.models import AbstractUser
from django.db import models
from .rol import Rol
from .managers import CustomUserManager


class Usuario(AbstractUser):
    """
    Modelo de usuario personalizado que extiende `AbstractUser`.

    Este modelo representa a un usuario en el sistema, utilizando el email como
    identificador único para la autenticación en lugar del username. Integra
    la funcionalidad de borrado lógico y campos de auditoría.

    Attributes:
        email (str): La dirección de correo electrónico única del usuario.
                     Se utiliza para el login.
        rol (ForeignKey): La relación con el modelo `Rol`, que define los
                          permisos del usuario en el sistema. Puede ser nulo.
        is_deleted (BooleanField): Para el borrado suave (soft delete).
        created (DateTimeField): Fecha y hora de creación del registro.
        modified (DateTimeField): Fecha y hora de la última modificación.
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
    is_deleted = models.BooleanField(
        default=False,
        help_text="Indica si el registro ha sido eliminado (soft delete)."
    )
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)


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

    def delete(self, using=None, keep_parents=False):
        """
        Sobrescribe el método delete para implementar el borrado suave.
        """
        self.is_deleted = True
        self.save()

    def hard_delete(self, using=None, keep_parents=False):
        """
        Realiza un borrado físico (hard delete) del registro.
        """
        super().delete(using=using, keep_parents=keep_parents)

    class Meta:
        verbose_name = "Usuario"
        verbose_name_plural = "Usuarios"
