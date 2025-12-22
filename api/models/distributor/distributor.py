from django.db import models
from django.conf import settings
from ..base_model import BaseModel
from ..application_distributor.application_distributor_request import DistributorRequest

class Distributor(models.Model):
    """
    Representa la entidad final y aprobada de un "Distribuidor" (Requisito 2).
    
    Este modelo es el " de datos". Se crea ÚNICAMENTE
    cuando una `DistributorRequest` es 'APROBADA' (Requisito F).
    Los datos se *copian* desde la solicitud.
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

    is_active = models.BooleanField(
        default=True,
        help_text="Indica si el registro está activo lógicamente."
    )
    is_deleted = models.BooleanField(
        default=False,
        help_text="Indica si el registro ha sido eliminado (soft delete)."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        editable=False,
        help_text="Fecha y hora de la última actualización del registro."
    )
    deleted_at = models.DateTimeField(
        null=True, 
        blank=True, 
        editable=False,
        help_text="Fecha y hora del borrado lógico."
    )

    @property
    def approved_documents(self):
        """
        Devuelve un QuerySet de los DistributorDocument
        vinculados a este distribuidor.
        """
        # Usa el related_name 'documents_master' de DistributorDocument
        return self.documents_master.all()

    @property
    def approved_locations(self):
        """
        Devuelve un QuerySet de las DistributorBranch
        vinculadas a este distribuidor.
        """
        # Usa el related_name 'branches_master' de DistributorBranch
        return self.branches_master.all()

    @property
    def verified_references(self):
        """
        Devuelve un QuerySet de las DistributorReference
        vinculadas a este distribuidor.
        """
        # Usa el related_name 'references_master' de DistributorReference
        return self.references_master.all()


    def __str__(self):
        return self.nombre_comercial

    class Meta:
        verbose_name = "7. Distribuidor (Aprobado)"
        verbose_name_plural = "7. Distribuidores (Aprobados)"