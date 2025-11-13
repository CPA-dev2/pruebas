from django.db import models


class BaseModel(models.Model):
    """
    Modelo base abstracto para todos los modelos del proyecto.
    Provee campos y métodos comunes para estandarizar el comportamiento.

    Atributos:
        is_active (BooleanField): Para activar o desactivar un registro
            lógicamente.
        is_deleted (BooleanField): Para el borrado suave (soft delete).
        created (DateTimeField): Fecha y hora de creación del registro.
        modified (DateTimeField): Fecha y hora de la última modificación.
    """
    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el registro está activo lógicamente."
    )
    is_deleted = models.BooleanField(
        default=False,
        help_text="Indica si el registro ha sido eliminado (soft delete)."
    )
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(auto_now=True)

    class Meta:
        """  Opciones del modelo """
        abstract = True
        ordering = ['id']

    def delete(self, using=None, keep_parents=False):
        """
        Sobrescribe el método delete para implementar el borrado suave.
        En lugar de eliminar el registro de la base de datos, marca
        `is_deleted` como True.
        """
        self.is_deleted = True
        self.save()

    def hard_delete(self, using=None, keep_parents=False):
        """
        Realiza un borrado físico (hard delete) del registro.
        Este método debe ser usado con precaución y solo por personal
        autorizado.
        """
        super().delete(using=using, keep_parents=keep_parents)
