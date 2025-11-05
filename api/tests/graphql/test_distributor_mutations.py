import pytest
import json
from graphql_relay import to_global_id
from api.models import Distributor

pytestmark = pytest.mark.django_db


def test_update_distributor_unauthorized(viewer_auth_headers, api_client, distributor_factory):
    """
    Verifica que un usuario sin permiso `can_update_distributors` no puede actualizar un distribuidor.
    """
    distributor = distributor_factory()
    mutation = """
        mutation UpdateDistributor($id: ID!, $nombres: String!) {
            updateDistributor(id: $id, nombres: $nombres) {
                distributor {
                    id
                    nombres
                }
            }
        }
    """
    variables = {
        "id": to_global_id("DistributorNode", distributor.id),
        "nombres": "Distribuidor No Autorizado"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **viewer_auth_headers
    )

    content = response.json()
    assert "errors" in content
    assert content["errors"][0]["message"] == "No tienes los permisos necesarios para realizar esta acción."


def test_update_distributor_authorized(editor_auth_headers, api_client, distributor_factory):
    """
    Verifica que un usuario con permiso `can_update_distributors` puede actualizar un distribuidor.
    """
    distributor = distributor_factory(nombres="Distribuidor Original", negocio_nombre="Negocio Original")
    mutation = """
        mutation UpdateDistributor($id: ID!, $nombres: String!) {
            updateDistributor(id: $id, nombres: $nombres) {
                distributor {
                    id
                    nombres
                }
            }
        }
    """
    variables = {
        "id": to_global_id("DistributorNode", distributor.id),
        "nombres": "Distribuidor Actualizado"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    distributor_data = content['data']['updateDistributor']['distributor']
    assert distributor_data['nombres'] == "Distribuidor Actualizado"


def test_update_distributor_nit_unique(editor_auth_headers, api_client, distributor_factory):
    """
    Verifica que no se puede actualizar un distribuidor con un NIT que ya existe en otro distribuidor.
    """
    # Crear dos distribuidores con diferentes NITs
    existing_distributor = distributor_factory(nit="1234567890")
    distributor_to_update = distributor_factory(nit="9876543210")

    mutation = """
        mutation UpdateDistributor($id: ID!, $nit: String!) {
            updateDistributor(id: $id, nit: $nit) {
                distributor {
                    id
                    nit
                }
            }
        }
    """
    variables = {
        "id": to_global_id("DistributorNode", distributor_to_update.id),
        "nit": "1234567890"  # Intentar usar el mismo NIT que existing_distributor
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" in content
    # El mensaje de error puede variar, verificamos indicadores clave
    error_message = content["errors"][0]["message"]
    assert "UNIQUE" in error_message or "nit" in error_message.lower() or "duplicate" in error_message.lower()


def test_create_distributor_nit_unique_constraint(distributor_factory):
    """
    Verifica que la restricción UNIQUE del campo NIT funciona correctamente en la base de datos.
    Intenta crear dos distribuidores con el mismo NIT usando el factory directamente.
    """
    from django.db import IntegrityError
    
    # Crear un distribuidor con un NIT específico
    existing_nit = "5555555555"
    distributor1 = distributor_factory(nit=existing_nit)
    assert distributor1.nit == existing_nit
    
    # Intentar crear otro distribuidor con el mismo NIT debe lanzar IntegrityError
    with pytest.raises(IntegrityError) as excinfo:
        distributor2 = distributor_factory(nit=existing_nit)
    
    # Verificar que el error está relacionado con el campo NIT
    error_message = str(excinfo.value).lower()
    assert "unique" in error_message or "nit" in error_message


def test_soft_delete_distributor(editor_auth_headers, api_client, distributor_factory):
    """
    Verifica que un usuario con permiso `can_delete_distributors` puede eliminar (soft delete) un distribuidor.
    """
    distributor = distributor_factory()
    mutation = """
        mutation DeleteDistributor($id: ID!) {
            deleteDistributor(id: $id) {
                success
            }
        }
    """
    variables = {
        "id": to_global_id("DistributorNode", distributor.id)
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    assert "errors" not in content
    assert content['data']['deleteDistributor']['success'] is True

    # Verificar que el distribuidor está marcado como eliminado
    distributor.refresh_from_db()
    assert distributor.is_deleted is True


def test_add_document_rtu_only_accepts_pdf(editor_auth_headers, api_client, distributor_factory):
    """
    Verifica que al agregar un documento RTU solo se aceptan archivos PDF.
    Debe rechazar imágenes JPG, PNG u otros formatos.
    """
    import base64
    
    distributor = distributor_factory()
    
    # Crear un archivo de imagen falso (JPG)
    fake_jpg_content = b'\xff\xd8\xff\xe0\x00\x10JFIF'  # Cabecera JPG
    archivo_base64 = base64.b64encode(fake_jpg_content).decode('utf-8')
    
    mutation = """
        mutation AddDocumentToDistributor(
            $distributorId: ID!,
            $archivoBase64: String!,
            $nombreArchivo: String!,
            $tipoDocumento: String!
        ) {
            addDocumentToDistributor(
                distributorId: $distributorId,
                archivoBase64: $archivoBase64,
                nombreArchivo: $nombreArchivo,
                tipoDocumento: $tipoDocumento
            ) {
                document {
                    id
                    tipoDocumento
                }
            }
        }
    """
    variables = {
        "distributorId": to_global_id("DistributorNode", distributor.id),
        "archivoBase64": archivo_base64,
        "nombreArchivo": "rtu_falso.jpg",  # Intentar subir un JPG como RTU
        "tipoDocumento": "rtu"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    # Debe haber un error porque RTU solo acepta PDF
    assert "errors" in content
    error_message = content["errors"][0]["message"]
    assert "PDF" in error_message or "pdf" in error_message.lower()


def test_add_document_rtu_accepts_pdf(editor_auth_headers, api_client, distributor_factory):
    """
    Verifica que al agregar un documento RTU sí se aceptan archivos PDF válidos.
    """
    import base64
    
    distributor = distributor_factory()
    
    # Crear un archivo PDF válido simple
    fake_pdf_content = b'%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\n%%EOF'
    archivo_base64 = base64.b64encode(fake_pdf_content).decode('utf-8')
    
    mutation = """
        mutation AddDocumentToDistributor(
            $distributorId: ID!,
            $archivoBase64: String!,
            $nombreArchivo: String!,
            $tipoDocumento: String!
        ) {
            addDocumentToDistributor(
                distributorId: $distributorId,
                archivoBase64: $archivoBase64,
                nombreArchivo: $nombreArchivo,
                tipoDocumento: $tipoDocumento
            ) {
                document {
                    id
                    tipoDocumento
                }
            }
        }
    """
    variables = {
        "distributorId": to_global_id("DistributorNode", distributor.id),
        "archivoBase64": archivo_base64,
        "nombreArchivo": "rtu_valido.pdf",
        "tipoDocumento": "rtu"
    }
    data = {"query": mutation, "variables": json.dumps(variables)}

    response = api_client.post(
        "/graphql/", json.dumps(data), content_type="application/json", **editor_auth_headers
    )

    content = response.json()
    # No debe haber errores al subir un PDF
    assert "errors" not in content
    assert content['data']['addDocumentToDistributor']['document']['tipoDocumento'] == 'rtu'

