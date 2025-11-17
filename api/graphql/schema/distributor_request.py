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

class DistributorRequestNode(DjangoObjectType):
    """
    Nodo de GraphQL para el modelo DistributorRequest (la solicitud).
    """
    class Meta:
        model = DistributorRequest
        interfaces = (relay.Node,)
        fields = "__all__"
        filterset_class = DistributorRequestFilter 

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