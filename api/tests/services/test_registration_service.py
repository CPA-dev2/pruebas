"""
Pruebas de Integración para el Servicio de Registro.

Estas pruebas verifican la lógica de negocio en `registration_service.py`
sin pasar por la capa de GraphQL, permitiendo un testeo más directo
de las transiciones de estado y las validaciones.
"""
import pytest
from django.core.exceptions import ValidationError, PermissionDenied
from api.models import RegistrationRequest
from api.services import registration_service

pytestmark = pytest.mark.django_db


def test_assign_request_success(registration_request_factory, user_factory):
    """
    Verifica que una solicitud en 'pendiente_asignacion' puede ser asignada
    correctamente, cambiando su estado a 'asignada'.
    """
    # Arrange: Crear una solicitud en el estado correcto y dos usuarios
    request = registration_request_factory(estado=RegistrationRequest.Estado.PENDIENTE_ASIGNACION)
    assignee = user_factory(username="revisor")
    assigner = user_factory(username="supervisor")

    # Act: Llamar al servicio para asignar la solicitud
    updated_request = registration_service.assign_registration_request(
        request_id=request.id,
        assignee_id=assignee.id,
        assigner_user=assigner
    )

    # Assert: Verificar que el estado y la asignación son correctos
    assert updated_request.estado == RegistrationRequest.Estado.ASIGNADA
    assert updated_request.assignment_key == assignee
    assert updated_request.tracking.count() == 1
    assert updated_request.tracking.first().observacion.startswith("Solicitud asignada a revisor")


def test_assign_request_invalid_initial_state(registration_request_factory, user_factory):
    """
    Verifica que no se puede asignar una solicitud que no está en
    el estado 'pendiente_asignacion'.
    """
    # Arrange: Crear una solicitud en un estado incorrecto (ej. 'en_revision')
    request = registration_request_factory(estado=RegistrationRequest.Estado.EN_REVISION)
    assignee = user_factory()
    assigner = user_factory()

    # Act & Assert: La llamada al servicio debe lanzar un ValidationError
    with pytest.raises(ValidationError) as excinfo:
        registration_service.assign_registration_request(
            request_id=request.id,
            assignee_id=assignee.id,
            assigner_user=assigner
        )
    assert "Transición de estado inválida" in str(excinfo.value)


def test_submit_review_success(registration_request_factory, user_factory):
    """
    Verifica que un revisor asignado puede enviar observaciones,
    cambiando el estado a 'pendiente_correcciones'.
    """
    # Arrange: Crear una solicitud asignada
    reviewer = user_factory()
    request = registration_request_factory(
        estado=RegistrationRequest.Estado.EN_REVISION,
        assignment_key=reviewer
    )
    observaciones = "El DPI no es legible. Por favor, súbelo de nuevo."

    # Act: El revisor asignado envía sus observaciones
    updated_request = registration_service.submit_review(
        request_id=request.id,
        observaciones=observaciones,
        user=reviewer
    )

    # Assert: El estado y las observaciones deben actualizarse
    assert updated_request.estado == RegistrationRequest.Estado.PENDIENTE_CORRECCIONES
    assert updated_request.observaciones == observaciones


def test_submit_review_unauthorized_user(registration_request_factory, user_factory):
    """
    Verifica que un usuario que no es el asignado no puede enviar
    observaciones.
    """
    # Arrange: Crear una solicitud asignada a 'reviewer'
    reviewer = user_factory(username="revisor_asignado")
    unauthorized_user = user_factory(username="otro_revisor")
    request = registration_request_factory(
        estado=RegistrationRequest.Estado.EN_REVISION,
        assignment_key=reviewer
    )

    # Act & Assert: La llamada debe lanzar PermissionDenied
    with pytest.raises(PermissionDenied):
        registration_service.submit_review(
            request_id=request.id,
            observaciones="Observaciones no autorizadas",
            user=unauthorized_user
        )
