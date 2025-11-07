import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.db import IntegrityError, transaction
from graphene_file_upload.scalars import Upload

from ..permissions import check_permission
from api.models import Distributor, Document
from ..schema.distributor import DocumentType
from api.services.distributor_service import add_documents_to_distributor, update_document_to_distributor

class AddDocumentToDistributor(graphene.Mutation):
    """Mutación para agregar un documento a un distribuidor existente."""
    class Arguments:
        distributor_id = graphene.ID(required=True)
        archivo_base = Upload(required=True)
        nombre_archivo = graphene.String(required=True)
        tipo_documento = graphene.String(required=True)

    document = graphene.Field(DocumentType)

    def mutate(self, info, distributor_id, archivo_base, nombre_archivo, tipo_documento):
        check_permission(info.context.user, "can_update_distributors")
        try:
            with transaction.atomic():
                dist_id = from_global_id(distributor_id)[1]
                distributor = Distributor.objects.get(pk=dist_id)

                new_document = add_documents_to_distributor(
                    distributor, 
                    document={
                        "archivo_data": archivo_base,
                        "nombre_archivo": nombre_archivo,
                        "tipo_documento": tipo_documento
                    }
                )

                return AddDocumentToDistributor(document=new_document)

        except Distributor.DoesNotExist:
            raise GraphQLError("Distribuidor no encontrado.")


class UpdateDocumentFromDistributor(graphene.Mutation):
    """Mutación para actualizar un documento."""
    class Arguments:
        document_id = graphene.ID(required=True)
        archivo_base64 = graphene.String()
        nombre_archivo = graphene.String()
        estado = graphene.String()
        
    document = graphene.Field(DocumentType)
    
    def mutate(self, info, document_id, archivo_base64=None, nombre_archivo=None, estado=None):
        check_permission(info.context.user, "can_update_distributors")
        try:
            document = Document.objects.get(pk=document_id)

            document = update_document_to_distributor(
                document,
                documentUpdate={
                    "archivo_data": archivo_base64,
                    "nombre_archivo": nombre_archivo,
                    "estado": estado
                }
            )
            return UpdateDocumentFromDistributor(document=document)

        except Document.DoesNotExist:
            raise GraphQLError(f"Documento no encontrado.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class DeleteDocumentFromDistributor(graphene.Mutation):
    """Mutación para eliminar un documento."""
    class Arguments:
        document_id = graphene.ID(required=True)

    success = graphene.Boolean()

    def mutate(self, info, document_id):
        check_permission(info.context.user, "can_update_distributors")
        try:
            document = Document.objects.get(pk=document_id)
            document.delete()
            return DeleteDocumentFromDistributor(success=True)
        except Document.DoesNotExist:
            raise GraphQLError(f"Documento no encontrado.")
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")


class DocumentMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones de documentos."""
    add_document_to_distributor = AddDocumentToDistributor.Field()
    update_document_from_distributor = UpdateDocumentFromDistributor.Field()
    delete_document_from_distributor = DeleteDocumentFromDistributor.Field()