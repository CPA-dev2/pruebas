import graphene
from graphene import relay
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
# Importamos los schemas para los tipos de retorno
from api.graphql.schema.distributor_request import (
    DistributorRequestNode, 
    RequestDocumentNode, 
    RequestRevisionNode,
    RequestBranchNode,  
    RequestReferenceNode 
)
from api.graphql.schema.distributor import DistributorNode
# Importamos los helpers de permisos
from api.graphql.permissions import check_permission, check_is_authenticated, check_is_superuser


# --- 1. Mutación de Creación (Pública) ---
class CreateDistributorRequestMutation(graphene.Mutation):
    """
    Mutación pública para crear el primer paso de la solicitud.
    Cubre el Requisito A del Frontend.
    """
    class Arguments:
        nombres = graphene.String(required=True)
        apellidos = graphene.String(required=True)
        dpi = graphene.String(required=True)
        correo = graphene.String(required=True)
        telefono = graphene.String(required=True)
        negocio_nombre = graphene.String()
        nit = graphene.String(required=True)
        telefono_negocio = graphene.String()
        tipo_persona = graphene.String(required=True)
        departamento = graphene.String(required=True)
        municipio = graphene.String(required=True)
        direccion = graphene.String(required=True)
        equipamiento = graphene.String()
        sucursales = graphene.String()
        antiguedad = graphene.String(required=True)
        productos_distribuidos = graphene.String(required=True)
        cuenta_bancaria = graphene.String(required=True)
        numero_cuenta = graphene.String(required=True)
        tipo_cuenta = graphene.String(required=True)
        banco = graphene.String(required=True)

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    @transaction.atomic
    def mutate(self, info, **kwargs):
        nit_limpio = kwargs.get('nit').replace('-', '')
        if DistributorRequest.objects.filter(nit=nit_limpio, is_deleted=False).exclude(estado=RequestState.RECHAZADO).exists():
            raise GraphQLError("Ya existe una solicitud activa o aprobada con este NIT.")

        req = DistributorRequest.objects.create(nit=nit_limpio, **kwargs)
        
        RequestTracking.objects.create(
            request=req,
            estado_anterior=None,
            estado_nuevo=RequestState.PENDIENTE,
            comentario="Solicitud creada por el Distribuidor."
        )
        return CreateDistributorRequestMutation(request=req, success=True)


# --- 2. Mutación de Subida de Archivos (Pública/Autenticada por Solicitud) ---
class UploadRequestDocumentMutation(graphene.Mutation):
    """
    Sube un documento (DPI, RTU, Patente) y lo asocia a una solicitud existente.
    Cubre el Requisito C (Subida de archivos).
    """
    class Arguments:
        request_id = graphene.ID(required=True, description="ID Global de la DistributorRequest.")
        document_type = graphene.String(required=True, description="Debe ser un valor de DOCTYPE_CHOICES (ej. 'DPI_FRONT').")
        file = Upload(required=True, description="El archivo a subir (multipart).")

    success = graphene.Boolean()
    document = graphene.Field(RequestDocumentNode)

    def mutate(self, info, request_id, document_type, file, **kwargs):
        try:
            _, real_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_id)
        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe.")
            
        if file.size > 5242880: # 5MB Límite
             raise GraphQLError("El archivo es demasiado grande. Límite de 5MB.")

        doc = RequestDocument.objects.create(
            request=req,
            document_type=document_type,
            file=file
        )
        return UploadRequestDocumentMutation(success=True, document=doc)


# --- (NUEVO) 3. Mutación para añadir Sucursales a la Solicitud ---
class CreateRequestBranchMutation(graphene.Mutation):
    """
    (Distribuidor) Añade una sucursal al formulario de solicitud.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        nombre = graphene.String(required=True)
        departamento = graphene.String(required=True)
        municipio = graphene.String(required=True)
        direccion = graphene.String(required=True)
        telefono = graphene.String()

    branch = graphene.Field(RequestBranchNode)

    def mutate(self, info, request_id, **kwargs):
        _, real_req_id = relay.Node.from_global_id(request_id)
        branch = RequestBranch.objects.create(
            request_id=real_req_id,
            **kwargs
        )
        return CreateRequestBranchMutation(branch=branch)

# --- (NUEVO) 4. Mutación para añadir Referencias a la Solicitud ---
class CreateRequestReferenceMutation(graphene.Mutation):
    """
    (Distribuidor) Añade una referencia al formulario de solicitud.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

    reference = graphene.Field(RequestReferenceNode)

    def mutate(self, info, request_id, **kwargs):
        _, real_req_id = relay.Node.from_global_id(request_id)
        reference = RequestReference.objects.create(
            request_id=real_req_id,
            **kwargs
        )
        return CreateRequestReferenceMutation(reference=reference)

