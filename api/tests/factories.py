"""
Factories para la creación de objetos de modelo en pruebas.
Utiliza la librería `factory-boy`.
"""
import factory
from django.contrib.auth import get_user_model
from api.models.RegistrationRequest import RegistrationRequest

# Obtener el modelo de Usuario activo
User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    """Factory para el modelo de Usuario."""
    class Meta:
        model = User
        django_get_or_create = ('username',) # Evitar duplicados

    username = factory.Sequence(lambda n: f'user{n}')
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.LazyAttribute(lambda obj: f'{obj.username}@example.com')
    is_staff = False
    is_active = True

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        # Establecer una contraseña por defecto si no se proporciona una
        if not create:
            return

        password = extracted or 'defaultpassword123'
        self.set_password(password)
        self.save()


class RegistrationRequestFactory(factory.django.DjangoModelFactory):
    """Factory para el modelo de RegistrationRequest."""
    class Meta:
        model = RegistrationRequest

    # --- Campos Obligatorios ---
    nombres = factory.Faker('first_name')
    apellidos = factory.Faker('last_name')
    dpi = factory.Sequence(lambda n: f'2500{n:09d}')
    correo = factory.LazyAttribute(lambda obj: f'{obj.nombres.lower()}.{obj.apellidos.lower()}@example.com')
    telefono = factory.Sequence(lambda n: f'5555{n:04d}')
    departamento = 'Guatemala'
    municipio = 'Guatemala'
    direccion = factory.Faker('address')
    antiguedad = '1 a 3 años'
    productos_distribuidos = 'Electrónica'
    tipo_persona = 'individual'

    # --- Campos Opcionales ---
    assignment_key = None
    estado = RegistrationRequest.Estado.PENDIENTE_ASIGNACION

    # --- Campos de Negocio (poblados por OCR) ---
    nit = None
    negocio_nombre = None
