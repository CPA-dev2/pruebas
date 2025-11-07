import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction
from django.db.models import Q
from graphene_file_upload.scalars import Upload
from django.core.files.base import ContentFile

from ..permissions import check_permission

from api.models import Distributor
from ..schema.distributor import DistributorType
from api.services.distributor_service import create_distributor, update_distributor


# INPUT TYPES PARA DOCUMENTOS
class DocumentInput(graphene.InputObjectType):
    """Input type para crear documentos."""
    tipoDocumento = graphene.String(required=True, description="Tipo de documento")
    archivoData = Upload(required=True)
    nombreArchivo = graphene.String(required=True, description="Nombre del archivo")

# INPUT TYPES PARA REFERENCIAS
class ReferenceInput(graphene.InputObjectType):
    """Input type para crear/actualizar referencias."""
    nombres = graphene.String(required=True, description="Nombre de la referencia")
    telefono = graphene.String(required=True, description="Teléfono de la referencia")
    relacion = graphene.String(required=True, description="Relación con el distribuidor")

class ReferenceUpdateInput(graphene.InputObjectType):
    """Input type para actualizar referencias existentes."""
    id = graphene.ID(description="ID de la referencia (para actualizar)")
    nombres = graphene.String(description="Nombre de la referencia")
    telefono = graphene.String(description="Teléfono de la referencia")
    relacion = graphene.String(description="Relación con el distribuidor")

class LocationInput(graphene.InputObjectType):
    """Input type para crear/actualizar ubicaciones."""
    nombre = graphene.String(required=True, description="Nombre de la ubicación")

# INPUT TYPES PARA REVISIONES
class RevisionInput(graphene.InputObjectType):
    """Input type para crear/actualizar revisiones."""
    seccion = graphene.String(required=True, description="Sección del distribuidor que está siendo revisada.")
    campo = graphene.String(required=True, description="Campo específico dentro de la sección que está siendo revisado.")
    comentarios = graphene.String(description="Comentarios de la revisión")
    
    
class CreateDistributor(graphene.Mutation):
    """Mutación para crear un nuevo distribuidor con referencias y documentos."""
    class Arguments:
        nombres= graphene.String(required=True)
        apellidos = graphene.String(required=True)
        dpi = graphene.String(required=True)
        correo = graphene.String(required=True)
        telefono = graphene.String(required=True)
        departamento = graphene.String(required=True)
        municipio = graphene.String(required=True)
        direccion = graphene.String(required=True)      
        telefono_negocio = graphene.String()
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String(required=True)
        productos_distribuidos = graphene.String(required=True)
        tipo_persona = graphene.String(required=True)
        cuenta_bancaria = graphene.String()
        numero_cuenta =graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        estado = graphene.String()
        
        # NUEVO CAMPO PARA REFERENCIAS
        referencias = graphene.List(ReferenceInput, description="Lista de referencias del distribuidor")
        
        # NUEVO CAMPO PARA DOCUMENTOS
        documentos = graphene.List(DocumentInput, description="Lista de documentos del distribuidor")


    distributor = graphene.Field(DistributorType)

    def mutate(self, info, **kwargs):
        """
        Crea un nuevo distribuidor con sus referencias y documentos asociados.
        Usa transacciones para asegurar consistencia de datos.
        """
        # Extraer referencias y documentos del kwargs
        referencias_data = kwargs.pop('referencias', [])
        documentos_data = kwargs.pop('documentos', [])
        
        try:
            # Crear el distribuidor usando el servicio
            distributor = create_distributor(
                data=kwargs,
                referencias=referencias_data,
                documentos=documentos_data
            )

            return CreateDistributor(distributor=distributor)                 
       
        except IntegrityError as e:
            raise GraphQLError(f"Error al crear el distribuidor: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class UpdateDistributor(graphene.Mutation):
    """Mutación para actualizar un distribuidor existente, sus referencias y documentos."""
    class Arguments:
        id = graphene.ID(required=True)
        nombres= graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        correo = graphene.String()
        telefono = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        negocio_nombre = graphene.String()
        nit = graphene.String()
        telefono_negocio = graphene.String()
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        tipo_persona = graphene.String()
        cuenta_bancaria = graphene.String()
        numero_cuenta =graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()
        estado = graphene.String()
        
     
    distributor = graphene.Field(DistributorType)

    def mutate(self, info, id, **kwargs):
        """
        Actualiza un distribuidor, sus referencias y documentos.
        - Usa transacciones para asegurar consistencia
        """

        check_permission(info.context.user, "can_update_distributors")

        try:
            with transaction.atomic():

                distributor_id = from_global_id(id)[1]
                distributor = Distributor.objects.get(pk=distributor_id)
                
                #  Actualizar distribuidor desde el servicio
                updated_distributor = update_distributor(
                    distributor=distributor,
                    data=kwargs
                )

                return UpdateDistributor(distributor=updated_distributor)

        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar el distributor: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")  


class DeleteDistributor(graphene.Mutation):
    """Mutación para eliminar un distribuidor existente."""
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        check_permission(info.context.user, "can_delete_distributors")
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            distributor.delete()
            return DeleteDistributor(success=True)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar el distribuidor: {str(e)}")
        
class HardDeleteDistributor(graphene.Mutation):
    """Mutación para eliminar permanentemente un distribuidor existente."""
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            distributor.hard_delete()
            return HardDeleteDistributor(success=True)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except IntegrityError as e:
            raise GraphQLError(f"Error al eliminar permanentemente el distribuidor: {str(e)}")

        
class DistributorMutations(graphene.ObjectType):
    """Define las mutaciones disponibles para el modelo Distributor."""
    create_distributor = CreateDistributor.Field()
    update_distributor = UpdateDistributor.Field()
    delete_distributor = DeleteDistributor.Field()
    hard_delete_distributor = HardDeleteDistributor.Field()
