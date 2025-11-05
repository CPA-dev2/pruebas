import pytest
import json
from graphql_relay import to_global_id

pytestmark = pytest.mark.django_db

def test_all_distributors_query_unauthenticated(api_client):
    """
    Verifica que un usuario no autenticado no puede consultar la lista de distribuidores,
    recibiendo un error de autenticación.
    """
    query = """
        query {
            allDistributors {
                edges {
                    node {
                        id
                        nombres
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
    assert content["errors"][0]["message"] == "Debes estar autenticado para consultar distribuidores."

@pytest.mark.parametrize("auth_headers_fixture", [
    "editor_auth_headers",
    "viewer_auth_headers"
])


def test_all_distributors_query_authenticated(request, api_client, distributor_factory, auth_headers_fixture):
    """
    Verifica que cualquier usuario autenticado (editor o visor) puede consultar
    la lista de distribuidores.
    """
    distributor_factory(negocio_nombre="Distribuidor Test 1")
    distributor_factory(negocio_nombre="Distribuidor Test 2")

    auth_headers = request.getfixturevalue(auth_headers_fixture)

    query = """
        query AllDistributorsQuery {
            allDistributors {
                edges {
                    node {
                        id
                        nombres
                        negocioNombre
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
    distributors = content["data"]["allDistributors"]["edges"]
    assert len(distributors) == 2
    negocios = {dist["node"]["negocioNombre"] for dist in distributors}
    assert "Distribuidor Test 1" in negocios
    assert "Distribuidor Test 2" in negocios


def test_distributor_query_by_id(api_client, distributor_factory, viewer_auth_headers):
    """
    Verifica que cualquier usuario autenticado (editor o visor) puede consultar
    un distribuidor por su ID.
    """
    distributor = distributor_factory(negocio_nombre="Distribuidor Test 1", nombres="Juan", apellidos="Pérez")
    distributor_id = to_global_id('DistributorNode', distributor.pk)
    auth_headers = viewer_auth_headers

    query = """
        query DistributorQuery($id: ID!) {
            distributor(id: $id) {
                id
                nombres
                apellidos
                negocioNombre
            }
        }
    """
    variables = {"id": distributor_id}
    data = {"query": query, "variables": variables}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )
    content = response.json()
    assert "errors" not in content
    distribuidor = content["data"]["distributor"]
    assert distribuidor["id"] == distributor_id
    assert distribuidor["nombres"] == "Juan"
    assert distribuidor["apellidos"] == "Pérez"
    assert distribuidor["negocioNombre"] == "Distribuidor Test 1"


def test_distributor_search_query(api_client, distributor_factory, editor_auth_headers):
    """
    Verifica que cualquier usuario autenticado (editor o visor) puede buscar
    distribuidores por nombre de negocio.
    """
    distributor_factory(negocio_nombre="Distribuidor Alfa")
    distributor_factory(negocio_nombre="Distribuidor Beta")
    distributor_factory(negocio_nombre="Otro Distribuidor")

    auth_headers = editor_auth_headers

    query = """
        query DistributorSearchQuery($search: String!) {
            allDistributors(search: $search) {
                edges {
                    node {
                        id
                        negocioNombre
                    }
                }
            }
        }
    """
    variables = {"search": "Alfa"}
    data = {"query": query, "variables": variables}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )
    content = response.json()
    assert "errors" not in content
    distributors = content["data"]["allDistributors"]["edges"]
    assert len(distributors) == 1
    assert distributors[0]["node"]["negocioNombre"] == "Distribuidor Alfa"


def test_distributors_total_count_query(api_client, distributor_factory, viewer_auth_headers):
    """
    Verifica que la consulta `distributorsTotalCount` devuelve el número correcto
    de distribuidores activos.
    """
    distributor_factory(negocio_nombre="Activo 1")
    distributor_factory(negocio_nombre="Activo 2")
    distributor_factory(negocio_nombre="Activo 3")

    auth_headers = viewer_auth_headers

    query = """
        query {
            distributorsTotalCount
        }
    """
    data = {"query": query}
    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['distributorsTotalCount'] == 3



 


