import graphene
from graphene import relay
from django.db import transaction
from graphql import GraphQLError
from api.models import (
    RequestRevision,
    RequestDocument,
    RequestBranch,
    RequestReference,
    DistributorRequest
)
# Importamos los schemas para los tipos de retorno
from api.graphql.schema.distributor_request import (
    RequestRevisionNode,
    RequestDocumentNode,
    RequestBranchNode,
    RequestReferenceNode
)
from api.graphql.permissions import check_permission

# --- Mutaciones de Revisión Granular (Interna, RBAC) ---

class ReviewRequestFieldMutation(graphene.Mutation):
    """
    (Colaborador) Crea una revisión para un CAMPO o SECCIÓN.
    Ej: Revisa 'nit' (aprobado) o 'Datos Personales' (aprobado).
    Utiliza el modelo RequestRevision.
    """
    class Arguments:
        request_id = graphene.ID(required=True, description="ID Global de la DistributorRequest.")
        campo_revisado = graphene.String(required=True, description="El campo o sección, ej: 'nit', 'datos_personales'.")
        es_aprobado = graphene.Boolean(required=True)
        observacion = graphene.String(description="Obligatorio si es_aprobado=False.")

    revision = graphene.Field(RequestRevisionNode)

    @transaction.atomic
    def mutate(self, info, request_id, campo_revisado, es_aprobado, observacion=None):
        # Solo usuarios con permiso de revisión pueden ejecutar esto
        check_permission(info.context.user, 'can_review_requests')
        
        _, real_req_id = relay.Node.from_global_id(request_id)
        
        if not es_aprobado and not observacion:
            raise GraphQLError("La 'observacion' es obligatoria si el campo es rechazado (es_aprobado=False).")

        # Opcional: Validar que la solicitud exista
        if not DistributorRequest.objects.filter(pk=real_req_id).exists():
             raise GraphQLError("La solicitud no existe.")

        revision = RequestRevision.objects.create(
            request_id=real_req_id,
            usuario=info.context.user,
            campo_revisado=campo_revisado,
            es_aprobado=es_aprobado,
            observacion=observacion or ""
        )
        return ReviewRequestFieldMutation(revision=revision)

class ReviewRequestDocumentMutation(graphene.Mutation):
    """
    (Colaborador) Aprueba o rechaza un DOCUMENTO específico.
    Actualiza el 'revision_status' en el modelo RequestDocument.
    """
    class Arguments:
        document_id = graphene.ID(required=True, description="ID Global del RequestDocument.")
        status = graphene.String(required=True, description="'approved' o 'rejected'.")
        observacion = graphene.String(description="Obligatorio si status='rejected'.")

    document = graphene.Field(RequestDocumentNode)

    @transaction.atomic
    def mutate(self, info, document_id, status, observacion=None):
        check_permission(info.context.user, 'can_review_requests')
        
        if status not in ['approved', 'rejected']:
            raise GraphQLError("El estado debe ser 'approved' o 'rejected'.")
        
        if status == 'rejected' and not observacion:
            raise GraphQLError("La 'observacion' es obligatoria si el documento es rechazado.")
            
        try:
            _, real_id = relay.Node.from_global_id(document_id)
            doc = RequestDocument.objects.get(pk=real_id)
        except RequestDocument.DoesNotExist:
            raise GraphQLError("El documento no existe.")
        
        doc.revision_status = status
        doc.revision_notes = observacion or ""
        doc.save()
        
        return ReviewRequestDocumentMutation(document=doc)

class ReviewRequestBranchMutation(graphene.Mutation):
    """
    (Colaborador) Aprueba o rechaza una SUCURSAL específica.
    Actualiza el 'revision_status' en el modelo RequestBranch.
    """
    class Arguments:
        branch_id = graphene.ID(required=True, description="ID Global de la RequestBranch.")
        status = graphene.String(required=True, description="'approved' o 'rejected'.")
        observacion = graphene.String(description="Obligatorio si status='rejected'.")

    branch = graphene.Field(RequestBranchNode)

    @transaction.atomic
    def mutate(self, info, branch_id, status, observacion=None):
        check_permission(info.context.user, 'can_review_requests')
        
        if status not in ['approved', 'rejected']:
            raise GraphQLError("El estado debe ser 'approved' o 'rejected'.")
            
        if status == 'rejected' and not observacion:
            raise GraphQLError("La 'observacion' es obligatoria si la sucursal es rechazada.")
            
        try:
            _, real_id = relay.Node.from_global_id(branch_id)
            branch = RequestBranch.objects.get(pk=real_id)
        except RequestBranch.DoesNotExist:
            raise GraphQLError("La sucursal no existe.")
            
        branch.revision_status = status
        branch.revision_notes = observacion or ""
        branch.save()
        
        return ReviewRequestBranchMutation(branch=branch)

class ReviewRequestReferenceMutation(graphene.Mutation):
    """
    (Colaborador) Verifica o rechaza una REFERENCIA específica.
    Actualiza el 'revision_status' en el modelo RequestReference.
    """
    class Arguments:
        reference_id = graphene.ID(required=True, description="ID Global de la RequestReference.")
        status = graphene.String(required=True, description="'verified' o 'rejected'.")
        observacion = graphene.String(description="Obligatorio si status='rejected'.")

    reference = graphene.Field(RequestReferenceNode)

    @transaction.atomic
    def mutate(self, info, reference_id, status, observacion=None):
        check_permission(info.context.user, 'can_review_requests')
        
        if status not in ['verified', 'rejected']:
            raise GraphQLError("El estado debe ser 'verified' o 'rejected'.")
            
        if status == 'rejected' and not observacion:
            raise GraphQLError("La 'observacion' es obligatoria si la referencia es rechazada.")
            
        try:
            _, real_id = relay.Node.from_global_id(reference_id)
            ref = RequestReference.objects.get(pk=real_id)
        except RequestReference.DoesNotExist:
            raise GraphQLError("La referencia no existe.")
            
        ref.revision_status = status
        ref.revision_notes = observacion or ""
        ref.save()
        
        return ReviewRequestReferenceMutation(reference=ref)


# --- Agrupador de Mutaciones ---

class DistributorReviewMutations(graphene.ObjectType):
    """
    Agrupa todas las mutaciones relacionadas con el proceso
    de revisión granular interna de una solicitud.
    """
    review_request_field = ReviewRequestFieldMutation.Field()
    review_request_document = ReviewRequestDocumentMutation.Field()
    review_request_branch = ReviewRequestBranchMutation.Field()
    review_request_reference = ReviewRequestReferenceMutation.Field()