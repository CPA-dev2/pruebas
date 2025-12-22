from django.db import models
from .base_model import BaseModel


class Item(BaseModel):
    """
    Representa un item genérico en el sistema.

    Este modelo sirve como una entidad básica para demostrar las operaciones
    CRUD (Crear, Leer, Actualizar, Eliminar) a través de la API GraphQL.
    Hereda de `BaseModel`, lo que le proporciona campos de auditoría y
    funcionalidad de borrado lógico (soft delete).

    Attributes:
        nombre (str): El nombre del item, es un campo obligatorio.
        descripcion (str): Un texto descriptivo opcional para el item.
    """
    nombre = models.CharField(
        max_length=255,
        help_text="Nombre del item."
    )
    descripcion = models.TextField(
        blank=True,
        null=True,
        help_text="Descripción detallada del item."
    )

    def __str__(self):
        """
        Devuelve una representación en cadena del item, que es su nombre.
        """
        return self.nombre

    class Meta:
        verbose_name = "Item"
        verbose_name_plural = "Items"
