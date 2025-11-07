# api/graphql/schema/distributor.py

from logging import info
import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from api.models import Distributor, Document, Reference, Location, Assignmentdistributor, Revisiondistributor
from ..filters import DistributorFilter
from graphql import GraphQLError

# --- Tipos de Nodos (Definidos al inicio) ---

class DocumentType(DjangoObjectType):
    """Tipo GraphQL para el modelo Document."""
    class Meta:
        model = Document
        fields = "__all__"

class ReferenceType(DjangoObjectType):
    """Tipo GraphQL para el modelo Reference."""
    class Meta:
        model = Reference
        fields = "__all__"

class LocationType(DjangoObjectType):
    """Tipo GraphQL para el modelo Location."""
    class Meta:
        model = Location
        fields = "__all__"
        
class AssignmentdistributorType(DjangoObjectType):
    """Tipo GraphQL para el modelo Assignmentdistributor."""
    class Meta:
        model = Assignmentdistributor
        fields = "__all__"

class RevisiondistributorType(DjangoObjectType):
    """Tipo GraphQL para el modelo Revisiondistributor."""
    class Meta:
        model = Revisiondistributor
        fields = "__all__"

class DistributorNode(DjangoObjectType):
    """
    Nodo de GraphQL que representa el modelo `Distributor`.
    Este es el tipo principal para consultas de distribuidores.
    """
    documentos = graphene.List(DocumentType, description="Documentos asociados al distribuidor")
    referencias = graphene.List(ReferenceType, description="Referencias asociadas al distribuidor")
    locations = graphene.List(LocationType, description="Ubicaciones asociadas al distribuidor")
    revisions = graphene.List(RevisiondistributorType, description="Revisiones del distribuidor")

    class Meta:
        model = Distributor
        fields = "__all__"
        interfaces = (relay.Node,)
    
    def resolve_documentos(self, info):
        return self.documentos.filter(is_deleted=False)
    
    def resolve_referencias(self, info):
        return self.referencias.filter(is_deleted=False)
    
    def resolve_locations(self, info):
        return self.locations.filter(is_deleted=False)

    def resolve_revisions(self, info):
        return self.revisions.filter(is_deleted=False)

# --- Lógica de Queryset Centralizada ---

def get_distributor_queryset(info, view_type, **kwargs):
    """
    Función helper para construir el queryset base de distribuidores
    según el view_type (la pestaña seleccionada) y los permisos del usuario.
    
    Esta función centraliza la lógica de negocio para las listas de distribuidores.
    """
    user = info.context.user
    if not user.is_authenticated:
        raise GraphQLError("Debes estar autenticado para consultar distribuidores.")

    base_qs = Distributor.objects.filter(is_deleted=False)
    
    # Lógica para determinar el queryset basado en la vista (viewType)
    if view_type == "pending":
        # Todos los 'pendientes' son visibles para usuarios con permiso
        qs = base_qs.filter(estado='pendiente')
    
    elif view_type == "my_revisions":
        # Solo los 'revision' o 'correccion' asignados AL USUARIO ACTUAL
        qs = base_qs.filter(
            assignments__usuario=user,
            assignments__is_deleted=False,
            estado__in=['revision', 'correccion']
        ).distinct()
        
    elif view_type == "my_validated":
        # Solo los 'validado' asignados AL USUARIO ACTUAL
        qs = base_qs.filter(
            assignments__usuario=user,
            assignments__is_deleted=False,
            estado='validado'
        ).distinct()
        
    elif view_type == "approved":
        # Todos los 'aprobado'
        qs = base_qs.filter(estado='aprobado')
        
    elif view_type == "rejected":
        # Todos los 'rechazado'
        qs = base_qs.filter(estado='rechazado')
        
    else:
        # Si el viewType no es válido, lanzamos un error.
        raise GraphQLError(f"Tipo de vista no válido: {view_type}")

    # Aplicar filtros de búsqueda (search, tipoPersona, etc.)
    # El filterset se encarga de manejar los kwargs (ej. search=..., tipo_persona=...)
    filterset = DistributorFilter(
        data=kwargs,
        queryset=qs
    )
    return filterset.qs.distinct()

# --- Queries de GraphQL Refactorizadas ---

class DistributorQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Distributor`.
    
    Estas queries están consolidadas y parametrizadas para manejar
    todas las vistas de listado de distribuidores.
    """

    all_distributors = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter, # Los filtros se definen aquí
        
        # REFACTOR: Se añade 'viewType' para controlar la lógica de negocio
        view_type=graphene.String(
            required=True, 
            description="El tipo de vista (pestaña) a consultar. (ej. 'pending', 'my_revisions', 'approved')"
        ),
        description="Recupera una lista paginada de distribuidores basada en el tipo de vista."
    )

    distributors_total_count = graphene.Int(
        # Filtros estándar (deben coincidir con DistributorFilter)
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        estado=graphene.String(description="Filtra por estado del distribuidor."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        departamento=graphene.String(description="Filtra por departamento."),
        
        # REFACTOR: 'viewType' es el argumento clave
        view_type=graphene.String(
            required=True, 
            description="El tipo de vista para el cual contar los resultados."
        ),
        description="Obtiene el número total de distribuidores que coinciden con los filtros y el tipo de vista."
    )

    distributor = relay.Node.Field(
        DistributorNode,
        description="Recupera un distribuidor específico por su ID global de Relay."
    )   

    def resolve_all_distributors(self, info, view_type, **kwargs):
        """
        Resuelve la consulta `all_distributors`.
        Delega la lógica de construcción del queryset a la función helper.
        """
        # kwargs ya contiene 'first', 'after', 'search', 'tipo_persona', etc.
        return get_distributor_queryset(info, view_type, **kwargs)

    def resolve_distributors_total_count(self, info, view_type, **kwargs):
        """
        Resuelve la consulta `distributors_total_count`.
        Delega la lógica y luego solo cuenta los resultados.
        """
        # kwargs contiene 'search', 'tipo_persona', etc. (sin 'first' y 'after')
        qs = get_distributor_queryset(info, view_type, **kwargs)
        return qs.count()
    
    def resolve_distributor(self, info, id):
        """
        Resuelve la consulta `distributor` para obtener un distribuidor por su ID global.
        Requiere autenticación.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar un distribuidor.")
        
        return relay.Node.get_node_from_global_id(info, id, only_type=DistributorNode)