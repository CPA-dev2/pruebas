from django.db import models
from .base_model import BaseModel


class Client(BaseModel):
    """
    Representa un cliente en el sistema.

    Este modelo sirve para gestionar clientes (CRUD: Crear, Leer, Actualizar,
    Eliminar) a través de la API GraphQL.
    Hereda de `BaseModel`, lo que le proporciona campos de auditoría y
    funcionalidad de borrado lógico (soft delete).

    Attributes:
        nombres (str): Nombres del cliente (obligatorio).
        apellidos (str): Apellidos del cliente (opcional).
        fecha_nacimiento (date): Fecha de nacimiento (opcional).
        direccion (str): Dirección del cliente (opcional).
        dpi (str): Documento Personal de Identificación (único).
        nit (str): Número de Identificación Tributaria (opcional, único si existe).
        email (str): Correo electrónico (único).
        telefono (str): Número de teléfono del cliente.
    """

    # Datos personales del cliente
    nombres = models.CharField(
        max_length=120,
        help_text="Nombre del cliente."
    )
    apellidos = models.CharField(
        max_length=120,
        blank=True,
        null=True,
        help_text="Apellidos del cliente."
    )
    fecha_nacimiento = models.DateField(
        blank=True,
        null=True,
        help_text="Fecha de nacimiento del cliente."
    )
    direccion = models.TextField(
        null=True,
        blank=True,
        help_text="Dirección del cliente."
    )

    # Información de identificación.
    dpi = models.CharField(
        max_length=13,
        unique=True,
        help_text="Documento Personal de Identificación (DPI)."
    )
    nit = models.CharField(
        max_length=13,
        null=True,
        blank=True,
        help_text="Número de Identificación Tributaria (NIT). Único si se proporciona."
    )
    email = models.EmailField(
        unique=True,
        help_text="Correo electrónico del cliente."
    )
    telefono = models.CharField(
        max_length=15,
        help_text="Número de teléfono del cliente."
    )

    def __str__(self):
        """
        Devuelve el nombre completo del cliente en el formato:
        "Nombres Apellidos".
        """
        return f"{self.nombres} {self.apellidos}"
            
       

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        