# --- (NUEVO) 5. Mutaciones para Eliminar (mientras se llena el form) ---
class DeleteRequestBranchMutation(graphene.Mutation):
    """
    (Distribuidor) Elimina una sucursal que añadió por error.
    """
    class Arguments:
        id = graphene.ID(required=True) # ID Global de la RequestBranch
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        _, real_id = relay.Node.from_global_id(id)
        try:
            branch = RequestBranch.objects.get(pk=real_id)
            # TODO: Añadir chequeo de que el usuario es el dueño de la solicitud
            branch.delete() # Soft delete
            return DeleteRequestBranchMutation(success=True)
        except RequestBranch.DoesNotExist:
            raise GraphQLError("La sucursal no existe.")

class DeleteRequestReferenceMutation(graphene.Mutation):
    """
    (Distribuidor) Elimina una referencia que añadió por error.
    """
    class Arguments:
        id = graphene.ID(required=True) # ID Global de la RequestReference
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        _, real_id = relay.Node.from_global_id(id)
        try:
            ref = RequestReference.objects.get(pk=real_id)
            # TODO: Añadir chequeo de que el usuario es el dueño de la solicitud
            ref.delete() # Soft delete
            return DeleteRequestReferenceMutation(success=True)
        except RequestReference.DoesNotExist:
            raise GraphQLError("La referencia no existe.")


# --- 6. Mutación de Asignación (Interna, RBAC) ---
class AssignDistributorRequestMutation(graphene.Mutation):
    """
    Asigna una solicitud PENDIENTE a un colaborador
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        user_id = graphene.ID(required=True, description="ID Global del Colaborador (Usuario).")

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, user_id):
        check_permission(info.context.user, 'can_authorize_requests') # Asumimos que un admin asigna
        
        try:
            _, real_req_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.PENDIENTE)
            
            _, real_user_id = relay.Node.from_global_id(user_id)
            colaborador = Usuario.objects.get(pk=real_user_id)
            
            if not colaborador.rol or not colaborador.rol.can_be_assigned:
                 raise GraphQLError("Este usuario no tiene permisos de Colaborador.")

        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe o ya fue asignada.")
        except Usuario.DoesNotExist:
            raise GraphQLError("El usuario colaborador no existe.")

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


# --- 7. Mutación de Revisión (Interna, RBAC) ---
class AddRequestRevisionMutation(graphene.Mutation):
    """
    (Colaborador) Añade una revisión (observación) a un campo.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        campo_revisado = graphene.String(required=True, description="Ej: 'nit', 'document_dpi'")
        es_aprobado = graphene.Boolean(required=True)
        observacion = graphene.String(required=False, description="Obligatorio si es_aprobado=False")

    revision = graphene.Field(RequestRevisionNode)

    def mutate(self, info, request_id, **kwargs):
        check_permission(info.context.user, 'can_review_requests')
        
        _, real_req_id = relay.Node.from_global_id(request_id)
        if not DistributorRequest.objects.filter(pk=real_req_id).exists():
            raise GraphQLError("La solicitud no existe.")
            
        if not kwargs.get('es_aprobado') and not kwargs.get('observacion'):
            raise GraphQLError("La observación es obligatoria si el campo no está aprobado.")

        revision = RequestRevision.objects.create(
            request_id=real_req_id,
            usuario=info.context.user,
            **kwargs
        )
        return AddRequestRevisionMutation(revision=revision)


# --- 8. Mutación de Pedir Correcciones (Interna, RBAC) ---
class RequestCorrectionsMutation(graphene.Mutation):
    """
    (Colaborador) Devuelve la solicitud al Distribuidor para correcciones.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True, description="Resumen de las correcciones necesarias.")

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_request_corrections')
        
        try:
            _, real_req_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe.")
            
        if req.estado not in [RequestState.ASIGNADA, RequestState.EN_REVISION, RequestState.EN_VALIDACION_FINAL, RequestState.EN_REENVIO]:
             raise GraphQLError("Solo se pueden pedir correcciones de una solicitud en revisión.")

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


# --- 9. Mutación de Re-envío (Distribuidor) ---
class ResubmitRequestMutation(graphene.Mutation):
    """
    (Distribuidor) Vuelve a enviar la solicitud después de corregir.
    """
    class Arguments:
        request_id = graphene.ID(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id):
        try:
            _, real_req_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.CORRECCIONES_SOLICITADAS)
        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe o no está esperando correcciones.")
            
        req.estado = RequestState.EN_REENVIO
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=None, 
            estado_anterior=RequestState.CORRECCIONES_SOLICITADAS,
            estado_nuevo=RequestState.EN_REENVIO,
            comentario="El Distribuidor ha reenviado la solicitud con correcciones."
        )
        
        return ResubmitRequestMutation(request=req)


# --- 10. Mutación de Envío a Autorización (Interna, RBAC) ---
class SubmitForAuthorizationMutation(graphene.Mutation):
    """
    (Colaborador) Marca la revisión como completa y la envía al Administrador.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(description="Comentario final del colaborador.")

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario=""):
        check_permission(info.context.user, 'can_review_requests')
        
        try:
            _, real_req_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe.")
            
        if req.estado not in [RequestState.ASIGNADA, RequestState.EN_REVISION, RequestState.EN_VALIDACION_FINAL, RequestState.EN_REENVIO]:
             raise GraphQLError("Esta solicitud no está en un estado válido para ser enviada a autorización.")

        if req.revisions.filter(es_aprobado=False).exists():
            raise GraphQLError("No se puede enviar a autorización. Existen revisiones desaprobadas pendientes.")

        estado_anterior = req.estado
        req.estado = RequestState.ENVIADO_AUTORIZACION
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=estado_anterior,
            estado_nuevo=RequestState.ENVIADO_AUTORIZACION,
            comentario=f"Enviado a autorización por {info.context.user.email}. {comentario}"
        )
        return SubmitForAuthorizationMutation(request=req)


