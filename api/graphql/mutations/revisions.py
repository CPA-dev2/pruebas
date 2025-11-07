import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction
from django.db.models import Q

from ..permissions import check_permission
from api.models import Distributor, Revisiondistributor, Reference, Document, Assignmentdistributor, Trackingdistributor
from ..schema.distributor import RevisiondistributorType
from api.services.distributor_service import create_revision_distributor

class RevisionInput(graphene.InputObjectType):
    """Input type para crear/actualizar revisiones."""
    seccion = graphene.String(required=True)
    campo = graphene.String(required=True)
    comentarios = graphene.String()


class CreateRevisions(graphene.Mutation):
    """Mutación para crear múltiples revisiones."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        revisions = graphene.List(RevisionInput, required=True)

    revisions = graphene.List(RevisiondistributorType)

    def mutate(self, info, distributor_id, revisions):
        user = info.context.user

        if not user.is_authenticated:
            raise GraphQLError("Usuario no autenticado.")

        if not revisions or len(revisions) == 0:
            raise GraphQLError("Debe proporcionar al menos una revisión.")

        try:
            with transaction.atomic():
                dist_id = from_global_id(distributor_id)[1]
                distributor = Distributor.objects.get(pk=dist_id, is_deleted=False)
                
                revisiones_creadas = []
                revisiones_creadas = create_revision_distributor(
                    distributor=distributor,
                    revisions=revisions
                )

                return CreateRevisions(revisions=revisiones_creadas)

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")
        except ValueError as e:
            raise GraphQLError(f"Error en los datos: {str(e)}")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class UpdateRevision(graphene.Mutation):
    """Mutación para actualizar una revisión."""
    class Arguments:
        revision_id = graphene.ID(required=True)
        seccion = graphene.String()
        campo = graphene.String()
        aprobado = graphene.Boolean()
        comentarios = graphene.String()
        
    revision = graphene.Field(RevisiondistributorType)
    
    def mutate(self, info, revision_id, **kwargs):
        check_permission(info.context.user, "can_update_distributors")
        try:
            revision = Revisiondistributor.objects.get(pk=revision_id)

            if 'aprobado' in kwargs and kwargs['aprobado'] is True:
                pending_revisions = Revisiondistributor.objects.filter(
                    distribuidor=revision.distribuidor,
                    aprobado=False,
                    is_deleted=False
                ).exclude(pk=revision.pk)

                pending_references = Reference.objects.filter(
                    Q(estado__isnull=True) | Q(estado='rechazado'),
                    distribuidor=revision.distribuidor,
                    is_deleted=False
                )

                pending_documents = Document.objects.filter(
                    Q(estado__isnull=True) | Q(estado='rechazado'),
                    distribuidor=revision.distribuidor,
                    is_deleted=False
                )

                if not pending_revisions.exists() and not pending_references.exists() and not pending_documents.exists():
                    distributor = revision.distribuidor
                    distributor.estado = 'validado'
                    distributor.save()
                    
                    tracking_entry = Trackingdistributor(
                        distribuidor=distributor,
                        estado='validado',
                        observacion="Todas las revisiones aprobadas."
                    )
                    tracking_entry.save()

            for field, value in kwargs.items():
                setattr(revision, field, value)
            revision.save()

            return UpdateRevision(revision=revision)

        except Revisiondistributor.DoesNotExist:
            raise GraphQLError(f"Revisión no encontrada.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class DeleteRevision(graphene.Mutation):
    """Mutación para eliminar una revisión."""
    class Arguments:
        revision_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, revision_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            revision = Revisiondistributor.objects.get(pk=revision_id)
            revision.delete()
            return DeleteRevision(success=True)
        except Revisiondistributor.DoesNotExist:
            raise GraphQLError(f"Revisión no encontrada.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class RevisionMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones de revisiones."""
    create_revisions = CreateRevisions.Field()
    update_revision = UpdateRevision.Field()
    delete_revision = DeleteRevision.Field()