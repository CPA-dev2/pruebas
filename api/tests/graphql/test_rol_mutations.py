import pytest
import json
from graphql_relay import to_global_id
from api.models import Rol

pytestmark = pytest.mark.django_db

# --- Pruebas de CreateRolMutation ---

def test_create_rol_by_superuser(superuser_auth_headers, api_client):
    """
    Verifica que un superusuario puede crear un nuevo rol.
    """
    mutation = """
        mutation CreateRol($nombre: String!, $canCreate: Boolean) {
            createRol(nombre: $nombre, canCreateItems: $canCreate) {
                rol {
                    nombre
                    canCreateItems
                }
            }
        }
    """
    variables = {"nombre": "Nuevo Rol", "canCreate": True}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content, f"Error en la mutación: {content.get('errors')}"
    rol_data = content['data']['createRol']['rol']
    assert rol_data['nombre'] == "Nuevo Rol"
    assert rol_data['canCreateItems'] is True
    assert Rol.objects.filter(nombre="Nuevo Rol").exists()

def test_create_rol_by_non_superuser(editor_auth_headers, api_client):
    """
    Verifica que un usuario normal no puede crear un rol.
    """
    mutation = """
        mutation CreateRol($nombre: String!) {
            createRol(nombre: $nombre) {
                rol {
                    id
                }
            }
        }
    """
    variables = {"nombre": "Rol No Autorizado"}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes permiso para realizar esta acción."

# --- Pruebas de UpdateRolMutation ---

def test_update_rol_by_superuser(superuser_auth_headers, api_client, rol_editor):
    """
    Verifica que un superusuario puede actualizar un rol existente.
    """
    rol_id = to_global_id('RolType', rol_editor.pk)
    mutation = """
        mutation UpdateRol($id: ID!, $nombre: String, $canDelete: Boolean) {
            updateRol(id: $id, nombre: $nombre, canDeleteItems: $canDelete) {
                rol {
                    nombre
                    canDeleteItems
                }
            }
        }
    """
    variables = {"id": rol_id, "nombre": "Editor Senior", "canDelete": True}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    rol_data = content['data']['updateRol']['rol']
    assert rol_data['nombre'] == "Editor Senior"
    assert rol_data['canDeleteItems'] is True
    rol_editor.refresh_from_db()
    assert rol_editor.nombre == "Editor Senior"
    assert rol_editor.can_delete_items is True

# --- Pruebas de DeleteRolMutation ---

def test_delete_rol_by_superuser(superuser_auth_headers, api_client, rol_viewer):
    """
    Verifica que un superusuario puede eliminar (soft delete) un rol.
    """
    rol_id = to_global_id('RolType', rol_viewer.pk)
    mutation = """
        mutation DeleteRol($id: ID!) {
            deleteRol(id: $id) {
                success
            }
        }
    """
    variables = {"id": rol_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['deleteRol']['success'] is True
    rol_viewer.refresh_from_db()
    assert rol_viewer.is_deleted is True

def test_delete_rol_with_active_users(superuser_auth_headers, api_client, editor_user):
    """
    Verifica que no se puede eliminar un rol si tiene usuarios activos asignados.
    """
    rol_id = to_global_id('RolType', editor_user.rol.pk)
    mutation = """
        mutation DeleteRol($id: ID!) {
            deleteRol(id: $id) {
                success
            }
        }
    """
    variables = {"id": rol_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert "No se puede eliminar un rol asignado a usuarios activos" in content['errors'][0]['message']