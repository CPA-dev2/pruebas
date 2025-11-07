import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction

from api.models import Distributor, Assignmentdistributor, Trackingdistributor


class AssignDistributorToMe(graphene.Mutation):
    """
    Asigna un distribuidor al usuario autenticado.
    Cambia el estado del distribuidor a 'revision' y crea un registro de tracking.
    """

    class Arguments:
        distributor_id = graphene.ID(
            required=True, 
            description="ID global del distribuidor a asignar."
        )
    
    success = graphene.Boolean()
    

    def mutate(self, info, distributor_id):
        user = info.context.user

        if not user.is_authenticated:
            raise GraphQLError("Usuario no autenticado.")

        try:
            # Obtener el ID real del distribuidor
            dist_id = from_global_id(distributor_id)[1]
            distributor = Distributor.objects.get(pk=dist_id, is_deleted=False)
            
            # Verificar que el distribuidor esté en estado pendiente (disponible para asignación)
            if distributor.estado != 'pendiente':
                raise GraphQLError(f"El distribuidor no está disponible para asignación. Estado actual: {distributor.estado}")
            
        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")

        try:
            with transaction.atomic():
                # Verificar si ya existe una asignación activa
                existing_assignment = Assignmentdistributor.objects.filter(
                    usuario=user,
                    distribuidor=distributor,
                    is_deleted=False
                ).first()
                
                if existing_assignment:
                    raise GraphQLError("Ya tienes este distribuidor asignado.")
                
                # Cambiar el estado del distribuidor a 'revision'
                distributor.estado = 'revision'
                distributor.save()

                # Crear una inserción en trackingdistributor
                tracking_entry = Trackingdistributor(
                    distribuidor=distributor,
                    estado='revision',
                    observacion=f"Distribuidor asignado a {user.username} para revisión."
                )
                tracking_entry.save()
                
                # Crear la asignación 
                assignment = Assignmentdistributor(
                    usuario=user, 
                    distribuidor=distributor
                )
                assignment.save()

            return AssignDistributorToMe(success=True)
            
        except IntegrityError as e:
            raise GraphQLError(f"Error al crear la asignación: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class AssignmentMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones relacionadas con asignaciones de distribuidores."""
    assign_distributor_to_me = AssignDistributorToMe.Field()
