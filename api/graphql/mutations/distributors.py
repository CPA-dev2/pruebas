"""
Mutaciones de GraphQL para la gestión de Distribuidores ACTIVOS.

La creación de distribuidores se maneja a través del flujo de
`RegistrationRequestMutations`. Este módulo solo gestiona
Distribuidores que ya han sido aprobados y existen en producción.
"""
import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError, PermissionDenied

from ..permissions import check_permission
from api.models import Distributor
# (Importar servicios de producción, ej: api.services.distributor_service)
from api.services import distributor_service # Asumiendo que existe
from ..schema.distributor import (
    DistributorNode, DistributorDataInput, DocumentType, 
    ReferenceType, LocationType
)

# --- Mutación de Actualización (Admin) ---

class UpdateDistributor(graphene.Mutation):
    """
    Mutación para actualizar los campos de un distribuidor existente y ACTIVO.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global del distribuidor a actualizar.")
        data = DistributorDataInput(required=True, description="Datos del distribuidor a actualizar.")
     
    distributor = graphene.Field(DistributorNode)

    def mutate(self, info, id, data):
        """
        Llama al servicio `distributor_service` para actualizar un
        distribuidor de producción.
        """
        check_permission(info.context.user, "can_update_distributors")
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            
            # Llama a un servicio separado (lógica no implementada en el prompt)
            updated_distributor = distributor_service.update_distributor_active(
                distributor=distributor,
                data=data,
                user=info.context.user
            )
            return UpdateDistributor(distributor=updated_distributor)

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except (ValidationError, PermissionDenied) as e:
            raise GraphQLError(e.message)
        except IntegrityError as e:
            raise GraphQLError(f"Error al actualizar: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")  

class DeleteDistributor(graphene.Mutation):
    """
    Mutación para eliminar (soft delete) un distribuidor existente.
    """
    class Arguments:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, id):
        check_permission(info.context.user, "can_delete_distributors")
        try:
            distributor_id = from_global_id(id)[1]
            distributor = Distributor.objects.get(pk=distributor_id)
            distributor.delete() # Llama al soft-delete de BaseModel
            return DeleteDistributor(success=True)
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except Exception as e:
            raise GraphQLError(f"Error al eliminar el distribuidor: {str(e)}")

# (HardDeleteDistributor se elimina por seguridad, ya que BaseModel lo maneja)
# (AddDocument, AddReference, etc. se refactorizarían para apuntar a un distribuidor
#  aprobado, si es que se permite añadir documentos *después* de la aprobación)

# --- Agrupador de Mutaciones de Distribuidor ---
        
class DistributorMutations(graphene.ObjectType):
    """
    Agrupa las mutaciones para la gestión de distribuidores de producción.
    """
    update_distributor = UpdateDistributor.Field()
    delete_distributor = DeleteDistributor.Field()
    # ...