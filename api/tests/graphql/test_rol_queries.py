import pytest
import json

pytestmark = pytest.mark.django_db

def test_all_roles_query_by_superuser(superuser_auth_headers, api_client, rol_admin, rol_editor):
    """
    Verifica que un superusuario puede consultar todos los roles.
    """
    query = """
        query {
            allRoles {
                edges {
                    node {
                        nombre
                    }
                }
            }
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    roles = {edge['node']['nombre'] for edge in content['data']['allRoles']['edges']}
    assert "Admin" in roles
    assert "Editor" in roles


def test_all_roles_query_by_non_superuser(editor_auth_headers, api_client):
    """
    Verifica que un usuario que no es superusuario no puede consultar los roles.
    """
    query = """
        query {
            allRoles {
                edges {
                    node {
                        nombre
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
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes permisos de administrador para realizar esta acción."


def test_roles_total_count_query(superuser_auth_headers, api_client, rol_admin, rol_editor, rol_viewer):
    """
    Verifica que `rolesTotalCount` devuelve el número correcto de roles.
    """
    # 3 roles creados por fixtures
    query = "{ rolesTotalCount }"
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **superuser_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['rolesTotalCount'] == 3