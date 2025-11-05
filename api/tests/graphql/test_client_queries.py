import pytest
import json

pytestmark = pytest.mark.django_db


def test_all_clients_query_unauthenticated(api_client):
    """
    Verifica que un usuario no autenticado no puede consultar la lista de clientes,
    recibiendo un error de autenticación.
    """
    query = """
        query {
            allClients {
                edges {
                    node {
                        id
                        nombres
                        apellidos
                        email
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


@pytest.mark.parametrize("auth_headers_fixture", [
    "editor_auth_headers",
    "viewer_auth_headers"
])


def test_all_clients_query_authenticated(request, api_client, client_factory, auth_headers_fixture):
    """
    Verifica que cualquier usuario autenticado (editor o visor) puede consultar
    la lista de clientes.
    """
    auth_headers = request.getfixturevalue(auth_headers_fixture)
    
    # Crear algunos clientes de prueba
    client_factory(nombres="Juan", apellidos="Pérez", dpi="1234567890123", email="juan@test.com")
    client_factory(nombres="María", apellidos="González", dpi="9876543210987", email="maria@test.com")
    client_factory(nombres="Inactivo", apellidos="Test", dpi="5555555555555", email="inactivo@test.com", is_deleted=True)

    query = """
        query AllClientsQuery {
            allClients {
                edges {
                    node {
                        id
                        nombres
                        apellidos
                        dpi
                        email
                        isActive
                        isDeleted
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
    assert "errors" not in content, f"La consulta autenticada falló: {content.get('errors')}"
    
    results = content["data"]["allClients"]["edges"]
    # La consulta por defecto solo devuelve clientes no eliminados, así que esperamos 2
    assert len(results) == 2
    
    client_names = [node["node"]["nombres"] for node in results]
    assert "Juan" in client_names
    assert "María" in client_names
    assert all(node["node"]["isDeleted"] is False for node in results)


def test_clients_total_count_query(editor_auth_headers, api_client, client_factory):
    """
    Verifica que la consulta clientsTotalCount devuelve el número correcto de clientes activos.
    """
    # Crear clientes de prueba
    client_factory(nombres="Cliente 1", dpi="1111111111111", email="cliente1@test.com")
    client_factory(nombres="Cliente 2", dpi="2222222222222", email="cliente2@test.com")
    client_factory(nombres="Cliente 3", dpi="3333333333333", email="cliente3@test.com", is_deleted=True)

    query = """
        query {
            clientsTotalCount
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['clientsTotalCount'] == 2  # Solo los no eliminados


def test_client_query_by_id(editor_auth_headers, api_client, client_global_id_factory):
    """
    Verifica que se puede recuperar un cliente específico usando su ID global.
    """
    client_id = client_global_id_factory(
        nombres="Cliente Específico",
        apellidos="Apellido Test",
        dpi="9999999999999",
        email="especifico@test.com",
        telefono="12345678"
    )

    query = """
        query GetClient($id: ID!) {
            client(id: $id) {
                id
                nombres
                apellidos
                dpi
                email
                telefono
            }
        }
    """
    variables = {"id": client_id}
    data = {"query": query, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['client']['id'] == client_id
    assert content['data']['client']['nombres'] == "Cliente Específico"
    assert content['data']['client']['apellidos'] == "Apellido Test"
    assert content['data']['client']['dpi'] == "9999999999999"


def test_clients_search_filter(editor_auth_headers, api_client, client_factory):
    """
    Verifica que el filtro de búsqueda funciona correctamente en múltiples campos.
    """
    # Crear clientes con diferentes datos para probar la búsqueda
    client_factory(nombres="Juan Carlos", apellidos="Pérez", dpi="1111111111111", email="juan@test.com")
    client_factory(nombres="María", apellidos="González", dpi="2222222222222", email="maria@test.com")
    client_factory(nombres="Pedro", apellidos="Martínez", dpi="3333333333333", email="pedro@gmail.com")
    client_factory(nombres="Ana", apellidos="López", dpi="4444444444444", email="ana@yahoo.com")

    # Test búsqueda por nombre
    query = """
        query SearchClients($search: String!) {
            allClients(search: $search) {
                edges {
                    node {
                        nombres
                        apellidos
                        email
                        dpi
                    }
                }
            }
        }
    """
    
    # Buscar por nombre "Juan"
    variables = {"search": "Juan"}
    data = {"query": query, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    clients = content["data"]["allClients"]["edges"]
    assert len(clients) == 1
    assert clients[0]["node"]["nombres"] == "Juan Carlos"

    # Buscar por apellido "González"
    variables = {"search": "González"}
    data = {"query": query, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    clients = content["data"]["allClients"]["edges"]
    assert len(clients) == 1
    assert clients[0]["node"]["apellidos"] == "González"

    # Buscar por dominio de email "gmail"
    variables = {"search": "gmail"}
    data = {"query": query, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    clients = content["data"]["allClients"]["edges"]
    assert len(clients) == 1
    assert clients[0]["node"]["nombres"] == "Pedro"

    # Buscar por DPI "4444444444444"
    variables = {"search": "4444444444444"}
    data = {"query": query, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    clients = content["data"]["allClients"]["edges"]
    assert len(clients) == 1
    assert clients[0]["node"]["dpi"] == "4444444444444"


def test_clients_with_nit_scenarios(editor_auth_headers, api_client, client_factory):
    """
    Verifica que los clientes con diferentes escenarios de NIT se manejan correctamente.
    """
    # Cliente con NIT
    client_factory(
        nombres="Cliente con NIT",
        dpi="1111111111111",
        email="connit@test.com",
        nit="12345678",
        telefono="11111111"
    )
    
    # Cliente sin NIT (None)
    client_factory(
        nombres="Cliente sin NIT",
        dpi="2222222222222",
        email="sinnit@test.com",
        telefono="22222222",
        nit=None
    )
    
    # Otro cliente sin NIT (debería permitir múltiples None)
    client_factory(
        nombres="Otro sin NIT",
        dpi="3333333333333",
        email="otrosinnit@test.com",
        telefono="33333333",
        nit=None
    )

    query = """
        query {
            allClients {
                edges {
                    node {
                        nombres
                        nit
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    clients = content["data"]["allClients"]["edges"]
    assert len(clients) == 3
    
    # Verificar que tenemos un cliente con NIT y dos sin NIT
    clients_with_nit = [c for c in clients if c["node"]["nit"] is not None]
    clients_without_nit = [c for c in clients if c["node"]["nit"] is None]
    
    assert len(clients_with_nit) == 1
    assert len(clients_without_nit) == 2
    assert clients_with_nit[0]["node"]["nit"] == "12345678"

