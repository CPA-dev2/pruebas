import graphene
from graphene_file_upload.scalars import Upload
from graphql_relay import from_global_id 
from graphql import GraphQLError
from django.core.exceptions import ValidationError

# Importamos el Nuevo Servicio
from api.services.distributor_service import DistributorService

# Importamos Schemas
from api.graphql.schema.distributor_request import (
    DistributorRequestNode, RequestDocumentNode, RequestBranchNode, RequestReferenceNode, RequestRevisionNode
)
from api.graphql.schema.distributor import DistributorNode
from api.models import (
    RequestBranch, RequestReference, RequestTracking, RequestState, 
    DistributorRequest, RequestRevision
)
from api.graphql.permissions import check_permission

# =============================================================================
# MUTACIONES DEL WIZARD (PÚBLICAS)
# =============================================================================

class CreateDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        nit = graphene.String(required=True)
        correo = graphene.String(required=True)
        nombres = graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        telefono = graphene.String()
        tipo_distribuidor = graphene.String()

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    def mutate(self, info, **kwargs):
        try:
            req = DistributorService.create_draft(**kwargs)
            return CreateDistributorRequestMutation(request=req, success=True)
        except ValidationError as e:
            # Devolvemos el mensaje exacto para que el frontend detecte "NIT_DUPLICATED"
            raise GraphQLError(e.message) 
        except Exception as e:
            raise GraphQLError(str(e))


