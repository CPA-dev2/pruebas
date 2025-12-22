import pytest
import json

pytestmark = pytest.mark.django_db

# --- Pruebas de la query `me` ---

def test_me_query_authenticated(editor_auth_headers, api_client, editor_user):
    """
    Verifica que un usuario autenticado puede consultar sus propios datos
    a través de la query `me`.
    """
    query = """
        query {
            me {
                username
                email
                rol {
                    nombre
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content, f"Error en la query `me`: {content.get('errors')}"
    me_data = content['data']['me']
    assert me_data['username'] == editor_user.username
    assert me_data['email'] == editor_user.email
    assert me_data['rol']['nombre'] == "Editor"

def test_me_query_unauthenticated(api_client):
    """
    Verifica que un usuario no autenticado no puede usar la query `me`.
    """
    query = "{ me { username } }"
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json"
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "Debes iniciar sesión para realizar esta acción."

# --- Pruebas de la query `allUsers` ---

def test_all_users_query_by_superuser(superuser_auth_headers, api_client, editor_user, viewer_user):
    """
    Verifica que un superusuario puede consultar la lista de todos los usuarios.
    """
    query = """
        query {
            allUsers {
                edges {
                    node {
                        username
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content

    # +1 para el propio superusuario que también es un usuario
    assert len(content['data']['allUsers']['edges']) == 3
    usernames = {edge['node']['username'] for edge in content['data']['allUsers']['edges']}
    assert "superuser" in usernames
    assert "editor" in usernames
    assert "viewer" in usernames

def test_all_users_query_by_non_superuser(editor_auth_headers, api_client):
    """
    Verifica que un usuario normal no puede consultar la lista de usuarios.
    """
    query = "{ allUsers { edges { node { username } } } }"
    data = {"query": query}
    response = api_client.post(
        "/api/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes permiso para realizar esta acción."