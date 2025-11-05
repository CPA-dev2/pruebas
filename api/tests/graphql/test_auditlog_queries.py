import pytest
import json
from graphql_relay import to_global_id
from api.models import Auditlog, Usuario

pytestmark = pytest.mark.django_db

def test_all_auditlogs_query_unauthenticated(api_client):
    """
    Verifica que un usuario no autenticado no puede consultar la lista de registros de auditoría,
    recibiendo un error de autenticación.
    """
    query = """
        query {
            allAuditlogs {
                edges {
                    node {
                        id
                        usuario {
                            username
                        }
                        accion
                        descripcion
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json"
    )

    content = response.json()
    assert "errors" in content
    assert len(content["errors"]) == 1
    assert content["errors"][0]["message"] == "Debes iniciar sesión para realizar esta acción."


def test_all_auditlogs_query_unauthorized_user(api_client, usuario_sin_permisos, auth_headers_factory):
    """
    Verifica que un usuario sin permisos no puede consultar la lista de registros de auditoría.
    """
    # Autenticar con JWT
    auth_headers = auth_headers_factory("sin_permisos", "testpass123")
    
    query = """
        query {
            allAuditlogs {
                edges {
                    node {
                        id
                        usuario {
                            username
                        }
                        accion
                        descripcion
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert len(content["errors"]) == 1
    assert "No tienes permisos para ver registros de auditoría" in content["errors"][0]["message"]


def test_all_auditlogs_query_authorized_user(api_client, usuario_admin, auditlog_sample, auth_headers_factory):
    """
    Verifica que un usuario autorizado puede consultar la lista de registros de auditoría.
    """
    # Autenticar con JWT
    auth_headers = auth_headers_factory("admin", "testpass123")
    
    query = """
        query {
            allAuditlogs {
                edges {
                    node {
                        id
                        usuario {
                            username
                        }
                        accion
                        descripcion
                        created
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert "data" in content
    assert "allAuditlogs" in content["data"]
    
    auditlogs = content["data"]["allAuditlogs"]["edges"]
    assert len(auditlogs) >= 1
    
    # Verificar estructura del primer auditlog
    first_auditlog = auditlogs[0]["node"]
    assert "id" in first_auditlog
    assert "usuario" in first_auditlog
    assert "accion" in first_auditlog
    assert "descripcion" in first_auditlog
    assert "created" in first_auditlog


def test_auditlogs_with_date_filters(api_client, usuario_admin, auditlog_sample, auth_headers_factory):
    """
    Verifica que los filtros de fecha funcionan correctamente.
    """
    # Autenticar con JWT
    auth_headers = auth_headers_factory("admin", "testpass123")

    query = """
        query($createdAfter: DateTime, $createdBefore: DateTime) {
            allAuditlogs(createdAfter: $createdAfter, createdBefore: $createdBefore) {
                edges {
                    node {
                        id
                        accion
                        created
                    }
                }
            }
        }
    """
    
    variables = {
        "createdAfter": "2025-10-11T00:00:00.000Z",
        "createdBefore": "2025-10-11T23:59:59.999Z"
    }
    
    data = {"query": query, "variables": variables}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert "data" in content
    assert "allAuditlogs" in content["data"]


def test_auditlogs_total_count(api_client, usuario_admin, auditlog_sample, auth_headers_factory):
    """
    Verifica que el total count funciona correctamente.
    """
    # Autenticar con JWT
    auth_headers = auth_headers_factory("admin", "testpass123")
    
    query = """
        query {
            auditlogsTotalCount
        }
    """
    
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert "data" in content
    assert "auditlogsTotalCount" in content["data"]
    assert isinstance(content["data"]["auditlogsTotalCount"], int)
    assert content["data"]["auditlogsTotalCount"] >= 0


def test_create_auditlog_record(api_client, usuario_admin):
    """
    Verifica que se puede crear un registro de auditoría correctamente.
    """
    from api.services.auditlog_service import log_action
    from api.models import Auditlog
    
    # Contar registros antes
    initial_count = Auditlog.objects.count()
    
    # Crear un registro de auditoría
    accion = "Test Action"
    descripcion = "This is a test audit log entry"
    
    log_action(usuario_admin, accion, descripcion)
    
    # Verificar que se creó el registro
    final_count = Auditlog.objects.count()
    assert final_count == initial_count + 1
    
    # Obtener el registro más reciente
    latest_auditlog = Auditlog.objects.latest('created')
    
    # Verificar los datos del registro
    assert latest_auditlog.usuario == usuario_admin
    assert latest_auditlog.accion == accion
    assert latest_auditlog.descripcion == descripcion
    assert latest_auditlog.is_active is True
    assert latest_auditlog.is_deleted is False
    assert latest_auditlog.created is not None


def test_create_multiple_auditlog_records(api_client, usuario_admin, usuario_sin_permisos):
    """
    Verifica que se pueden crear múltiples registros de auditoría para diferentes usuarios.
    """
    from api.services.auditlog_service import log_action
    from api.models import Auditlog
    
    # Contar registros antes
    initial_count = Auditlog.objects.count()
    
    # Crear registros para diferentes usuarios
    test_data = [
        (usuario_admin, "Admin Acción", "Admin realizó una acción"),
        (usuario_sin_permisos, "User Acción", "User intentó realizar una acción"),
        (usuario_admin, "Another Admin Acción", "Admin realizó otra acción")
    ]
    
    for usuario, accion, descripcion in test_data:
        log_action(usuario, accion, descripcion)
    
    # Verificar que se crearon todos los registros
    final_count = Auditlog.objects.count()
    assert final_count == initial_count + len(test_data)
    
    # Verificar los últimos registros creados
    latest_auditlogs = Auditlog.objects.order_by('-created')[:len(test_data)]
    
    # Los registros están en orden inverso (más reciente primero)
    for i, (expected_usuario, expected_accion, expected_descripcion) in enumerate(reversed(test_data)):
        auditlog = latest_auditlogs[i]
        assert auditlog.usuario == expected_usuario
        assert auditlog.accion == expected_accion
        assert auditlog.descripcion == expected_descripcion