class UpdateDistributorRequestDraftMutation(graphene.Mutation):
    """
    Actualiza los datos de texto plano del formulario.
    Acepta todos los campos que el frontend envía paso a paso.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        
        # Datos Personales / Representante
        nombres = graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        telefono = graphene.String()
        correo = graphene.String()
        genero = graphene.String()
        fecha_nacimiento = graphene.String()
        fecha_vencimiento_dpi = graphene.String()
        nacionalidad = graphene.String()
        pais_nacimiento = graphene.String()
        
        # Datos Propietario (S.A.)
        prop_nombres = graphene.String()
        prop_apellidos = graphene.String()
        prop_dpi = graphene.String()
        prop_direccion = graphene.String()
        prop_telefono = graphene.String()
        prop_correo = graphene.String()
        
        # Dirección
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        
        # Datos Comerciales / Empresa
        tipo_distribuidor = graphene.String()
        negocio_nombre = graphene.String() # Legacy mapping
        nombre_comercial = graphene.String() # Correct mapping
        telefono_negocio = graphene.String()
        tipo_persona = graphene.String()
        empresa_mercantil = graphene.String()
        direccion_propietario = graphene.String()
        direccion_comercial = graphene.String()
        direccion_comercial_patente = graphene.String() 
        objeto = graphene.String()
        numero_registro = graphene.String()
        folio = graphene.String()
        libro = graphene.String()
        numero_expediente = graphene.String()
        categoria = graphene.String()
        
        # Datos Fiscales
        direccion_fiscal = graphene.String()
        fecha_inscripcion = graphene.String()
        regimen_tributario = graphene.String()
        metodo_iva = graphene.String()
        forma_calculo_iva = graphene.String()

        # Datos Operativos
        equipamiento = graphene.String()
        sucursales = graphene.String() # JSON String dump o simple string
        sucursales_count = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        garantia_politicas = graphene.String()

        # Datos Bancarios
        # Nota: 'cuenta_bancaria' es como lo manda el frontend, 
        # 'cuenta_bancaria_nombre' es como se llama en el modelo.
        cuenta_bancaria = graphene.String() 
        cuenta_bancaria_nombre = graphene.String()
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    def mutate(self, info, request_id, **kwargs):
        try:
            _, real_id = from_global_id(request_id)
            req = DistributorService.update_draft(real_id, **kwargs)
            return UpdateDistributorRequestDraftMutation(request=req, success=True)
        except ValidationError as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(str(e))


class UploadRequestDocumentMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        document_type = graphene.String(required=True)
        file = Upload(required=True)

    success = graphene.Boolean()
    ocr_data = graphene.JSONString()
    message = graphene.String()
    document = graphene.Field(RequestDocumentNode)

    def mutate(self, info, request_id, document_type, file):
        try:
            _, real_id = from_global_id(request_id)
            result = DistributorService.process_ocr_document(real_id, document_type, file)
            
            return UploadRequestDocumentMutation(
                success=result['success'],
                ocr_data=result['ocr_data'],
                message=result['message'],
                document=result['document']
            )
        except ValidationError as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(f"Error procesando documento: {str(e)}")


class FinalizeDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        dpi_front = Upload()
        dpi_back = Upload()
        rtu = Upload()
        patente_comercio = Upload()
        prop_dpi_front = Upload()
        prop_dpi_back = Upload()
        rep_dpi_front = Upload()
        rep_dpi_back = Upload()
        patente_sociedad = Upload()
        foto_representante = Upload()
        politicas_garantia = Upload()

    success = graphene.Boolean()
    request = graphene.Field(DistributorRequestNode)

    def mutate(self, info, request_id, **kwargs):
        try:
            _, real_id = from_global_id(request_id)
            req = DistributorService.finalize_request(real_id, kwargs)
            return FinalizeDistributorRequestMutation(success=True, request=req)
        except ValidationError as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(str(e))


# =============================================================================
# MUTACIONES DE SUB-ENTIDADES
# =============================================================================

class CreateRequestBranchMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        direccion = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        # Campos opcionales extra que podrian venir
        numero_secuencia = graphene.String()
        tipo_establecimiento = graphene.String()
        telefono = graphene.String()

    branch = graphene.Field(RequestBranchNode)

    def mutate(self, info, request_id, **kwargs):
        _, real_id = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_id)
        # Mapeo directo de kwargs al modelo
        branch = RequestBranch.objects.create(request=req, **kwargs)
        return CreateRequestBranchMutation(branch=branch)


class CreateRequestReferenceMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

    reference = graphene.Field(RequestReferenceNode)

    def mutate(self, info, request_id, **kwargs):
        _, real_id = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_id)
        ref = RequestReference.objects.create(request=req, **kwargs)
        return CreateRequestReferenceMutation(reference=ref)


class DeleteRequestBranchMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    success = graphene.Boolean()
    def mutate(self, info, id):
        _, real_id = from_global_id(id)
        RequestBranch.objects.get(pk=real_id).delete()
        return DeleteRequestBranchMutation(success=True)


class DeleteRequestReferenceMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    success = graphene.Boolean()
    def mutate(self, info, id):
        _, real_id = from_global_id(id)
        RequestReference.objects.get(pk=real_id).delete()
        return DeleteRequestReferenceMutation(success=True)


# =============================================================================
# MUTACIONES ADMINISTRATIVAS
# =============================================================================

class AssignDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        user_id = graphene.ID(required=True)
    
    request = graphene.Field(DistributorRequestNode)

    def mutate(self, info, request_id, user_id):
        check_permission(info.context.user, 'can_authorize_requests')
        _, real_req = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_req)
        # Lógica de asignación (necesitas importar User o usar get_user_model)
        # req.assigned_to_id = user_id 
        # req.save()
        return AssignDistributorRequestMutation(request=req)


class ApproveDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
    
    distributor = graphene.Field(DistributorNode)

    def mutate(self, info, request_id):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
            _, real_id = from_global_id(request_id)
            dist = DistributorService.approve_request(real_id, info.context.user)
            return ApproveDistributorRequestMutation(distributor=dist)
        except ValidationError as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(str(e))


class RejectDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True)

    request = graphene.Field(DistributorRequestNode)

    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_authorize_requests')
        _, real_id = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_id)
        req.estado = RequestState.RECHAZADO
        req.save()
        RequestTracking.objects.create(request=req, usuario=info.context.user, 
                                       estado_nuevo=RequestState.RECHAZADO, comentario=comentario)
        return RejectDistributorRequestMutation(request=req)


class AddRequestRevisionMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        campo_revisado = graphene.String(required=True)
        es_aprobado = graphene.Boolean(required=True)
        observacion = graphene.String()
    
    revision = graphene.Field(RequestRevisionNode)
    def mutate(self, info, request_id, **kwargs):
        _, real_id = from_global_id(request_id)
        rev = RequestRevision.objects.create(request_id=real_id, usuario=info.context.user, **kwargs)
        return AddRequestRevisionMutation(revision=rev)


class RequestCorrectionsMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True)
    request = graphene.Field(DistributorRequestNode)
    def mutate(self, info, request_id, comentario):
        _, real_id = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_id)
        req.estado = RequestState.CORRECCIONES_SOLICITADAS
        req.save()
        return RequestCorrectionsMutation(request=req)


class ResubmitRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
    request = graphene.Field(DistributorRequestNode)
    def mutate(self, info, request_id):
        _, real_id = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_id)
        req.estado = RequestState.EN_REENVIO
        req.save()
        return ResubmitRequestMutation(request=req)


class SubmitForAuthorizationMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String()
    request = graphene.Field(DistributorRequestNode)
    def mutate(self, info, request_id, comentario=""):
        _, real_id = from_global_id(request_id)
        req = DistributorRequest.objects.get(pk=real_id)
        req.estado = RequestState.ENVIADO_AUTORIZACION
        req.save()
        return SubmitForAuthorizationMutation(request=req)


# --- EXPORTAR ---
class DistributorRequestMutations(graphene.ObjectType):
    create_distributor_request = CreateDistributorRequestMutation.Field()
    update_distributor_request_draft = UpdateDistributorRequestDraftMutation.Field()
    upload_request_document = UploadRequestDocumentMutation.Field()
    finalize_distributor_request = FinalizeDistributorRequestMutation.Field()
    create_request_branch = CreateRequestBranchMutation.Field()
    create_request_reference = CreateRequestReferenceMutation.Field()
    delete_request_branch = DeleteRequestBranchMutation.Field()
    delete_request_reference = DeleteRequestReferenceMutation.Field()
    
    assign_distributor_request = AssignDistributorRequestMutation.Field()
    add_request_revision = AddRequestRevisionMutation.Field()
    request_corrections = RequestCorrectionsMutation.Field()
    submit_for_authorization = SubmitForAuthorizationMutation.Field()
    resubmit_request = ResubmitRequestMutation.Field()
    approve_distributor_request = ApproveDistributorRequestMutation.Field()
    reject_distributor_request = RejectDistributorRequestMutation.Field()