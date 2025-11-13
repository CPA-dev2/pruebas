import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction

from ..permissions import check_permission
from api.models import Distributor, Reference
from ..schema.distributor import ReferenceType


class AddReferenceToDistributor(graphene.Mutation):
    """Mutación para agregar referencias a un distribuidor."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

    reference = graphene.Field(ReferenceType)

    def mutate(self, info, distributor_id, nombres, telefono, relacion):
        check_permission(info.context.user, "can_update_distributors")
        try:
            dist_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=dist_id)

            if not all([nombres, telefono, relacion]):
                raise ValueError("Todos los campos son requeridos")

            new_reference = Reference(
                distribuidor=distributor,
                nombres=nombres,
                telefono=telefono,
                relacion=relacion
            )
            new_reference.save()

            return AddReferenceToDistributor(reference=new_reference)

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class UpdateReferenceFromDistributor(graphene.Mutation):
    """Mutación para actualizar una referencia."""
    class Arguments:
        reference_id = graphene.ID(required=True)
        nombres = graphene.String()
        telefono = graphene.String()
        relacion = graphene.String()
        estado = graphene.String()
        
    reference = graphene.Field(ReferenceType)

    def mutate(self, info, reference_id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            reference = Reference.objects.get(pk=reference_id)

            for field, value in kwargs.items():
                setattr(reference, field, value)
            reference.save()

            return UpdateReferenceFromDistributor(reference=reference)

        except Reference.DoesNotExist:
            raise GraphQLError(f"Referencia no encontrada.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class DeleteReferenceFromDistributor(graphene.Mutation):
    """Mutación para eliminar una referencia."""
    class Arguments:
        reference_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, reference_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            reference = Reference.objects.get(pk=reference_id)
            reference.delete()
            return DeleteReferenceFromDistributor(success=True)
        except Reference.DoesNotExist:
            raise GraphQLError(f"Referencia no encontrada.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class ReferenceMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones de referencias."""
    add_reference_to_distributor = AddReferenceToDistributor.Field()
    update_reference_from_distributor = UpdateReferenceFromDistributor.Field()
    delete_reference_from_distributor = DeleteReferenceFromDistributor.Field()