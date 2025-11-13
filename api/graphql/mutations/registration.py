"""
Mutaciones de GraphQL para el flujo de Registro de Distribuidores.
Utiliza 'graphene-file-upload' para subida de archivos (multipart/form-data).
"""
import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from django.core.exceptions import ValidationError, PermissionDenied
from django.db import transaction

# Importa el servicio que contiene TODA la lógica de negocio
from api.services import registration_service
from ..permissions import check_permission, check_is_authenticated
# Importa los tipos de GraphQL desde los archivos de schema
from ..schema.distributor import DistributorNode
from ..schema.registration_request import (
    RegistrationRequestNode, 
    RegistrationDataInput, 
    RegistrationFilesInput,
    RevisionInput,
    ReferenceUpdateInput,
    DocumentUpdateInput
)

class CreateRegistrationRequest(graphene.Mutation):
    """
    Mutación para crear una nueva Solicitud de Registro.
    Es "delgada": recibe los datos y los pasa al servicio.
    Responde instantáneamente y lanza una tarea asíncrona de Celery
    para el procesamiento de archivos pesados.
    """
    class Arguments:
        data = RegistrationDataInput(required=True, description="Datos JSON de la solicitud.")
        files = RegistrationFilesInput(required=True, description="Archivos (multipart/form-data).")

    request = graphene.Field(RegistrationRequestNode)
    message = graphene.String()

    def mutate(self, info, data, files):
        try:
            # Llama al servicio con los datos y archivos
            request_obj = registration_service.create_registration_request(
                data=data,
                referencias=data.get('referencias', []),
                files=files
            )
            return CreateRegistrationRequest(
                request=request_obj,
                message="Solicitud recibida. El RTU se está procesando en segundo plano."
            )
        except (ValidationError, PermissionDenied) as e:
            # Captura errores de negocio (ej. "DPI duplicado") y los muestra al usuario.
            raise GraphQLError(e.message)
        except Exception as e:
            # Captura errores inesperados del sistema.
            raise GraphQLError(f"Error inesperado al crear la solicitud: {str(e)}")

class ApproveRegistrationRequest(graphene.Mutation):
    """
    Aprueba una solicitud de registro ('validado' -> 'aprobado')
    y la "gradúa", creando el objeto Distribuidor final en la tabla de producción.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID Global de la Solicitud de Registro a aprobar.")
        
    distributor = graphene.Field(DistributorNode, description="El nuevo distribuidor activo creado.")

    def mutate(self, info, id):
        check_permission(info.context.user, "can_approve_distributors") # Asumiendo permiso
        try:
            real_id = from_global_id(id)[1]
            distributor = registration_service.approve_registration_request(
                request_id=real_id,
                user=info.context.user
            )
            return ApproveRegistrationRequest(distributor=distributor)
        except (ValidationError, PermissionDenied) as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(f"Error inesperado al aprobar la solicitud: {str(e)}")

class AssignRegistrationRequest(graphene.Mutation):
    """
    Asigna una solicitud de registro a un colaborador para su revisión.
    Cambia el estado a 'Asignada'.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID de la solicitud a asignar.")
        user_id = graphene.ID(required=True, description="ID del colaborador a quien se asigna.")
    
    request = graphene.Field(RegistrationRequestNode)

    def mutate(self, info, id, user_id):
        check_permission(info.context.user, "can_assign_registrations")
        try:
            request_id = from_global_id(id)[1]
            assignee_id = from_global_id(user_id)[1]

            request_obj = registration_service.assign_registration_request(
                request_id=request_id,
                assignee_id=assignee_id,
                assigner_user=info.context.user
            )
            return AssignRegistrationRequest(request=request_obj)
        except (ValidationError, PermissionDenied) as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(f"Error inesperado al asignar la solicitud: {str(e)}")

class SubmitReview(graphene.Mutation):
    """
    Permite a un revisor enviar observaciones/correcciones al solicitante.
    Cambia el estado a 'Pendiente de Correcciones'.
    """
    class Arguments:
        id = graphene.ID(required=True)
        observaciones = graphene.String(required=True)

    request = graphene.Field(RegistrationRequestNode)

    def mutate(self, info, id, observaciones):
        # Lógica que se implementará en el servicio
        pass

class ResubmitRequest(graphene.Mutation):
    """
    Permite al solicitante reenviar la solicitud después de corregir.
    Cambia el estado a 'En Revisión'.
    """
    class Arguments:
        id = graphene.ID(required=True)
        # Aquí también podrían ir `data` y `files` si se permite
        # al usuario editar la información en este paso.

    request = graphene.Field(RegistrationRequestNode)

    def mutate(self, info, id):
        # Lógica que se implementará en el servicio
        pass

class SendToApproval(graphene.Mutation):
    """
    El revisor envía la solicitud a un administrador para aprobación final.
    Cambia el estado a 'Pendiente de Aprobación'.
    """
    class Arguments:
        id = graphene.ID(required=True)

    request = graphene.Field(RegistrationRequestNode)

    def mutate(self, info, id):
        # Lógica que se implementará en el servicio
        pass

class RegistrationRequestMutations(graphene.ObjectType):
    """
    Agrupa todas las mutaciones para el flujo de registro.
    """
    create_registration_request = CreateRegistrationRequest.Field()
    approve_registration_request = ApproveRegistrationRequest.Field()
    assign_registration_request = AssignRegistrationRequest.Field()
    submit_review = SubmitReview.Field()
    resubmit_request = ResubmitRequest.Field()
    send_to_approval = SendToApproval.Field()