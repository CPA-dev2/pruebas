import graphene
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene import relay
from api.models import (
    DistributorRequest, RequestDocument, RequestBranch, 
    RequestReference, RequestTracking, RequestRevision
)
from ..filters import (
    DistributorRequestFilter, 
    RequestDocumentFilter,
    RequestBranchFilter,
    RequestReferenceFilter,
    RequestTrackingFilter,  
    RequestRevisionFilter   
)

class RequestDocumentNode(DjangoObjectType):
    """
    Nodo de GraphQL para los documentos de la solicitud.
    """
    class Meta:
        model = RequestDocument
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = RequestDocumentFilter 

class RequestBranchNode(DjangoObjectType):
    """
    Nodo de GraphQL para las sucursales de la solicitud.
    """
    class Meta:
        model = RequestBranch
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = RequestBranchFilter 

class RequestReferenceNode(DjangoObjectType):
    """
    Nodo de GraphQL para las referencias de la solicitud.
    """
    class Meta:
        model = RequestReference
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = RequestReferenceFilter 

class RequestTrackingNode(DjangoObjectType):
    """
    Nodo de GraphQL para el log de auditoría de estados.
    """
    class Meta:
        model = RequestTracking
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = RequestTrackingFilter 

class RequestRevisionNode(DjangoObjectType):
    """
    Nodo de GraphQL para las revisiones de campos.
    """
    class Meta:
        model = RequestRevision
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = RequestRevisionFilter 

class DistributorRequestNode(DjangoObjectType):
    """
    Nodo de GraphQL para el modelo DistributorRequest (la solicitud).
    """
    class Meta:
        model = DistributorRequest
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = DistributorRequestFilter 
    
    # --- CORRECCIÓN DE ERROR DE ENUM ---
    # Sobrescribimos el campo estado para que GraphQL lo trate como un String simple
    # y no intente validarlo contra el Enum generado automáticamente que causa el conflicto.
    estado = graphene.String()

    # Campos de relación inversa explícitos (opcional pero recomendado para facilidad en Frontend)
    documentos = graphene.List(RequestDocumentNode)
    sucursales = graphene.List(RequestBranchNode)
    referencias = graphene.List(RequestReferenceNode)

    def resolve_estado(self, info):
        # Devuelve el valor textual del estado (ej: "PENDIENTE")
        return str(self.estado)

    def resolve_documentos(self, info):
        # Accede a la relación reverse 'documents' (related_name en el modelo)
        return self.documents.all()

    def resolve_sucursales(self, info):
        # Accede a la relación reverse 'branches' (related_name en el modelo)
        return self.branches.all()

    def resolve_referencias(self, info):
        # Accede a la relación reverse 'references' (related_name en el modelo)
        return self.references.all()


class DistributorRequestQuery(graphene.ObjectType):
    """
    Consultas relacionadas con el flujo de Solicitudes de Distribuidores.
    """
    distributor_request = relay.Node.Field(DistributorRequestNode)
    all_distributor_requests = DjangoFilterConnectionField(DistributorRequestNode)
    
    documents_by_request = DjangoFilterConnectionField(RequestDocumentNode)
    branches_by_request = DjangoFilterConnectionField(RequestBranchNode)
    references_by_request = DjangoFilterConnectionField(RequestReferenceNode)
    tracking_by_request = DjangoFilterConnectionField(RequestTrackingNode)
    revisions_by_request = DjangoFilterConnectionField(RequestRevisionNode)