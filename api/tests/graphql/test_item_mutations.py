import pytest
import json
from graphql_relay import to_global_id, from_global_id
from api.models import Item

pytestmark = pytest.mark.django_db

# --- Pruebas de CreateItemMutation ---

def test_create_item_unauthorized(viewer_auth_headers, api_client):
    """
    Verifica que un usuario sin permiso `can_create_items` no puede crear un item.
    """
    mutation = """
        mutation CreateItem($nombre: String!, $descripcion: String) {
            createItem(nombre: $nombre, descripcion: $descripcion) {
                item {
                    id
                    nombre
                }
            }
        }
    """
    variables = {"nombre": "Item No Autorizado", "descripcion": "Intento de creación"}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."


def test_create_item_authorized(editor_auth_headers, api_client):
    """
    Verifica que un usuario con permiso `can_create_items` puede crear un item.
    """
    mutation = """
        mutation CreateItem($nombre: String!, $descripcion: String) {
            createItem(nombre: $nombre, descripcion: $descripcion) {
                item {
                    id
                    nombre
                    descripcion
                }
            }
        }
    """
    variables = {"nombre": "Nuevo Item", "descripcion": "Creado exitosamente"}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    item_data = content['data']['createItem']['item']
    assert item_data['nombre'] == "Nuevo Item"
    assert item_data['descripcion'] == "Creado exitosamente"
    assert Item.objects.filter(nombre="Nuevo Item").exists()

# --- Pruebas de UpdateItemMutation ---

def test_update_item_unauthorized(viewer_auth_headers, api_client, item_global_id_factory):
    """
    Verifica que un usuario sin permiso `can_update_items` no puede actualizar un item.
    """
    item_id = item_global_id_factory(nombre="Item Original")
    mutation = """
        mutation UpdateItem($id: ID!, $nombre: String) {
            updateItem(id: $id, nombre: $nombre) {
                item {
                    id
                    nombre
                }
            }
        }
    """
    variables = {"id": item_id, "nombre": "Nombre Actualizado No Autorizado"}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."
    assert Item.objects.get(nombre="Item Original") is not None


def test_update_item_authorized(editor_auth_headers, api_client, item_global_id_factory):
    """
    Verifica que un usuario con permiso `can_update_items` puede actualizar un item.
    """
    item_id = item_global_id_factory(nombre="Item a Editar")
    mutation = """
        mutation UpdateItem($id: ID!, $nombre: String, $isActive: Boolean) {
            updateItem(id: $id, nombre: $nombre, isActive: $isActive) {
                item {
                    nombre
                    isActive
                }
            }
        }
    """
    variables = {"id": item_id, "nombre": "Nombre Cambiado", "isActive": False}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    item_data = content['data']['updateItem']['item']
    assert item_data['nombre'] == "Nombre Cambiado"
    assert item_data['isActive'] is False

    updated_item = Item.objects.get(pk=from_global_id(item_id)[1])
    assert updated_item.nombre == "Nombre Cambiado"
    assert updated_item.is_active is False

# --- Pruebas de DeleteItemMutation (Soft Delete) ---

def test_delete_item_unauthorized(viewer_auth_headers, api_client, item_global_id_factory):
    """
    Verifica que un usuario sin permiso `can_delete_items` no puede hacer soft delete.
    """
    item_id = item_global_id_factory()
    mutation = """
        mutation DeleteItem($id: ID!) {
            deleteItem(id: $id) {
                success
            }
        }
    """
    variables = {"id": item_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."
    assert Item.objects.get(pk=from_global_id(item_id)[1]).is_deleted is False


def test_delete_item_authorized(superuser_auth_headers, api_client, item_global_id_factory):
    """
    Verifica que un usuario con permiso `can_delete_items` puede hacer soft delete.
    """
    item_id = item_global_id_factory()
    item_pk = from_global_id(item_id)[1]

    mutation = """
        mutation DeleteItem($id: ID!) {
            deleteItem(id: $id) {
                success
            }
        }
    """
    variables = {"id": item_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['deleteItem']['success'] is True
    assert Item.objects.get(pk=item_pk).is_deleted is True

# --- Pruebas de HardDeleteItemMutation ---

def test_hard_delete_item(superuser_auth_headers, api_client, item_global_id_factory):
    """
    Verifica que un superusuario puede eliminar físicamente un item.
    """
    item_id = item_global_id_factory()
    item_pk = from_global_id(item_id)[1]

    mutation = """
        mutation HardDeleteItem($id: ID!) {
            hardDeleteItem(id: $id) {
                success
            }
        }
    """
    variables = {"id": item_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['hardDeleteItem']['success'] is True
    with pytest.raises(Item.DoesNotExist):
        Item.objects.get(pk=item_pk)