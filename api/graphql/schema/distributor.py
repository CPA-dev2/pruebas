"""
Define el Esquema de GraphQL (Tipos, Nodos, Inputs y Queries) para
el modelo de Distribuidor ACTIVO (Producción).
"""
import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphql import GraphQLError
from api.models import (
    Distributor, Document, Reference, Location
)
from ..filters import DistributorFilter
from ..permissions import check_permission, check_is_authenticated

# --- Nodos de Tipo (Types) ---
# Estos son los tipos de "producción" que se relacionan con un Distribuidor aprobado.

class DocumentNode(DjangoObjectType):
    """Tipo GraphQL para el modelo Document (producción)."""
    class Meta:
        model = Document
        fields = "__all__"
        interfaces = (relay.Node,)
        filter_fields = ['tipo_documento', 'estado']

class ReferenceNode(DjangoObjectType):
    """Tipo GraphQL para el modelo Reference (producción)."""
    class Meta:
        model = Reference
        fields = "__all__"
        interfaces = (relay.Node,)
        filter_fields = ['estado']

class LocationNode(DjangoObjectType):
    """Tipo GraphQL para el modelo Location (producción)."""
    class Meta:
        model = Location
        fields = "__all__"
        interfaces = (relay.Node,)
        filter_fields = ['estado', 'departamento', 'municipio']

class DistributorNode(DjangoObjectType):
    """Nodo de GraphQL que representa el modelo `Distributor` (producción)."""
    class Meta:
        model = Distributor
        fields = "__all__"
        interfaces = (relay.Node,)
        filterset_class = DistributorFilter

# --- Input Types ---

class DistributorDataInput(graphene.InputObjectType):
    """Input unificado para actualizar datos de un distribuidor de producción."""
    # (Define aquí solo los campos que un admin puede editar
    #  después de que un distribuidor ha sido aprobado)
    nombres = graphene.String()
    apellidos = graphene.String()
    telefono = graphene.String()
    departamento = graphene.String()
    municipio = graphene.String()
    direccion = graphene.String()
    telefono_negocio = graphene.String()
    
    estado = graphene.String(description="Ej: 'activo', 'inactivo'")


# --- Query (Simplificada) ---

class DistributorQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Distributor` (solo activos/inactivos).
    El flujo de aprobación se maneja en `RegistrationRequestQuery`.
    """
    
    # Query para un solo objeto por ID
    distributor = relay.Node.Field(DistributorNode)
    
    # Query consolidada para la lista de distribuidores
    all_distributors = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter,
        description="Recupera una lista paginada de distribuidores (activos o inactivos)."
    )
    
    distributors_total_count = graphene.Int(
        # Acepta automáticamente los argumentos del filtro (ej. 'estado')
        estado=graphene.String(),
        search=graphene.String(),
        description="Obtiene el número total de distribuidores que coinciden con los filtros."
    )
    
    # Nodos para sub-modelos de producción
    document = relay.Node.Field(DocumentNode)
    reference = relay.Node.Field(ReferenceNode)
    location = relay.Node.Field(LocationNode)

    def resolve_all_distributors(self, info, **kwargs):
        """Resuelve la lista de distribuidores (solo admin)."""
        check_permission(info.context.user, "can_view_distributors")
        
        qs = Distributor.objects.filter(is_deleted=False)
        return DistributorFilter(data=kwargs, queryset=qs).qs

    def resolve_distributors_total_count(self, info, **kwargs):
        """Resuelve el conteo total de distribuidores (solo admin)."""
        check_permission(info.context.user, "can_view_distributors")
        
        qs = Distributor.objects.filter(is_deleted=False)
        return DistributorFilter(data=kwargs, queryset=qs).qs.count()