import graphene
from graphene import relay
# --- CORRECCIÓN 1: Importar from_global_id directamente ---
from graphql_relay import from_global_id 
# ----------------------------------------------------------
from graphene_file_upload.scalars import Upload
from django.db import transaction
from graphql import GraphQLError
from api.models import (
    DistributorRequest, 
    RequestState, 
    RequestDocument, 
    RequestBranch,
    RequestReference, 
    RequestTracking, 
    RequestRevision, 
    Distributor, 
    DistributorDocument, 
    DistributorBranch, 
    DistributorReference, 
    Usuario,
    Rol
)
from api.graphql.schema.distributor_request import (
    DistributorRequestNode, 
    RequestDocumentNode, 
    RequestRevisionNode,
    RequestBranchNode,  
    RequestReferenceNode 
)
from api.graphql.schema.distributor import DistributorNode
from api.graphql.permissions import check_permission, check_is_authenticated, check_is_superuser


# --- Helper de Validación de Estado ---
def check_request_editable(request_instance):
    """
    Verifica si la solicitud está en un estado que permite edición por parte del aplicante.
    """
    EDITABLE_STATES = [RequestState.PENDIENTE, RequestState.CORRECCIONES_SOLICITADAS]
    if request_instance.estado not in EDITABLE_STATES:
        raise GraphQLError(
            f"No se puede modificar la solicitud. Estado actual: {request_instance.get_estado_display()}."
        )


# --- 1. Mutación de Creación (Pública / Borrador) ---
class CreateDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        nit = graphene.String(required=True)
        correo = graphene.String(required=True)
        nombres = graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        telefono = graphene.String()
        negocio_nombre = graphene.String()
        telefono_negocio = graphene.String()
        tipo_persona = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        cuenta_bancaria = graphene.String()
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    @transaction.atomic
    def mutate(self, info, **kwargs):
        raw_nit = kwargs.pop('nit', '') 
        nit_limpio = raw_nit.replace('-', '').replace(' ', '')

        if DistributorRequest.objects.filter(nit=nit_limpio, is_deleted=False).exclude(estado=RequestState.RECHAZADO).exists():
            raise GraphQLError("Ya existe una solicitud activa o aprobada con este NIT.")

        defaults = {
            'nombres': '', 'apellidos': '', 'dpi': '', 'telefono': '',
            'departamento': '', 'municipio': '', 'direccion': '',
            'tipo_persona': 'natural', 'antiguedad': '', 'productos_distribuidos': '',
            'cuenta_bancaria': '', 'numero_cuenta': '', 'tipo_cuenta': 'monetaria', 'banco': ''
        }
        create_data = {**defaults, **kwargs}

        req = DistributorRequest.objects.create(nit=nit_limpio, **create_data)
        
        RequestTracking.objects.create(
            request=req,
            estado_anterior=None,
            estado_nuevo=RequestState.PENDIENTE,
            comentario="Solicitud iniciada por el Distribuidor."
        )
        return CreateDistributorRequestMutation(request=req, success=True)


# --- 2. Mutación de Actualización (Pública / Wizard) ---
class UpdateDistributorRequestDraftMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        nombres = graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        correo = graphene.String()
        telefono = graphene.String()
        negocio_nombre = graphene.String()
        telefono_negocio = graphene.String()
        tipo_persona = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        cuenta_bancaria = graphene.String()
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    def mutate(self, info, request_id, **kwargs):
        try:
            # --- CORRECCIÓN 2: Usar from_global_id directo ---
            _, real_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        for key, value in kwargs.items():
            if value is not None:
                setattr(req, key, value)
        
        req.save()
        return UpdateDistributorRequestDraftMutation(request=req, success=True)


# --- 3. Mutación de Subida de Archivos ---
class UploadRequestDocumentMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        document_type = graphene.String(required=True)
        file = Upload(required=True)

    success = graphene.Boolean()
    document = graphene.Field(RequestDocumentNode)

    def mutate(self, info, request_id, document_type, file, **kwargs):
        try:
            # --- CORRECCIÓN 2 ---
            _, real_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")
            
        check_request_editable(req)

        if file.size > 5242880: 
             raise GraphQLError("El archivo es demasiado grande. Límite de 5MB.")

        doc = RequestDocument.objects.create(
            request=req,
            document_type=document_type,
            file=file
        )
        return UploadRequestDocumentMutation(success=True, document=doc)


