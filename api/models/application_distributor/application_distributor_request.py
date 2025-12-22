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
    
    # --- 1. Identificación y Contacto ---
    nit = models.CharField(max_length=20, db_index=True, help_text="NIT sin guiones")
    correo = models.EmailField(help_text="Correo para notificaciones")
    telefono = models.CharField(max_length=20, blank=True)
    
    # Tipo de Distribuidor (Define el flujo de UI y Validación)
    TIPO_DISTRIBUIDOR_CHOICES = [
        ('pequeno', 'Pequeño Contribuyente'),
        ('sa', 'Sociedad Anónima'),
    ]
    tipo_distribuidor = models.CharField(max_length=20, choices=TIPO_DISTRIBUIDOR_CHOICES, default='pequeno')

    # --- 2. Datos Personales (DPI) ---
    # En caso de S.A., estos son los datos del Representante Legal
    nombres = models.CharField(max_length=200, blank=True)
    apellidos = models.CharField(max_length=200, blank=True)
    dpi = models.CharField(max_length=20, blank=True)
    fecha_vencimiento_dpi = models.DateField(null=True, blank=True)
    fecha_nacimiento = models.DateField(null=True, blank=True)
    nacionalidad = models.CharField(max_length=100, blank=True)
    genero = models.CharField(max_length=20, blank=True) # Masculino/Femenino
    
    # Dirección Personal
    departamento = models.CharField(max_length=100, blank=True)
    municipio = models.CharField(max_length=100, blank=True)
    direccion = models.TextField(blank=True)

    # --- 3. Datos del Propietario (Solo S.A.) ---
    prop_nombres = models.CharField(max_length=200, blank=True)
    prop_apellidos = models.CharField(max_length=200, blank=True)
    prop_dpi = models.CharField(max_length=20, blank=True)
    prop_direccion = models.TextField(blank=True)
    prop_telefono = models.CharField(max_length=20, blank=True)

    # --- 4. Datos de la Empresa (Patente y RTU) ---
    nombre_comercial = models.CharField(max_length=255, blank=True) # De Patente o RTU
    empresa_mercantil = models.CharField(max_length=255, blank=True) # De Patente
    direccion_fiscal = models.TextField(blank=True, help_text="Dirección exacta del RTU")
    direccion_comercial = models.TextField(blank=True, help_text="Dirección física del local")
    
    # Datos Fiscales (RTU)
    regimen_tributario = models.CharField(max_length=200, blank=True)
    forma_calculo_iva = models.CharField(max_length=200, blank=True)
    fecha_inicio_operaciones = models.DateField(null=True, blank=True)
    
    # Datos Registrales (Patente)
    numero_registro = models.CharField(max_length=50, blank=True)
    folio = models.CharField(max_length=50, blank=True)
    libro = models.CharField(max_length=50, blank=True)
    numero_expediente = models.CharField(max_length=50, blank=True)
    categoria = models.CharField(max_length=50, blank=True)
    objeto = models.TextField(blank=True)

    # --- 5. Datos Operativos ---
    equipamiento = models.TextField(blank=True, null=True)
    antiguedad = models.CharField(max_length=50, blank=True)
    productos_distribuidos = models.TextField(blank=True, help_text="Lista separada por comas")
    
    # --- 6. Datos Bancarios ---
    banco = models.CharField(max_length=100, default="Banrural")
    numero_cuenta = models.CharField(max_length=50, blank=True)
    tipo_cuenta = models.CharField(max_length=50, blank=True)
    cuenta_bancaria_nombre = models.CharField(max_length=150, blank=True)

    # --- 7. Sistema y Estado ---
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
    
    # Almacén de JSON crudo del Microservicio OCR para debugging o pre-llenado
    ocr_data_extracted = models.JSONField(default=dict, blank=True)
    ocr_match_score = models.IntegerField(default=0)

    class Meta:
        verbose_name = "Solicitud de Distribuidor"
        verbose_name_plural = "Solicitudes de Distribuidores"
        ordering = ['id']