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
    Asigna una solicitud de registro a un revisor (el usuario autenticado).
    Cambia el estado de 'pendiente' a 'revision'.
    """
    class Arguments:
        id = graphene.ID(required=True)
    
    request = graphene.Field(RegistrationRequestNode)

    def mutate(self, info, id):
        user = info.context.user
        check_is_authenticated(user)
        try:
            real_id = from_global_id(id)[1]
            request_obj = registration_service.assign_registration_request(
                request_id=real_id,
                user=user
            )
            return AssignRegistrationRequest(request=request_obj)
        except (ValidationError, PermissionDenied) as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")

class CreateRegistrationRevisions(graphene.Mutation):
    """Crea una o más revisiones (observaciones) para una solicitud."""
    class Arguments:
        request_id = graphene.ID(required=True)
        revisions = graphene.List(graphene.NonNull(RevisionInput), required=True)
        
    revisions = graphene.List(RegistrationRevisionNode)

    def mutate(self, info, request_id, revisions):
        user = info.context.user
        check_is_authenticated(user)
        try:
            real_id = from_global_id(request_id)[1]
            created_revisions = registration_service.create_registration_revision(
                request_id=real_id,
                revisions_data=revisions,
                user=user
            )
            return CreateRegistrationRevisions(revisions=created_revisions)
        except (ValidationError, PermissionDenied) as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")

class UpdateRegistrationRevision(graphene.Mutation):
    """Actualiza una revisión (ej. la marca como aprobada)."""
    class Arguments:
        id = graphene.ID(required=True)
        aprobado = graphene.Boolean()
        comentarios = graphene.String()
        
    revision = graphene.Field(RegistrationRevisionNode)
    
    def mutate(self, info, id, **kwargs):
        user = info.context.user
        check_is_authenticated(user)
        try:
            real_id = from_global_id(id)[1]
            updated_revision = registration_service.update_registration_revision_status(
                revision_id=real_id,
                data=kwargs,
                user=user
            )
            return UpdateRegistrationRevision(revision=updated_revision)
        except (ValidationError, PermissionDenied) as e:
            raise GraphQLError(e.message)
        except Exception as e:
            raise GraphQLError(f"Error inesperado: {str(e)}")

# ... (Aquí irían las mutaciones para actualizar estado de Document y Reference)

class RegistrationRequestMutations(graphene.ObjectType):
    """
    Agrupa todas las mutaciones para el flujo de registro.
    """
    create_registration_request = CreateRegistrationRequest.Field()
    approve_registration_request = ApproveRegistrationRequest.Field()
    assign_registration_request = AssignRegistrationRequest.Field()
    create_registration_revisions = CreateRegistrationRevisions.Field()
    update_registration_revision = UpdateRegistrationRevision.Field()