# --- 4. Crear Sucursal (Pública) ---
class CreateRequestBranchMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        departamento = graphene.String(required=True)
        municipio = graphene.String(required=True)
        direccion = graphene.String(required=True)
        telefono = graphene.String()

    branch = graphene.Field(RequestBranchNode)

    def mutate(self, info, request_id, **kwargs):
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        branch = RequestBranch.objects.create(request=req, **kwargs)
        return CreateRequestBranchMutation(branch=branch)


# --- 5. Crear Referencia (Pública) ---
class CreateRequestReferenceMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

    reference = graphene.Field(RequestReferenceNode)

    def mutate(self, info, request_id, **kwargs):
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
             raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        reference = RequestReference.objects.create(request=req, **kwargs)
        return CreateRequestReferenceMutation(reference=reference)


# --- 6. Eliminar Sucursal/Referencia (Pública) ---
class DeleteRequestBranchMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        # --- CORRECCIÓN 2 ---
        _, real_id = from_global_id(id)
        try:
            branch = RequestBranch.objects.get(pk=real_id)
            check_request_editable(branch.request)
            branch.delete()
            return DeleteRequestBranchMutation(success=True)
        except RequestBranch.DoesNotExist:
            raise GraphQLError("La sucursal no existe.")

class DeleteRequestReferenceMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        # --- CORRECCIÓN 2 ---
        _, real_id = from_global_id(id)
        try:
            ref = RequestReference.objects.get(pk=real_id)
            check_request_editable(ref.request)
            ref.delete()
            return DeleteRequestReferenceMutation(success=True)
        except RequestReference.DoesNotExist:
            raise GraphQLError("La referencia no existe.")


# --- 7. Asignación (Interna) ---
class AssignDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        user_id = graphene.ID(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, user_id):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.PENDIENTE)
            _, real_user_id = from_global_id(user_id)
            colaborador = Usuario.objects.get(pk=real_user_id)
            
            if not colaborador.rol or not colaborador.rol.can_be_assigned:
                 raise GraphQLError("Este usuario no tiene permisos de Colaborador.")
        except (DistributorRequest.DoesNotExist, Usuario.DoesNotExist, ValueError):
            raise GraphQLError("Solicitud o Usuario no encontrados.")

        req.assigned_to = colaborador
        req.estado = RequestState.ASIGNADA
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=RequestState.PENDIENTE,
            estado_nuevo=RequestState.ASIGNADA,
            comentario=f"Asignada a {colaborador.email} por {info.context.user.email}."
        )
        return AssignDistributorRequestMutation(request=req)


# --- 8. Revisión (Interna) ---
class AddRequestRevisionMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        campo_revisado = graphene.String(required=True)
        es_aprobado = graphene.Boolean(required=True)
        observacion = graphene.String()

    revision = graphene.Field(RequestRevisionNode)

    def mutate(self, info, request_id, **kwargs):
        check_permission(info.context.user, 'can_review_requests')
        # --- CORRECCIÓN 2 ---
        _, real_req_id = from_global_id(request_id)
        
        if not kwargs.get('es_aprobado') and not kwargs.get('observacion'):
            raise GraphQLError("La observación es obligatoria si el campo no está aprobado.")

        if not DistributorRequest.objects.filter(pk=real_req_id).exists():
             raise GraphQLError("La solicitud no existe.")

        revision = RequestRevision.objects.create(
            request_id=real_req_id,
            usuario=info.context.user,
            **kwargs
        )
        return AddRequestRevisionMutation(revision=revision)


# --- 9. Pedir Correcciones (Interna) ---
class RequestCorrectionsMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_request_corrections')
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")
            
        estado_anterior = req.estado
        req.estado = RequestState.CORRECCIONES_SOLICITADAS
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=estado_anterior,
            estado_nuevo=RequestState.CORRECCIONES_SOLICITADAS,
            comentario=comentario
        )
        return RequestCorrectionsMutation(request=req)


