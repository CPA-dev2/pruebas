"""
Define el Esquema de GraphQL (Tipos, Nodos, Inputs y Queries) para el
modelo de Solicitud de Registro (Staging).
"""
import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphql import GraphQLError
from api.models import (
    RegistrationRequest,
    RegistrationDocument,
    RegistrationReference,
    RegistrationLocation,
    RegistrationRevision
)
from ..permissions import check_permission

# --- Nodos de Tipo (Staging) ---

class RegistrationDocumentNode(DjangoObjectType):
    """Documentos de una solicitud (staging)."""
    class Meta:
        model = RegistrationDocument
        fields = "__all__"
        interfaces = (relay.Node,)

class RegistrationReferenceNode(DjangoObjectType):
    """Referencias de una solicitud (staging)."""
    class Meta:
        model = RegistrationReference
        fields = "__all__"
        interfaces = (relay.Node,)

class RegistrationLocationNode(DjangoObjectType):
    """Ubicaciones de una solicitud (staging)."""
    class Meta:
        model = RegistrationLocation
        fields = "__all__"
        interfaces = (relay.Node,)

class RegistrationRevisionNode(DjangoObjectType):
    """Revisiones (observaciones) de una solicitud."""
    class Meta:
        model = RegistrationRevision
        fields = "__all__"
        interfaces = (relay.Node,)

class RegistrationRequestNode(DjangoObjectType):
    """Nodo de GraphQL que representa el modelo `RegistrationRequest`."""
    class Meta:
        model = RegistrationRequest
        fields = "__all__"
        interfaces = (relay.Node,)

# --- Input Types ---

class ReferenceInput(graphene.InputObjectType):
    """Input para crear una referencia personal o comercial."""
    nombre = graphene.String(required=True)
    telefono = graphene.String(required=True)
    tipo = graphene.String(required=True, description="'personal' o 'comercial'")

class RegistrationDataInput(graphene.InputObjectType):
    """Input para los datos JSON de la solicitud de registro."""
    nombres = graphene.String(required=True)
    apellidos = graphene.String(required=True)
    dpi = graphene.String(required=True)
    correo = graphene.String(required=True)
    telefono = graphene.String(required=True)
    departamento = graphene.String(required=True)
    municipio = graphene.String(required=True)
    direccion = graphene.String(required=True)
    telefono_negocio = graphene.String()
    equipamiento = graphene.String()
    sucursales = graphene.String()
    antiguedad = graphene.String(required=True)
    productos_distribuidos = graphene.String(required=True)
    tipo_persona = graphene.String(required=True)
    cuenta_bancaria = graphene.String()
    numero_cuenta = graphene.String()
    tipo_cuenta = graphene.String()
    banco = graphene.String()
    referencias = graphene.List(graphene.NonNull(ReferenceInput))

class RegistrationFilesInput(graphene.InputObjectType):
    """Input para los archivos de la solicitud."""
    dpi_file = graphene.types.file_upload.UploadedFile(required=True)
    rtu_file = graphene.types.file_upload.UploadedFile(required=True)
    patente_comercio_file = graphene.types.file_upload.UploadedFile()

class RevisionInput(graphene.InputObjectType):
    """Input para crear o actualizar una revisión."""
    campo = graphene.String(required=True)
    comentarios = graphene.String(required=True)
    aprobado = graphene.Boolean()

class ReferenceUpdateInput(graphene.InputObjectType):
    """Input para actualizar el estado de una referencia."""
    id = graphene.ID(required=True)
    estado = graphene.String(required=True)

class DocumentUpdateInput(graphene.InputObjectType):
    """Input para actualizar el estado de un documento."""
    id = graphene.ID(required=True)
    estado = graphene.String(required=True)


# --- Query ---

class RegistrationRequestQuery(graphene.ObjectType):
    """Consultas para el flujo de registro de distribuidores."""

    registration_request = relay.Node.Field(RegistrationRequestNode)

    all_registration_requests = DjangoFilterConnectionField(
        RegistrationRequestNode,
        description="Recupera una lista paginada de solicitudes de registro."
    )

    def resolve_all_registration_requests(self, info, **kwargs):
        check_permission(info.context.user, "can_view_registrations")
        return RegistrationRequest.objects.filter(is_deleted=False).order_by('-created')
