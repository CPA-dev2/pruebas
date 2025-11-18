from django.db import models
from django.conf import settings
from ..base_model import BaseModel 
from .application_distributor_states import RequestState


class DistributorRequest(BaseModel):
    """
    Modelo central que representa la solicitud (el "expediente").
    
    Reemplaza al obsoleto `AplicationDistributor`
    y contiene todos los campos del formulario, el estado actual
    y el colaborador asignado (Requisito 4).
    """
    
    # --- Datos del Aplicante (Representante Legal si es Jurídica) ---
    nombres = models.CharField(
        max_length=200, 
        help_text="Nombres del representante legal o persona natural."
    )
    apellidos = models.CharField(
        max_length=200, 
        help_text="Apellidos del representante legal o persona natural."
    )
    dpi = models.CharField(
        max_length=20, 
        help_text="Número de DPI (CUI) del representante o persona natural."
    )
    correo = models.EmailField(
        help_text="Correo electrónico principal de contacto."
    )
    telefono = models.CharField(
        max_length=20, 
        help_text="Teléfono principal de contacto."
    )
    
    # --- Datos del Negocio ---
    negocio_nombre = models.CharField(
        max_length=200, 
        null=True, 
        blank=True, 
        help_text="Nombre comercial del negocio."
    )
    nit = models.CharField(
        max_length=20, 
        db_index=True,
        help_text="NIT del negocio o persona natural."
    )
    telefono_negocio = models.CharField(
        max_length=20, 
        null=True, 
        blank=True, 
        help_text="Teléfono del negocio (si es diferente)."
    )
    TIPO_PERSONA_CHOICES = [
        ('natural', 'Persona Natural'),
        ('juridica', 'Persona Jurídica'),
    ]
    tipo_persona = models.CharField(
        max_length=10,
        choices=TIPO_PERSONA_CHOICES,
        default='natural',
    )
    
    # --- Ubicación Principal (Campos de) ---
    departamento = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    direccion = models.TextField()
    
    # --- Información Adicional (Campos de) ---
    equipamiento = models.TextField(null=True, blank=True)
    sucursales = models.TextField(
        null=True, 
        blank=True, 
        help_text="Descripción de otras sucursales o puntos de venta."
    )
    antiguedad = models.CharField(max_length=50)
    productos_distribuidos = models.CharField(max_length=255)
    
    # --- Datos Bancarios (Campos de) ---
    cuenta_bancaria = models.CharField(max_length=100)
    numero_cuenta = models.CharField(max_length=50)
    TIPO_CUENTA_CHOICES = [
        ('ahorro', 'Cuenta de Ahorro'),
        ('monetaria', 'Cuenta Monetaria'),
    ]
    tipo_cuenta = models.CharField(max_length=20, choices=TIPO_CUENTA_CHOICES)
    banco = models.CharField(max_length=100)
    
    # --- Estado del Flujo (Requisito B) ---
    estado = models.CharField(
        max_length=50,
        choices=RequestState.choices,
        default=RequestState.PENDIENTE,
        db_index=True,
    )
    # Requerimiento A y 4: FK a User
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_requests',
        help_text="Colaborador asignado para revisar esta solicitud."
    )
    
    # --- Datos de Verificación (Requisito C - OCR) ---
    ocr_data_extracted = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos estructurados consolidados extraídos vía OCR."
    )
    ocr_discrepancies = models.JSONField(
        default=dict,
        blank=True,
        help_text="Registro de discrepancias (campo, valor_manual, valor_ocr)."
    )

    ocr_match_score = models.IntegerField(
            default=0,
            help_text="Puntaje de coincidencia (0-100) calculado entre datos OCR y manuales."
    )

    def __str__(self):
        return f"Solicitud {self.nit} ({self.get_estado_display()})"

    class Meta:
        verbose_name = "Solicitud de Distribuidor"
        verbose_name_plural = "Solicitudes de Distribuidores"
        ordering = ['id']