# --- 10. Re-envío (Distribuidor) ---
class ResubmitRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id):
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.CORRECCIONES_SOLICITADAS)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe o no está esperando correcciones.")
            
        req.estado = RequestState.EN_REENVIO
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=None, 
            estado_anterior=RequestState.CORRECCIONES_SOLICITADAS,
            estado_nuevo=RequestState.EN_REENVIO,
            comentario="Reenviado por el Distribuidor."
        )
        return ResubmitRequestMutation(request=req)


# --- 11. Enviar a Autorización (Interna) ---
class SubmitForAuthorizationMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String()

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario=""):
        check_permission(info.context.user, 'can_review_requests')
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")
            
        if req.revisions.filter(es_aprobado=False).exists():
            raise GraphQLError("Existen revisiones pendientes.")

        estado_anterior = req.estado
        req.estado = RequestState.ENVIADO_AUTORIZACION
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=estado_anterior,
            estado_nuevo=RequestState.ENVIADO_AUTORIZACION,
            comentario=comentario
        )
        return SubmitForAuthorizationMutation(request=req)


# --- 12. Aprobación (Interna, Crítica) ---
class ApproveDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
    
    distributor = graphene.Field(DistributorNode)

    @transaction.atomic
    def mutate(self, info, request_id):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.ENVIADO_AUTORIZACION)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("Solicitud no lista para aprobar.")
            
        # 1. Crear Maestro
        new_distributor = Distributor.objects.create(
            request_origin=req,
            nit=req.nit,
            razon_social_o_nombre=f"{req.nombres} {req.apellidos}",
            nombre_comercial=req.negocio_nombre,
            tipo_persona=req.tipo_persona,
            dpi_representante=req.dpi,
            nombre_representante_completo=f"{req.nombres} {req.apellidos}",
            email_contacto=req.correo,
            telefono_contacto=req.telefono,
            telefono_negocio=req.telefono_negocio,
            departamento=req.departamento,
            municipio=req.municipio,
            direccion=req.direccion,
            equipamiento_desc=req.equipamiento,
            sucursales_desc=req.sucursales,
            antiguedad=req.antiguedad,
            productos_distribuidos=req.productos_distribuidos,
            cuenta_bancaria_nombre=req.cuenta_bancaria,
            numero_cuenta=req.numero_cuenta,
            tipo_cuenta=req.tipo_cuenta,
            banco=req.banco,
        )

        # 2. Migrar Documentos 
        for doc in req.documents.filter(revision_status='approved'):
            DistributorDocument.objects.create(
                distributor=new_distributor,
                document_type=doc.document_type,
                file=doc.file, 
                ocr_status=doc.ocr_status,
                raw_text=doc.raw_text,
                extracted_data=doc.extracted_data,
                revision_status='approved',
            )
            
        for branch in req.branches.filter(revision_status='approved'):
            DistributorBranch.objects.create(
                distributor=new_distributor,
                nombre=branch.nombre,
                departamento=branch.departamento,
                municipio=branch.municipio,
                direccion=branch.direccion,
                telefono=branch.telefono,
                revision_status='approved',
            )

        for ref in req.references.filter(revision_status='verified'):
            DistributorReference.objects.create(
                distributor=new_distributor,
                nombres=ref.nombres,
                telefono=ref.telefono,
                relacion=ref.relacion,
                revision_status='verified',
            )

        # 3. Cerrar
        req.estado = RequestState.APROBADO
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=RequestState.ENVIADO_AUTORIZACION,
            estado_nuevo=RequestState.APROBADO,
            comentario="Aprobado."
        )

        return ApproveDistributorRequestMutation(distributor=new_distributor)


# --- 13. Rechazo (Interna) ---
class RejectDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
            # --- CORRECCIÓN 2 ---
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("Solicitud no existe.")

        req.estado = RequestState.RECHAZADO
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=req.estado,
            estado_nuevo=RequestState.RECHAZADO,
            comentario=comentario
        )
        return RejectDistributorRequestMutation(request=req)


# --- Agrupador ---
class DistributorRequestMutations(graphene.ObjectType):
    create_distributor_request = CreateDistributorRequestMutation.Field()
    update_distributor_request_draft = UpdateDistributorRequestDraftMutation.Field()
    upload_request_document = UploadRequestDocumentMutation.Field()
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