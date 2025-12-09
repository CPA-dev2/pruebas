import graphene
import requests
import json
from graphene import relay
from graphql_relay import from_global_id 
from graphene_file_upload.scalars import Upload
from django.db import transaction
from django.conf import settings
from graphql import GraphQLError

# Importación de Modelos
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

# Importación de Schemas para los campos de retorno
from api.graphql.schema.distributor_request import (
    DistributorRequestNode, 
    RequestDocumentNode, 
    RequestRevisionNode,
    RequestBranchNode,  
    RequestReferenceNode 
)
from api.graphql.schema.distributor import DistributorNode

# Importación de Permisos
from api.graphql.permissions import check_permission, check_is_authenticated, check_is_superuser


# --- Helper de Validación de Estado ---
def check_request_editable(request_instance):
    """
    Verifica si la solicitud está en un estado que permite edición por parte del aplicante.
    Solo se permite editar si está PENDIENTE (llenado inicial) o CORRECCIONES_SOLICITADAS.
    """
    EDITABLE_STATES = [RequestState.PENDIENTE, RequestState.CORRECCIONES_SOLICITADAS]
    if request_instance.estado not in EDITABLE_STATES:
        raise GraphQLError(
            f"No se puede modificar la solicitud. Estado actual: {request_instance.get_estado_display()}."
        )


# =============================================================================
# MUTACIONES PÚBLICAS (FLUJO DEL WIZARD)
# =============================================================================

# --- 1. Mutación de Creación (Paso 1 - Borrador) ---
class CreateDistributorRequestMutation(graphene.Mutation):
    """
    Crea el registro inicial de la solicitud (Borrador).
    Solo requiere NIT y Correo para generar el ID necesario para las siguientes operaciones.
    """
    class Arguments:
        nit = graphene.String(required=True)
        correo = graphene.String(required=True)
        # Campos opcionales para evitar errores si el frontend envía más datos al inicio
        nombres = graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        telefono = graphene.String()
        tipo_contribuyente = graphene.String()

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    @transaction.atomic
    def mutate(self, info, **kwargs):
        # 1. Extraer y limpiar NIT (usando pop para evitar 'multiple values for keyword argument')
        raw_nit = kwargs.pop('nit', '') 
        nit_limpio = raw_nit.replace('-', '').replace(' ', '')

        # 2. Validación de duplicados
        # Excluimos las rechazadas para permitir re-intentos si fueron rechazados anteriormente
        if DistributorRequest.objects.filter(nit=nit_limpio, is_deleted=False).exclude(estado=RequestState.RECHAZADO).exists():
            raise GraphQLError("Ya existe una solicitud activa o aprobada con este NIT.")

        # 3. Valores por defecto para campos obligatorios del modelo que no vienen en el paso 1
        defaults = {
            'nombres': '', 'apellidos': '', 'dpi': '', 'telefono': '',
            'departamento': '', 'municipio': '', 'direccion': '',
            'tipo_persona': 'natural', 'antiguedad': '', 'productos_distribuidos': '',
            'cuenta_bancaria': '', 'numero_cuenta': '', 'tipo_cuenta': 'monetaria', 'banco': ''
        }
        # Mezclar defaults con lo que venga en kwargs
        create_data = {**defaults, **kwargs}

        # 4. Crear la solicitud
        req = DistributorRequest.objects.create(nit=nit_limpio, **create_data)
        
        # 5. Log de auditoría inicial
        RequestTracking.objects.create(
            request=req,
            estado_anterior=None,
            estado_nuevo=RequestState.PENDIENTE,
            comentario="Solicitud iniciada por el Distribuidor (Borrador)."
        )
        return CreateDistributorRequestMutation(request=req, success=True)


