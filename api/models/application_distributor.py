from django.db import models
from django.db.models import Q
from .base_model import BaseModel

class AplicationDistributor(BaseModel):
    """
    Representa un distribuidor en el sistema.

    Los distribuidores son entidades responsables de distribuir productos
    en diferentes puntos de venta. Hereda de `BaseModel` para
    incluir campos de auditoría y borrado lógico.

    Attributes:
        nombres (str): El nombre del representante del distribuidor.
        apellidos (str): El apellido del representante del distribuidor.
        dpi (str): El número de DPI del representante del distribuidor.
        correo (str): La dirección de correo electrónico del representante del distribuidor.
        telefono (str): El número de teléfono del representante del distribuidor.
        departamento (str): El departamento donde se encuentra el distribuidor.
        municipio (str): El municipio donde se encuentra el distribuidor.
        direccion (str): La dirección física del distribuidor.
        negocio_nombre (str): El nombre del negocio del distribuidor.
        nit (str): El NIT del distribuidor.
        telefono_negocio (str): El número de teléfono del negocio del distribuidor.
        equipamiento (str): El equipo de computo (computadoras, laptop's, tablets, etc).
        sucursales (str): Número de sucursales del distribuidor.
        antiguedad (str): La antigüedad del distribuidor en años.
        productos_distribuidos (str): Los productos que distribuye el distribuidor.
        tipo_persona (str): El tipo de persona (natural o jurídica).
        cuenta_bancaria (str): Nombre de la cuenta bancaria del distribuidor.
        numero_cuenta (str): El número de cuenta del distribuidor.
        tipo_cuenta (str): El tipo de cuenta bancaria del distribuidor.
        banco (str): El banco asociado a la cuenta del distribuidor.
        estado (bool): Indica si el distribuidor está activo en el sistema.
    """
    nombres = models.CharField(
        max_length=200,
        help_text="Nombre del distribuidor."
    )
    apellidos = models.CharField(
        max_length=200,
        help_text="Apellido del distribuidor."
    )
    dpi = models.CharField(
        max_length=20,
        help_text="Número de DPI del distribuidor."
    )
    correo = models.EmailField(
        help_text="Dirección de correo electrónico del distribuidor."
    )
    telefono = models.CharField(
        max_length=20,
        help_text="Número de teléfono del distribuidor."
    )
    departamento = models.CharField(
        max_length=100,
        help_text="Departamento donde se encuentra el distribuidor."
    )
    municipio = models.CharField(
        max_length=100,
        help_text="Municipio donde se encuentra el distribuidor."
    )
    direccion = models.TextField(
        help_text="Dirección física del distribuidor."
    )
    negocio_nombre = models.CharField(
        max_length=200,
        null=True,
        blank=True,
        help_text="Nombre del negocio del distribuidor."
    )
    nit = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="NIT del distribuidor."
    )
    telefono_negocio = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        help_text="Número de teléfono del negocio del distribuidor."
    )
    equipamiento = models.TextField(
        null=True,
        blank=True,
        help_text="Equipo de cómputo (computadoras, laptops, tablets, etc)."
    )
    sucursales = models.TextField(
        null=True,
        blank=True,
        help_text="Número de sucursales del distribuidor."
    )
    antiguedad = models.CharField(
        max_length=50,
        help_text="Antigüedad del distribuidor en años."
    )
    productos_distribuidos = models.CharField(
        max_length=100,
        help_text="Los productos que distribuye el distribuidor."
    )
    TIPO_PERSONA_CHOICES = [
        ('natural', 'Persona Natural'),
        ('juridica', 'Persona Jurídica'),
    ]
    tipo_persona = models.CharField(
        max_length=10,
        choices=TIPO_PERSONA_CHOICES,
        default='natural',
        help_text="Tipo de persona (natural o jurídica)."
    )
    cuenta_bancaria = models.CharField(
        max_length=100,
        help_text="Nombre de la cuenta bancaria del distribuidor."
    )
    numero_cuenta = models.CharField(
        max_length=50,
        help_text="Número de cuenta del distribuidor."
    )
    TIPO_CUENTA_CHOICES = [
        ('ahorro', 'Cuenta de Ahorro'),
        ('corriente', 'Cuenta Corriente'),
        ('monetaria', 'Cuenta Monetaria'),
    ]
    tipo_cuenta = models.CharField(
        max_length=20,
        choices=TIPO_CUENTA_CHOICES,
        default='monetaria',
        help_text="Tipo de cuenta bancaria del distribuidor."
    )
    banco = models.CharField(
        max_length=100,
        help_text="Banco asociado a la cuenta del distribuidor."
    )
 
    estado = models.TextField(
        max_length=50,
        default='pendiente',
        help_text="Indica el estado del distribuidor en el sistema."
    )
    asignado_a = models.ForeignKey(
        'api.Usuario',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='distributor_applications',
        help_text="Colaborador asignado para revisar esta solicitud."
    )
   
    def __str__(self):
        """
        Devuelve el nombre completo del distribuidor como su representación en cadena.
        """
        return f"{self.negocio_nombre} - {self.nit}"

    class Meta:
        verbose_name = "Distribuidor"
        verbose_name_plural = "Distribuidores"
        constraints = [
            models.UniqueConstraint(
                fields=['nit'],
                # Esto aplica la regla 'unique' SOLO si el nit NO es nulo
                condition=Q(nit__isnull=False), 
                name='unique_nit_not_null'
            )
        ]