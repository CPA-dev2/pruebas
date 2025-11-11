"""
Define el modelo de base de datos para un Distribuidor ACTIVO.
"""
from django.db import models
from .base_model import BaseModel
from .usuario import Usuario # Para el 'owner'
from .registration_request import RegistrationRequest # Para la trazabilidad

class Distributor(BaseModel):
    """
    Representa un distribuidor APROBADO y ACTIVO en el sistema.
    Esta tabla solo contiene datos limpios de producción.
    """
    
    class Estado(models.TextChoices):
        ACTIVO = 'activo', 'Activo'
        INACTIVO = 'inactivo', 'Inactivo'

    # --- Trazabilidad ---
    registration_request = models.OneToOneField(
        RegistrationRequest,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        help_text="La solicitud de registro original de la cual fue creado."
    )
    
    # --- Propietario (opcional) ---
    # owner = models.OneToOneField(Usuario, on_delete=models.SET_NULL, null=True, blank=True)

    # --- Información Personal ---
    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    dpi = models.CharField(max_length=13, unique=True)
    correo = models.EmailField(unique=True)
    telefono = models.CharField(max_length=8)
    departamento = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    direccion = models.TextField()

    # --- Información del Negocio ---
    negocio_nombre = models.CharField(max_length=255)
    nit = models.CharField(max_length=20, unique=True)
    telefono_negocio = models.CharField(max_length=8, blank=True)
    # ... (y cualquier otro campo que sea relevante para un distribuidor ACTIVO)
    
    estado = models.CharField(
        max_length=50,
        choices=Estado.choices,
        default=Estado.ACTIVO
    )
   
    def __str__(self):
        return self.negocio_nombre or f"{self.nombres} {self.apellidos}"

    class Meta:
        verbose_name = "Distribuidor"
        verbose_name_plural = "Distribuidores"