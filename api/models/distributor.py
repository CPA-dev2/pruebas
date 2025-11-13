"""
Define el modelo de la base de datos para un Distribuidor ACTIVO y APROBADO.
"""
from django.db import models
from django.db.models import Q
from .base_model import BaseModel
# Importamos los modelos con los que se relacionará
from .RegistrationRequest import RegistrationRequest
from .usuario import Usuario

class Distributor(BaseModel):
    """
    Representa un distribuidor APROBADO y ACTIVO en el sistema.
    Esta tabla solo contiene datos limpios de producción. Los registros
    en borrador o pendientes viven en la tabla `RegistrationRequest`.
    """
    
    class Estado(models.TextChoices):
        ACTIVO = 'activo', 'Activo'
        INACTIVO = 'inactivo', 'Inactivo'

    # --- Trazabilidad y Propiedad ---
    registration_request = models.OneToOneField(
        RegistrationRequest,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="distributor_profile",
        help_text="La solicitud de registro original de la cual fue creado."
    )
    # owner = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True)

    # --- Información Personal (Copiada desde la solicitud) ---
    nombres = models.CharField(max_length=255, help_text="Nombre del representante.")
    apellidos = models.CharField(max_length=255, help_text="Apellido del representante.")
    dpi = models.CharField(max_length=13, unique=True)
    correo = models.EmailField(unique=True)
    telefono = models.CharField(max_length=8)
    departamento = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    direccion = models.TextField()

    # --- Información del Negocio (Copiada desde la solicitud) ---
    negocio_nombre = models.CharField(max_length=255, help_text="Razón social o nombre comercial.")
    nit = models.CharField(max_length=20, unique=True, help_text="NIT único.")
    telefono_negocio = models.CharField(max_length=8, blank=True)
    equipamiento = models.CharField(max_length=255, help_text="Equipo de cómputo declarado.")
    sucursales = models.TextField(help_text="Número de sucursales declaradas.")
    antiguedad = models.CharField(max_length=50, help_text="Antigüedad del negocio.")
    productos_distribuidos = models.CharField(max_length=255, help_text="Productos que distribuye.")
    
    TIPO_PERSONA_CHOICES = [
        ('individual', 'Persona Individual'),
        ('juridica', 'Persona Jurídica'),
    ]
    tipo_persona = models.CharField(
        max_length=20,
        choices=TIPO_PERSONA_CHOICES,
    )
    
    # --- Información Bancaria (Copiada desde la solicitud) ---
    cuenta_bancaria = models.CharField(max_length=100, help_text="Nombre en la cuenta bancaria.")
    numero_cuenta = models.CharField(max_length=50, help_text="Número de cuenta.")
    
    TIPO_CUENTA_CHOICES = [
        ('ahorro', 'Cuenta de Ahorro'),
        ('corriente', 'Cuenta Corriente'),
        ('monetaria', 'Cuenta Monetaria'),
    ]
    tipo_cuenta = models.CharField(
        max_length=20,
        choices=TIPO_CUENTA_CHOICES,
    )
    banco = models.CharField(max_length=100, help_text="Banco asociado a la cuenta.")
 
    # --- Estado de Producción ---
    estado = models.CharField(
        max_length=50,
        choices=Estado.choices,
        default=Estado.ACTIVO,
        db_index=True,
        help_text="Estado del distribuidor en producción (Activo/Inactivo)."
    )
   
    def __str__(self):
        """Devuelve el nombre del negocio o, en su defecto, el nombre personal."""
        return self.negocio_nombre or f"{self.nombres} {self.apellidos}"

    class Meta:
        verbose_name = "Distribuidor"
        verbose_name_plural = "Distribuidores"
        constraints = [
            models.UniqueConstraint(
                fields=['nit'],
                condition=Q(nit__isnull=False, is_deleted=False),
                name='unique_active_distributor_nit'
            )
        ]