import pytest
import json
from graphql_relay import to_global_id
from api.models import Usuario, Rol

pytestmark = pytest.mark.django_db

# --- Pruebas de CreateUserMutation ---

def test_create_user_by_superuser(superuser_auth_headers, api_client, rol_editor):
    """
    Verifica que un superusuario puede crear un nuevo usuario y asignarle un rol.
    """
    rol_id = to_global_id('RolType', rol_editor.pk)
    mutation = """
        mutation CreateUser($username: String!, $password: String!, $email: String!, $firstName: String!, $lastName: String!, $rolId: ID) {
            createUser(username: $username, password: $password, email: $email, firstName: $firstName, lastName: $lastName, rolId: $rolId) {
                user {
                    username
                    email
                    firstName
                    lastName
                    rol {
                        nombre
                    }
                }
            }
        }
    """
    variables = {
        "username": "new.user",
        "password": "password123",
        "email": "new.user@example.com",
        "firstName": "Nombre_User",
        "lastName": "Apellido_User",
        "rolId": rol_id
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content, f"Error al crear usuario: {content.get('errors')}"
    user_data = content['data']['createUser']['user']
    assert user_data['username'] == "new.user"
    assert user_data['email'] == "new.user@example.com"
    assert user_data['rol']['nombre'] == "Editor"
    assert Usuario.objects.filter(username="new.user").exists()


def test_create_user_by_non_superuser(editor_auth_headers, api_client):
    """
    Verifica que un usuario normal no puede crear otros usuarios.
    """
    mutation = """
        mutation CreateUser($username: String!, $password: String!, $email: String!, $firstName: String!, $lastName: String!, $rolId: ID) {
            createUser(username: $username, password: $password, email: $email, firstName: $firstName, lastName: $lastName, rolId: $rolId) {
                user {
                    username
                    email
                    firstName
                    lastName
                    rol {
                        nombre
                    }
                }
            }
        }
    """
    variables = {
        "username": "hacker",
        "password": "123",
        "email": "hacker@example.com",
        "firstName": "Nombre_Hacker",
        "lastName": "Apellido_Hacker",
        "rolId": None
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content['errors'][0]['message'] == "No tienes permisos de administrador para realizar esta acción."

# --- Pruebas de UpdateUserMutation ---


def test_update_user_by_superuser(superuser_auth_headers, api_client, viewer_user, rol_editor):
    """
    Verifica que un superusuario puede actualizar los datos de otro usuario,
    incluyendo su rol.
    """
    user_id = to_global_id('UsuarioType', viewer_user.pk)
    new_rol_id = to_global_id('RolType', rol_editor.pk)

    mutation = """
        mutation UpdateUser($id: ID!, $lastName: String, $rolId: ID) {
            updateUser(id: $id, lastName: $lastName, rolId: $rolId) {
                user {
                    lastName
                    rol {
                        nombre
                    }
                }
            }
        }
    """
    variables = {"id": user_id, "lastName": "Smith", "rolId": new_rol_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    user_data = content['data']['updateUser']['user']
    assert user_data['lastName'] == "Smith"
    assert user_data['rol']['nombre'] == "Editor"

    viewer_user.refresh_from_db()
    assert viewer_user.last_name == "Smith"
    assert viewer_user.rol.nombre == "Editor"

# --- Pruebas de DeleteUserMutation ---


def test_delete_user_by_superuser(superuser_auth_headers, api_client, editor_user):
    """
    Verifica que un superusuario puede eliminar (soft delete) a otro usuario.
    """
    user_id = to_global_id('UsuarioType', editor_user.pk)
    mutation = """
        mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
                success
            }
        }
    """
    variables = {"id": user_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['deleteUser']['success'] is True

    editor_user.refresh_from_db()
    assert editor_user.is_deleted is True


def test_delete_self_user_fails(superuser_auth_headers, api_client, superuser):
    """
    Verifica que un usuario (incluso superusuario) no puede eliminarse a sí mismo.
    """
    user_id = to_global_id('UsuarioType', superuser.pk)
    mutation = """
        mutation DeleteUser($id: ID!) {
            deleteUser(id: $id) {
                success
            }
        }
    """
    variables = {"id": user_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert "No puedes eliminar tu propio usuario" in content['errors'][0]['message']