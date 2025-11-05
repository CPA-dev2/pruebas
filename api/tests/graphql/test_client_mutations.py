import pytest
import json
from graphql_relay import to_global_id, from_global_id
from api.models import Client

pytestmark = pytest.mark.django_db

# --- Pruebas de CreateClientMutation ---

def test_create_client_unauthorized(viewer_auth_headers, api_client):
    """
    Verifica que un usuario sin permiso `can_create_clients` no puede crear un cliente.
    """
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!, $apellidos: String, $direccion: String, $nit: String) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono, apellidos: $apellidos, direccion: $direccion, nit: $nit) {
                client {
                    id
                    nombres
                    apellidos
                }
            }
        }
    """
    variables = {
        "nombres": "Cliente No Autorizado", 
        "apellidos": "Apellido Test",
        "dpi": "1234567890123", 
        "email": "noautorizado@test.com",
        "telefono": "12345678"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."


def test_create_client_authorized(editor_auth_headers, api_client):
    """
    Verifica que un usuario con permiso `can_create_clients` puede crear un cliente.
    """
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!, $apellidos: String, $direccion: String, $nit: String) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono, apellidos: $apellidos, direccion: $direccion, nit: $nit) {
                client {
                    id
                    nombres
                    apellidos
                    dpi
                    email
                    telefono
                    nit
                }
            }
        }
    """
    variables = {
        "nombres": "Nuevo Cliente", 
        "apellidos": "Cliente Nuevo",
        "dpi": "9876543210987", 
        "email": "nuevo@test.com",
        "telefono": "87654321",
        "direccion": "Dirección Nueva",
        "nit": "12345678"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content, f"Error al crear cliente: {content.get('errors')}"
    client_data = content['data']['createClient']['client']
    assert client_data['nombres'] == "Nuevo Cliente"
    assert client_data['apellidos'] == "Cliente Nuevo"
    assert client_data['dpi'] == "9876543210987"
    assert client_data['nit'] == "12345678"
    assert Client.objects.filter(nombres="Nuevo Cliente").exists()

# --- Pruebas específicas de validación DPI ---

def test_create_client_with_empty_dpi(editor_auth_headers, api_client):
    """
    Verifica que no se puede crear un cliente con DPI vacío.
    """
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono) {
                client {
                    nombres
                }
            }
        }
    """
    variables = {
        "nombres": "Cliente Sin DPI", 
        "dpi": "",  # DPI vacío
        "email": "sindpi@test.com",
        "telefono": "55555555"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )
    content = response.json()
    assert "errors" in content
    assert "El campo DPI es obligatorio y no puede estar vacío." in content["errors"][0]["message"]


def test_create_client_duplicate_dpi(editor_auth_headers, api_client, client_factory):
    """
    Verifica que no se puede crear un cliente con DPI duplicado.
    """
    # Crear cliente existente
    client_factory(dpi="1111111111111", email="existente@test.com")
    
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono) {
                client {
                    nombres
                }
            }
        }
    """
    variables = {
        "nombres": "Cliente Duplicado", 
        "dpi": "1111111111111",  # DPI duplicado
        "email": "nuevo@test.com",
        "telefono": "12345678"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert "Ya existe un cliente con el DPI" in content["errors"][0]["message"]

 
# --- Pruebas de UpdateClientMutation ---

def test_update_client_unauthorized(viewer_auth_headers, api_client, client_global_id_factory):
    """
    Verifica que un usuario sin permiso `can_update_clients` no puede actualizar un cliente.
    """
    client_id = client_global_id_factory(nombres="Cliente Original")
    mutation = """
        mutation UpdateClient($id: ID!, $nombres: String) {
            updateClient(id: $id, nombres: $nombres) {
                client {
                    id
                    nombres
                }
            }
        }
    """
    variables = {"id": client_id, "nombres": "Nombre Actualizado No Autorizado"}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."
    assert Client.objects.get(nombres="Cliente Original") is not None


def test_update_client_authorized(editor_auth_headers, api_client, client_global_id_factory):
    """
    Verifica que un usuario con permiso `can_update_clients` puede actualizar un cliente.
    """
    client_id = client_global_id_factory(nombres="Cliente a Editar", nit="87654321")
    mutation = """
        mutation UpdateClient($id: ID!, $nombres: String, $nit: String, $isActive: Boolean) {
            updateClient(id: $id, nombres: $nombres, nit: $nit, isActive: $isActive) {
                client {
                    nombres
                    nit
                    isActive
                }
            }
        }
    """
    variables = {"id": client_id, "nombres": "Cliente Editado", "nit": "11111111", "isActive": False}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    client_data = content['data']['updateClient']['client']
    assert client_data['nombres'] == "Cliente Editado"
    assert client_data['nit'] == "11111111"
    assert client_data['isActive'] is False

    updated_client = Client.objects.get(pk=from_global_id(client_id)[1])
    assert updated_client.nombres == "Cliente Editado"
    assert updated_client.nit == "11111111"
    assert updated_client.is_active is False

# --- Pruebas de DeleteClientMutation (Soft Delete) ---

def test_delete_client_unauthorized(viewer_auth_headers, api_client, client_global_id_factory):
    """
    Verifica que un usuario sin permiso `can_delete_clients` no puede hacer soft delete.
    """
    client_id = client_global_id_factory()
    mutation = """
        mutation DeleteClient($id: ID!) {
            deleteClient(id: $id) {
                success
            }
        }
    """
    variables = {"id": client_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."
    assert Client.objects.get(pk=from_global_id(client_id)[1]).is_deleted is False


def test_delete_client_authorized(editor_auth_headers, api_client, client_global_id_factory):
    """
    Verifica que un usuario con permiso `can_delete_clients` puede hacer soft delete.
    """
    client_id = client_global_id_factory()
    client_pk = from_global_id(client_id)[1]

    mutation = """
        mutation DeleteClient($id: ID!) {
            deleteClient(id: $id) {
                success
            }
        }
    """
    variables = {"id": client_id}
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['deleteClient']['success'] is True
    assert Client.objects.get(pk=client_pk).is_deleted is True

# --- Pruebas específicas de validación NIT ---

def test_update_client_nit_to_null(editor_auth_headers, api_client, client_global_id_factory):
    """
    Verifica que se puede actualizar un cliente para quitar el NIT (NULL).
    """
    client_id = client_global_id_factory(nombres="Cliente Con NIT", nit="99999999")
    mutation = """
        mutation UpdateClient($id: ID!, $nit: String) {
            updateClient(id: $id, nit: $nit) {
                client {
                    nombres
                    nit
                }
            }
        }
    """
    variables = {"id": client_id, "nit": ""}  # String vacío se convierte a NULL
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    client_data = content['data']['updateClient']['client']
    assert client_data['nit'] is None

    updated_client = Client.objects.get(pk=from_global_id(client_id)[1])
    assert updated_client.nit is None


def test_create_client_with_null_nit(editor_auth_headers, api_client):
    """
    Verifica que se puede crear un cliente sin NIT (NULL).
    """
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono) {
                client {
                    nombres
                    nit
                }
            }
        }
    """
    variables = {
        "nombres": "Cliente Sin NIT", 
        "dpi": "5555555555555", 
        "email": "sinnit@test.com",
        "telefono": "55555555"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )
    content = response.json()
    assert "errors" in content
    assert "El campo DPI es obligatorio y no puede estar vacío." in content["errors"][0]["message"]


def test_create_client_with_null_nit(editor_auth_headers, api_client):
    """
    Verifica que se puede crear un cliente sin NIT (NULL).
    """
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono) {
                client {
                    nombres
                    nit
                }
            }
        }
    """
    variables = {
        "nombres": "Cliente Sin NIT", 
        "dpi": "5555555555555", 
        "email": "sinnit@test.com",
        "telefono": "55555555"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    client_data = content['data']['createClient']['client']
    assert client_data['nit'] is None


def test_create_multiple_clients_with_null_nit(editor_auth_headers, api_client):
    """
    Verifica que se pueden crear múltiples clientes con NIT NULL (sin violación de unicidad).
    """
    # Crear primer cliente sin NIT
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono) {
                client {
                    nombres
                    nit
                }
            }
        }
    """
    
    # Cliente 1 sin NIT
    variables1 = {
        "nombres": "Cliente 1 Sin NIT", 
        "dpi": "1111111111111", 
        "email": "cliente1@test.com",
        "telefono": "11111111"
    }
    data1 = {"query": mutation, "variables": json.dumps(variables1)}
    response1 = api_client.post(
        "/graphql/", json.dumps(data1), content_type="application/json", **editor_auth_headers
    )

    # Cliente 2 sin NIT
    variables2 = {
        "nombres": "Cliente 2 Sin NIT", 
        "dpi": "2222222222222", 
        "email": "cliente2@test.com",
        "telefono": "22222222"
    }
    data2 = {"query": mutation, "variables": json.dumps(variables2)}
    response2 = api_client.post(
        "/graphql/", json.dumps(data2), content_type="application/json", **editor_auth_headers
    )

    # Ambos deberían crearse exitosamente
    content1 = response1.json()
    content2 = response2.json()
    
    assert "errors" not in content1
    assert "errors" not in content2
    assert content1['data']['createClient']['client']['nit'] is None
    assert content2['data']['createClient']['client']['nit'] is None


def test_create_client_duplicate_nit(editor_auth_headers, api_client, client_factory):
    """
    Verifica que no se puede crear un cliente con NIT duplicado (cuando no es NULL).
    """
    # Crear cliente existente con NIT
    client_factory(nit="88888888", dpi="1111111111111", email="existente@test.com")
    
    mutation = """
        mutation CreateClient($nombres: String!, $dpi: String!, $email: String!, $telefono: String!, $nit: String) {
            createClient(nombres: $nombres, dpi: $dpi, email: $email, telefono: $telefono, nit: $nit) {
                client {
                    nombres
                }
            }
        }
    """
    variables = {
        "nombres": "Cliente Duplicado NIT", 
        "dpi": "9999999999999",
        "email": "nuevo@test.com",
        "telefono": "12345678",
        "nit": "88888888"  # NIT duplicado
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert "Ya existe un cliente con el NIT" in content["errors"][0]["message"]