# --- 11. Mutación de Aprobación (Interna, RBAC, Crítica) ---
class ApproveDistributorRequestMutation(graphene.Mutation):
    """
    (Administrador) Aprueba la solicitud.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
    
    distributor = graphene.Field(DistributorNode)

    @transaction.atomic
    def mutate(self, info, request_id):
        check_permission(info.context.user, 'can_authorize_requests')
        
        try:
            _, real_req_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.ENVIADO_AUTORIZACION)
        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe o no está lista para autorización.")
            
        # 1. Crear el Distribuidor (Maestro)
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
        approved_docs = req.documents.filter(revision_status='approved')
        for doc in approved_docs:
            DistributorDocument.objects.create(
                distributor=new_distributor,
                document_type=doc.document_type,
                file=doc.file, 
                ocr_status=doc.ocr_status,
                raw_text=doc.raw_text,
                extracted_data=doc.extracted_data,
                revision_status='approved',
            )
            
        # 3. Migrar Sucursales
        approved_branches = req.branches.filter(revision_status='approved')
        for branch in approved_branches:
            DistributorBranch.objects.create(
                distributor=new_distributor,
                nombre=branch.nombre,
                departamento=branch.departamento,
                municipio=branch.municipio,
                direccion=branch.direccion,
                telefono=branch.telefono,
                revision_status='approved',
            )

        # 4. Migrar Referencias
        approved_refs = req.references.filter(revision_status='verified')
        for ref in approved_refs:
            DistributorReference.objects.create(
                distributor=new_distributor,
                nombres=ref.nombres,
                telefono=ref.telefono,
                relacion=ref.relacion,
                revision_status='verified',
            )

        # 5. Cerrar la solicitud y registrar auditoría
        req.estado = RequestState.APROBADO
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=RequestState.ENVIADO_AUTORIZACION,
            estado_nuevo=RequestState.APROBADO,
            comentario="Solicitud aprobada y migrada a maestro."
        )

        return ApproveDistributorRequestMutation(distributor=new_distributor)


# --- 12. Mutación de Rechazo (Interna, RBAC) ---
class RejectDistributorRequestMutation(graphene.Mutation):
    """
    (Administrador) Rechaza la solicitud de forma definitiva.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True, description="Motivo obligatorio del rechazo.")

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_authorize_requests')
        
        try:
            _, real_req_id = relay.Node.from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id, estado=RequestState.ENVIADO_AUTORIZACION)
        except DistributorRequest.DoesNotExist:
            raise GraphQLError("La solicitud no existe o no está lista para autorización.")

        req.estado = RequestState.RECHAZADO
        req.save()
        
        RequestTracking.objects.create(
            request=req,
            usuario=info.context.user,
            estado_anterior=RequestState.ENVIADO_AUTORIZACION,
            estado_nuevo=RequestState.RECHAZADO,
            comentario=f"Rechazado por {info.context.user.email}: {comentario}"
        )
        
        return RejectDistributorRequestMutation(request=req)


# --- Agrupador de Mutaciones ---

class DistributorRequestMutations(graphene.ObjectType):
    """
    Agrupa todas las mutaciones relacionadas con el flujo de distribuidores.
    """
    # Creación y subida de archivos (Distribuidor)
    create_distributor_request = CreateDistributorRequestMutation.Field()
    upload_request_document = UploadRequestDocumentMutation.Field()
    create_request_branch = CreateRequestBranchMutation.Field()
    create_request_reference = CreateRequestReferenceMutation.Field()
    delete_request_branch = DeleteRequestBranchMutation.Field()
    delete_request_reference = DeleteRequestReferenceMutation.Field()
    
    # Flujo interno (Colaborador)
    assign_distributor_request = AssignDistributorRequestMutation.Field()
    add_request_revision = AddRequestRevisionMutation.Field()
    request_corrections = RequestCorrectionsMutation.Field()
    submit_for_authorization = SubmitForAuthorizationMutation.Field()

    # Flujo externo (Distribuidor)
    resubmit_request = ResubmitRequestMutation.Field()

    # Flujo final (Administrador)
    approve_distributor_request = ApproveDistributorRequestMutation.Field()
    reject_distributor_request = RejectDistributorRequestMutation.Field()