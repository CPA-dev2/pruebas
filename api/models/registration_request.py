"""
Define el modelo de base de datos para una Solicitud de Registro de Distribuidor.
Esta tabla 'staging' almacena todos los datos del formulario de registro
mientras se encuentra en el flujo de aprobación.
"""
from django.db import models
from .base_model import BaseModel
from .usuario import Usuario

class RegistrationRequest(BaseModel):
    """
    Representa una solicitud de registro de distribuidor, incluyendo todos los
    datos personales, de negocio, bancarios y el estado de aprobación.
    """
    
    class Estado(models.TextChoices):
        NUEVO = 'nuevo', 'Nuevo (RTU pendiente de procesar)'
        PENDIENTE = 'pendiente', 'Pendiente de Asignación'
        REVISION = 'revision', 'En Revisión'
        VALIDADO = 'validado', 'Validado (Listo para aprobar)'
        APROBADO = 'aprobado', 'Aprobado (Convertido en Distribuidor)'
        RECHAZADO = 'rechazado', 'Rechazado'
        ERROR_RTU = 'error_rtu', 'Error en RTU'

    # --- Información Personal ---
    nombres = models.CharField(max_length=255)
    apellidos = models.CharField(max_length=255)
    dpi = models.CharField(max_length=13, unique=True, help_text="DPI único de 13 dígitos.")
    correo = models.EmailField(unique=True, help_text="Correo electrónico único.")
    telefono = models.CharField(max_length=8)
    departamento = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    direccion = models.TextField()

    # --- Información del Negocio (Declarada) ---
    telefono_negocio = models.CharField(max_length=8, blank=True)
    equipamiento = models.CharField(max_length=255, blank=True)
    sucursales = models.TextField(blank=True)
    antiguedad = models.CharField(max_length=50)
    productos_distribuidos = models.CharField(max_length=255)
    
    TIPO_PERSONA_CHOICES = [('individual', 'Persona Individual'), ('juridica', 'Persona Jurídica')]
    tipo_persona = models.CharField(max_length=20, choices=TIPO_PERSONA_CHOICES)
    
    # --- Información Bancaria ---
    cuenta_bancaria = models.CharField(max_length=100, blank=True)
    numero_cuenta = models.CharField(max_length=50, blank=True)
    TIPO_CUENTA_CHOICES = [('ahorro', 'Ahorro'), ('corriente', 'Corriente'), ('monetaria', 'Monetaria')]
    tipo_cuenta = models.CharField(max_length=20, choices=TIPO_CUENTA_CHOICES, blank=True)
    banco = models.CharField(max_length=100, blank=True)
 
    # --- Datos Extraídos de RTU (poblados asíncronamente) ---
    negocio_nombre = models.CharField(max_length=255, blank=True, null=True, help_text="Razón social (del RTU).")
    nit = models.CharField(max_length=20, unique=True, blank=True, null=True, help_text="NIT único (del RTU).")

    # --- Estado del Flujo ---
    estado = models.CharField(
        max_length=50,
        choices=Estado.choices,
        default=Estado.NUEVO,
        help_text="Estado de la solicitud en el flujo de aprobación."
    )
    
    asisgnado_a = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Usuario asignado a la solicitud."
    )
   
    def __str__(self):
        return f"Solicitud de {self.nombres} {self.apellidos} ({self.dpi}) - {self.estado}"

    class Meta:
        verbose_name = "Solicitud de Registro"
        verbose_name_plural = "Solicitudes de Registro"

# --- Modelos Relacionados a la Solicitud ---
# (Se deben crear modelos similares para RegistrationDocument, RegistrationReference,
# RegistrationLocation, RegistrationAssignment, RegistrationRevision, y
# RegistrationTracking, todos apuntando con un ForeignKey a RegistrationRequest)