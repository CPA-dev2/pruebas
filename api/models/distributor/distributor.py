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
    
    # --- Vínculos del Sistema ---
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="distributor_profile",
        help_text="Cuenta de usuario asociada para inicio de sesión."
    )
    request_origin = models.OneToOneField(
        DistributorRequest,
        on_delete=models.PROTECT,
        related_name="approved_distributor",
        help_text="La solicitud original que fue aprobada."
    )
    nit = models.CharField(
        max_length=20, 
        unique=True,
        help_text="NIT verificado del distribuidor."
    )
    razon_social_o_nombre = models.CharField(
        max_length=255, 
        help_text="Razón social (jurídica) o Nombre Completo (natural)."
    )
    nombre_comercial = models.CharField(max_length=255, blank=True)
    
    TIPO_PERSONA_CHOICES = [
        ('natural', 'Persona Natural'),
        ('juridica', 'Persona Jurídica'),
    ]
    tipo_persona = models.CharField(
        max_length=10,
        choices=TIPO_PERSONA_CHOICES,
    )
    
    # --- Representante Legal (si aplica) ---
    dpi_representante = models.CharField(max_length=20, blank=True)
    nombre_representante_completo = models.CharField(max_length=255, blank=True)
    
    # --- Contacto  ---
    email_contacto = models.EmailField()
    telefono_contacto = models.CharField(max_length=20)
    telefono_negocio = models.CharField(max_length=20, blank=True)
    
    # --- Ubicación  ---
    departamento = models.CharField(max_length=100)
    municipio = models.CharField(max_length=100)
    direccion = models.TextField()
    
    # --- Información Adicional  ---
    equipamiento_desc = models.TextField(blank=True, help_text="Descripción de equipamiento.")
    sucursales_desc = models.TextField(blank=True, help_text="Descripción de otras sucursales.")
    antiguedad = models.CharField(max_length=50, blank=True)
    productos_distribuidos = models.CharField(max_length=255, blank=True)
    
    # --- Datos Bancarios  ---
    cuenta_bancaria_nombre = models.CharField(max_length=100)
    numero_cuenta = models.CharField(max_length=50)
    TIPO_CUENTA_CHOICES = [
        ('ahorro', 'Cuenta de Ahorro'),
        ('monetaria', 'Cuenta Monetaria'),
    ]
    tipo_cuenta = models.CharField(max_length=20, choices=TIPO_CUENTA_CHOICES)
    banco = models.CharField(max_length=100)

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
        return self.razon_social_o_nombre or self.nombre_comercial

    class Meta:
        verbose_name = "7. Distribuidor (Aprobado)"
        verbose_name_plural = "7. Distribuidores (Aprobados)"