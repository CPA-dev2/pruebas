import pytest
import json

pytestmark = pytest.mark.django_db

def test_all_items_query_unauthenticated(api_client):
    """
    Verifica que un usuario no autenticado no puede consultar la lista de items,
    recibiendo un error de autenticación.
    """
    query = """
        query {
            allItems {
                edges {
                    node {
                        id
                        nombre
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json"
    )

    content = response.json()
    assert "errors" in content
    assert len(content["errors"]) == 1
    assert content["errors"][0]["message"] == "Debes iniciar sesión para realizar esta acción."

@pytest.mark.parametrize("auth_headers_fixture", [
    "editor_auth_headers",
    "viewer_auth_headers"
])
def test_all_items_query_authenticated(request, api_client, item_factory, auth_headers_fixture):
    """
    Verifica que cualquier usuario autenticado (editor o visor) puede consultar
    la lista de items.
    """
    item_factory(nombre="Test Item 1", descripcion="Descripción 1")
    item_factory(nombre="Test Item 2", is_active=False)

    auth_headers = request.getfixturevalue(auth_headers_fixture)

    query = """
        query AllItemsQuery {
            allItems {
                edges {
                    node {
                        id
                        nombre
                        isActive
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )

    content = response.json()
    assert "errors" not in content, f"La consulta autenticada falló: {content.get('errors')}"

    results = content['data']['allItems']['edges']
    # La consulta por defecto solo devuelve items activos, así que esperamos 1
    assert len(results) == 1
    assert results[0]['node']['nombre'] == "Test Item 1"
    assert results[0]['node']['isActive'] is True

def test_items_total_count_query(editor_auth_headers, api_client, item_factory):
    """
    Verifica que la consulta `itemsTotalCount` devuelve el número correcto
    de items activos.
    """
    item_factory(nombre="Activo 1")
    item_factory(nombre="Activo 2")
    item_factory(nombre="Inactivo", is_active=False)

    query = """
        query {
            itemsTotalCount
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['itemsTotalCount'] == 2

def test_item_query_by_id(editor_auth_headers, api_client, item_global_id_factory):
    """
    Verifica que se puede recuperar un item específico usando su ID global.
    """
    item_id = item_global_id_factory(nombre="Item Específico")

    query = """
        query GetItem($id: ID!) {
            item(id: $id) {
                id
                nombre
                descripcion
            }
        }
    """
    variables = {"id": item_id}
    data = {"query": query, "variables": json.dumps(variables)}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['item']['id'] == item_id
    assert content['data']['item']['nombre'] == "Item Específico"