# --- 2. Mutación de Actualización (Wizard Pasos 2-6) ---
class UpdateDistributorRequestDraftMutation(graphene.Mutation):
    """
    Permite ir guardando los datos paso a paso (Personal, Negocio, Finanzas).
    Esencial para que el usuario no pierda datos al navegar por el Wizard.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        # Datos Personales / DPI
        nombres = graphene.String()
        apellidos = graphene.String()
        dpi = graphene.String()
        nacionalidad = graphene.String()
        pais_nacimiento = graphene.String()
        fecha_nacimiento = graphene.String()
        fecha_vencimiento_dpi = graphene.String()
        genero = graphene.String()
        
        # Contacto
        correo = graphene.String()
        telefono = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        direccion = graphene.String()
        
        # Datos del Negocio / Patente
        tipo_contribuyente = graphene.String()
        negocio_nombre = graphene.String()
        telefono_negocio = graphene.String()
        tipo_persona = graphene.String()
        empresa_mercantil = graphene.String()
        nombre_propietario = graphene.String()
        direccion_propietario = graphene.String()
        direccion_comercial_patente = graphene.String()
        objeto = graphene.String()
        numero_registro = graphene.String()
        folio = graphene.String()
        libro = graphene.String()
        numero_expediente = graphene.String()
        categoria = graphene.String()
        
        # Datos RTU
        direccion_fiscal = graphene.String()
        fecha_inscripcion = graphene.String()
        regimen_tributario = graphene.String()
        metodo_iva = graphene.String()

        # Datos Operativos
        equipamiento = graphene.String()
        sucursales_count = graphene.String()
        antiguedad = graphene.String()
        productos_distribuidos = graphene.String()
        garantia_politicas = graphene.String()

        # Datos Financieros
        cuenta_bancaria_nombre = graphene.String()
        numero_cuenta = graphene.String()
        tipo_cuenta = graphene.String()
        banco = graphene.String()

    request = graphene.Field(DistributorRequestNode)
    success = graphene.Boolean()

    def mutate(self, info, request_id, **kwargs):
        try:
            # Usamos from_global_id directo de graphql_relay
            _, real_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        # Actualización dinámica de campos
        for key, value in kwargs.items():
            if value is not None:
                setattr(req, key, value)
        
        req.save()
        return UpdateDistributorRequestDraftMutation(request=req, success=True)


# --- 3. Mutación de Escaneo (Conexión a Microservicio OCR) ---
class UploadRequestDocumentMutation(graphene.Mutation):
    """
    Recibe un archivo, lo envía al Microservicio de OCR (API REST) y devuelve los datos extraídos.
    NO guarda el archivo permanentemente en la base de datos local en este punto.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        document_type = graphene.String(required=True)
        file = Upload(required=True)

    success = graphene.Boolean()
    ocr_data = graphene.JSONString() # Retorna el JSON extraído para uso inmediato en el frontend
    message = graphene.String()

    def mutate(self, info, request_id, document_type, file, **kwargs):
        try:
            _, real_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")
            
        check_request_editable(req)

        # Validación de tamaño (10MB)
        if file.size > 10 * 1024 * 1024: 
             raise GraphQLError("El archivo es demasiado grande. Límite de 10MB.")

        # --- FLUJO DE MICROSERVICIO OCR ---
        
        extracted_data = {}
        message = "OCR procesado correctamente"
        
        try:
            # 1. Definir URL del Microservicio (configurable en settings.py)
            # Por defecto busca en localhost puerto 8000 (donde corre FastAPI)
            ocr_service_url = getattr(settings, 'OCR_SERVICE_URL', 'http://localhost:8000/api/v1/extract')
            
            # 2. Preparar el archivo para envío
            # Es importante reiniciar el puntero del archivo si se leyó antes
            file.seek(0)
            
            # Construimos el payload multipart para el microservicio
            files = {
                'file': (file.name, file, file.content_type)
            }
            data = {
                'document_type': document_type
            }
            
            # 3. Realizar la petición POST al microservicio
            # Timeout de 30 segundos para esperar el procesamiento
            response = requests.post(ocr_service_url, files=files, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                # El microservicio retorna estructura: 
                # { "extracted_data": {...}, "legibility_score": ..., "is_valid_document": ... }
                extracted_data = result.get('extracted_data', {})
                
                # Validaciones de calidad del documento
                if not result.get('is_valid_document', True):
                    message = f"Advertencia: {result.get('validation_message', 'Documento no parece válido')}"
                
                # Si el score de legibilidad es muy bajo (ej. < 60)
                if result.get('legibility_score', 100) < 60:
                     message += " (Calidad de imagen baja, verificar datos manualmente)"

            else:
                print(f"Error del Microservicio OCR: {response.status_code} - {response.text}")
                message = "El servicio de OCR no está disponible momentáneamente. Llene los datos manualmente."

        except Exception as e:
            print(f"Excepción conectando al OCR: {e}")
            message = "Error interno conectando al servicio de OCR."
            # No fallamos la mutación para no bloquear al usuario
        
        # 4. Actualizar la solicitud local con la data (Merge)
        # Esto permite persistencia parcial del OCR en el borrador
        current_ocr_data = req.ocr_data_extracted or {}
        
        # Limpieza de valores vacíos antes del merge
        clean_new_data = {k: v for k, v in extracted_data.items() if v}
        
        updated_ocr_data = {**current_ocr_data, **clean_new_data}
        req.ocr_data_extracted = updated_ocr_data
        
        # Actualizar score match si recibimos datos
        if clean_new_data:
             # Sumamos un valor arbitrario o usamos el score del microservicio si queremos guardarlo
             req.ocr_match_score = 100 
        
        req.save()

        return UploadRequestDocumentMutation(success=True, ocr_data=clean_new_data, message=message)


# --- 4. Mutación Final (Guardado Permanente) ---
class FinalizeDistributorRequestMutation(graphene.Mutation):
    """
    Recibe los archivos definitivos al final del wizard.
    Crea los registros RequestDocument permanentes y cambia el estado a PENDIENTE (o ASIGNADA).
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        # Archivos opcionales en el argumento, pero la lógica de negocio exige los requeridos
        dpi_front = Upload()
        dpi_back = Upload()
        rtu = Upload()
        patente_comercio = Upload()
        patente_sociedad = Upload()
        foto_representante = Upload()
        # Otros docs...

    success = graphene.Boolean()
    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, **kwargs):
        try:
            _, real_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        # 1. Guardar Archivos Definitivos en BD
        # Mapeo de argumentos de la mutación a Tipos de Documento del Modelo
        file_map = {
            'dpi_front': 'DPI_FRONT',
            'dpi_back': 'DPI_BACK',
            'rtu': 'RTU',
            'patente_comercio': 'PATENTE_COMERCIO',
            'patente_sociedad': 'PATENTE_SOCIEDAD',
            'foto_representante': 'FOTO_REPRESENTANTE'
        }

        for arg_name, doc_type in file_map.items():
            file_obj = kwargs.get(arg_name)
            if file_obj:
                # Crear registro permanente en Django
                # Esto guarda el archivo físicamente en media/distributor_requests/
                RequestDocument.objects.create(
                    request=req,
                    document_type=doc_type,
                    file=file_obj,
                    ocr_status='COMPLETED', # Asumimos completado porque ya se validó en el paso 1
                    revision_status='pending'
                )

        # 2. Cambiar Estado (Listo para revisión humana)
        # Si tienes lógica de asignación automática, aquí podrías pasar a ASIGNADA
        # Por defecto lo dejamos en PENDIENTE o el estado que definas para "Listo"
        req.estado = RequestState.PENDIENTE 
        req.save()

        RequestTracking.objects.create(
            request=req,
            usuario=None,
            estado_anterior=RequestState.PENDIENTE,
            estado_nuevo=RequestState.PENDIENTE, # O el nuevo estado
            comentario="Solicitud Finalizada y Enviada por el Distribuidor."
        )

        return FinalizeDistributorRequestMutation(success=True, request=req)


# --- 5. Crear Sucursal (Pública) ---
class CreateRequestBranchMutation(graphene.Mutation):
    """
    Crea una sucursal asociada a la solicitud (extraída del RTU o manual).
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        nombre_comercial = graphene.String(required=True)
        # Campos detallados del RTU
        numero_secuencia = graphene.String()
        actividad_economica = graphene.String()
        departamento = graphene.String()
        municipio = graphene.String()
        zona = graphene.String()
        colonia_barrio = graphene.String()
        viabilidad = graphene.String()
        numero_vialidad = graphene.String()
        apartado_postal = graphene.String()
        fecha_inicio_operaciones = graphene.String()
        clasificacion = graphene.String()
        tipo_establecimiento = graphene.String()

    branch = graphene.Field(RequestBranchNode)

    def mutate(self, info, request_id, **kwargs):
        try:
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
            raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        branch = RequestBranch.objects.create(request=req, **kwargs)
        return CreateRequestBranchMutation(branch=branch)


# --- 6. Crear Referencia (Pública) ---
class CreateRequestReferenceMutation(graphene.Mutation):
    """
    Crea una referencia personal o familiar.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
        nombres = graphene.String(required=True)
        telefono = graphene.String(required=True)
        relacion = graphene.String(required=True)

    reference = graphene.Field(RequestReferenceNode)

    def mutate(self, info, request_id, **kwargs):
        try:
            _, real_req_id = from_global_id(request_id)
            req = DistributorRequest.objects.get(pk=real_req_id)
        except (DistributorRequest.DoesNotExist, ValueError):
             raise GraphQLError("La solicitud no existe.")

        check_request_editable(req)

        reference = RequestReference.objects.create(request=req, **kwargs)
        return CreateRequestReferenceMutation(reference=reference)


# --- 7. Eliminar Sucursal (Pública) ---
class DeleteRequestBranchMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        _, real_id = from_global_id(id)
        try:
            branch = RequestBranch.objects.get(pk=real_id)
            check_request_editable(branch.request)
            branch.delete()
            return DeleteRequestBranchMutation(success=True)
        except RequestBranch.DoesNotExist:
            raise GraphQLError("La sucursal no existe.")

# --- 8. Eliminar Referencia (Pública) ---
class DeleteRequestReferenceMutation(graphene.Mutation):
    class Arguments:
        id = graphene.ID(required=True)
    
    success = graphene.Boolean()
    
    def mutate(self, info, id):
        _, real_id = from_global_id(id)
        try:
            ref = RequestReference.objects.get(pk=real_id)
            check_request_editable(ref.request)
            ref.delete()
            return DeleteRequestReferenceMutation(success=True)
        except RequestReference.DoesNotExist:
            raise GraphQLError("La referencia no existe.")


# =============================================================================
# MUTACIONES INTERNAS (ADMINISTRADOR / COLABORADOR)
# =============================================================================

# --- 9. Asignación (Interna) ---
class AssignDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        user_id = graphene.ID(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, user_id):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
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


# --- 10. Revisión (Interna) ---
class AddRequestRevisionMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        campo_revisado = graphene.String(required=True)
        es_aprobado = graphene.Boolean(required=True)
        observacion = graphene.String()

    revision = graphene.Field(RequestRevisionNode)

    def mutate(self, info, request_id, **kwargs):
        check_permission(info.context.user, 'can_review_requests')
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


# --- 11. Pedir Correcciones (Interna) ---
class RequestCorrectionsMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_request_corrections')
        try:
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


# --- 12. Re-envío (Distribuidor) ---
class ResubmitRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id):
        try:
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


# --- 13. Enviar a Autorización (Interna) ---
class SubmitForAuthorizationMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String()

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario=""):
        check_permission(info.context.user, 'can_review_requests')
        try:
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


# --- 14. Aprobación (Interna, Crítica) ---
class ApproveDistributorRequestMutation(graphene.Mutation):
    """
    Crea el Distribuidor Maestro y migra todos los datos.
    """
    class Arguments:
        request_id = graphene.ID(required=True)
    
    distributor = graphene.Field(DistributorNode)

    @transaction.atomic
    def mutate(self, info, request_id):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
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
            
        # 3. Migrar Sucursales
        for branch in req.branches.filter(revision_status='approved'):
            DistributorBranch.objects.create(
                distributor=new_distributor,
                nombre=branch.nombre_comercial, 
                departamento=branch.departamento,
                municipio=branch.municipio,
                direccion=branch.viabilidad,
                revision_status='approved',
            )

        # 4. Migrar Referencias
        for ref in req.references.filter(revision_status='verified'):
            DistributorReference.objects.create(
                distributor=new_distributor,
                nombres=ref.nombres,
                telefono=ref.telefono,
                relacion=ref.relacion,
                revision_status='verified',
            )

        # 5. Cerrar Solicitud
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


# --- 15. Rechazo (Interna) ---
class RejectDistributorRequestMutation(graphene.Mutation):
    class Arguments:
        request_id = graphene.ID(required=True)
        comentario = graphene.String(required=True)

    request = graphene.Field(DistributorRequestNode)

    @transaction.atomic
    def mutate(self, info, request_id, comentario):
        check_permission(info.context.user, 'can_authorize_requests')
        try:
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
    # Publicas / Wizard
    create_distributor_request = CreateDistributorRequestMutation.Field()
    update_distributor_request_draft = UpdateDistributorRequestDraftMutation.Field()
    upload_request_document = UploadRequestDocumentMutation.Field()
    finalize_distributor_request = FinalizeDistributorRequestMutation.Field()
    create_request_branch = CreateRequestBranchMutation.Field()
    create_request_reference = CreateRequestReferenceMutation.Field()
    delete_request_branch = DeleteRequestBranchMutation.Field()
    delete_request_reference = DeleteRequestReferenceMutation.Field()
    
    # Internas
    assign_distributor_request = AssignDistributorRequestMutation.Field()
    add_request_revision = AddRequestRevisionMutation.Field()
    request_corrections = RequestCorrectionsMutation.Field()
    submit_for_authorization = SubmitForAuthorizationMutation.Field()
    resubmit_request = ResubmitRequestMutation.Field()
    approve_distributor_request = ApproveDistributorRequestMutation.Field()
    reject_distributor_request = RejectDistributorRequestMutation.Field()