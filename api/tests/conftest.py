import pytest
import json
from django.test import Client
from api.models import Usuario, Rol, Item
from graphql_relay import to_global_id


@pytest.fixture
def api_client():
    """
    Fixture para proporcionar un cliente de API de Django para las pruebas.
    """
    return Client()


@pytest.fixture
def rol_admin(db):
    """
    Crea un rol de Administrador con todos los permisos de gestión de items.
    """
    return Rol.objects.create(
        nombre="Admin",
        can_create_items=True,
        can_update_items=True,
        can_delete_items=True
    )


@pytest.fixture
def rol_editor(db):
    """
    Crea un rol de Editor con permisos para crear y actualizar items, pero no eliminar.
    """
    return Rol.objects.create(
        nombre="Editor",
        can_create_items=True,
        can_update_items=True,
        can_delete_items=False
    )


@pytest.fixture
def rol_viewer(db):
    """
    Crea un rol de Visor sin permisos de escritura sobre los items.
    """
    return Rol.objects.create(
        nombre="Viewer",
        can_create_items=False,
        can_update_items=False,
        can_delete_items=False
    )


@pytest.fixture
def superuser(db):
    """
    Crea un superusuario de prueba para acciones que requieren máximos privilegios.
    """
    return Usuario.objects.create_superuser(
        username="superuser",
        email="superuser@example.com",
        password="password123",
        first_name="Super",
        last_name="User"
    )


@pytest.fixture
def editor_user(db, rol_editor):
    """
    Crea un usuario estándar con el rol de 'Editor'.
    """
    return Usuario.objects.create_user(
        username="editor",
        email="editor@example.com",
        password="password123",
        first_name="Editor",
        last_name="User",
        rol=rol_editor
    )


@pytest.fixture
def viewer_user(db, rol_viewer):
    """
    Crea un usuario estándar con el rol de 'Viewer'.
    """
    return Usuario.objects.create_user(
        username="viewer",
        email="viewer@example.com",
        password="password123",
        first_name="Viewer",
        last_name="User",
        rol=rol_viewer
    )


@pytest.fixture
def auth_headers_factory(api_client):
    """
    Factory fixture para generar cabeceras de autenticación JWT para un usuario.
    Esto permite crear cabeceras para diferentes usuarios en una misma prueba.
    """
    def _auth_headers(username, password):
        mutation = """
            mutation TokenAuth($username: String!, $password: String!) {
                tokenAuth(username: $username, password: $password) {
                    token
                }
            }
        """
        variables = {"username": username, "password": password}
        data = {"query": mutation, "variables": json.dumps(variables)}

        # Usamos la ruta de la api, no la de graphql
        response = api_client.post(
            "/api/graphql/", json.dumps(data), content_type="application/json"
        )

        content = response.json()
        if "errors" in content or 'token' not in content.get('data', {}).get('tokenAuth', {}):
            pytest.fail(f"Error al obtener el token para {username}: {content.get('errors')}")

        token = content['data']['tokenAuth']['token']
        return {"HTTP_AUTHORIZATION": f"JWT {token}"}

    return _auth_headers


@pytest.fixture
def superuser_auth_headers(superuser, auth_headers_factory):
    """
    Proporciona cabeceras de autenticación para el superusuario.
    """
    return auth_headers_factory("superuser", "password123")


@pytest.fixture
def editor_auth_headers(editor_user, auth_headers_factory):
    """
    Proporciona cabeceras de autenticación para el usuario con rol 'Editor'.
    """
    return auth_headers_factory("editor", "password123")


@pytest.fixture
def viewer_auth_headers(viewer_user, auth_headers_factory):
    """
    Proporciona cabeceras de autenticación para el usuario con rol 'Viewer'.
    """
    return auth_headers_factory("viewer", "password123")


@pytest.fixture
def item_factory(db):
    """
    Factory fixture para crear instancias del modelo `Item` para las pruebas.
    """
    def _create_item(**kwargs):
        default_data = {
            "nombre": "Item de prueba",
            "descripcion": "Una descripción de prueba."
        }
        default_data.update(kwargs)
        return Item.objects.create(**default_data)
    return _create_item


@pytest.fixture
def item_global_id_factory(item_factory):
    """
    Factory fixture para obtener el ID global de un `Item`.
    Crea un item y devuelve su ID en el formato de Relay.
    """
    def _create_and_get_id(**kwargs):
        item = item_factory(**kwargs)
        return to_global_id('ItemNode', item.pk)
    return _create_and_get_id