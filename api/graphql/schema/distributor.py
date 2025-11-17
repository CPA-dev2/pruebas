import graphene
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphene import relay
from api.models import (
    Distributor, DistributorDocument, DistributorBranch, DistributorReference
)

# --- Nodos del Maestro de Distribuidores ---

class DistributorNode(DjangoObjectType):
    """
    Nodo de GraphQL para el modelo Distributor (el maestro aprobado).
    """
    class Meta:
        model = Distributor
        interfaces = (relay.Node,)
        fields = "__all__"
        filter_fields = {
            'nit': ['exact'],
            'razon_social_o_nombre': ['icontains'],
            'nombre_comercial': ['icontains'],
            'user__email': ['exact'],
        }

class DistributorDocumentNode(DjangoObjectType):
    """
    Nodo de GraphQL para los documentos del distribuidor aprobado.
    """
    class Meta:
        model = DistributorDocument
        interfaces = (relay.Node,)
        fields = "__all__"

class DistributorBranchNode(DjangoObjectType):
    """
    Nodo de GraphQL para las sucursales del distribuidor aprobado.
    """
    class Meta:
        model = DistributorBranch
        interfaces = (relay.Node,)
        fields = "__all__"

class DistributorReferenceNode(DjangoObjectType):
    """
    Nodo de GraphQL para las referencias del distribuidor aprobado.
    """
    class Meta:
        model = DistributorReference
        interfaces = (relay.Node,)
        fields = "__all__"

class DistributorQuery(graphene.ObjectType):
    """
    Consultas relacionadas con el Maestro de Distribuidores.
    """
    distributor = relay.Node.Field(DistributorNode)
    all_distributors = DjangoFilterConnectionField(DistributorNode)