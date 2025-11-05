from logging import info
import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from api.models import Distributor, Document, Reference, Location, Assignmentdistributor, Revisiondistributor
from ..filters import DistributorFilter
from graphql import GraphQLError

class DocumentType(DjangoObjectType):
    """
    Tipo GraphQL para el modelo Document.
    """
    class Meta:
        model = Document
        fields = "__all__"

class ReferenceType(DjangoObjectType):
    """
    Tipo GraphQL para el modelo Reference.
    """
    class Meta:
        model = Reference
        fields = "__all__"

class LocationType(DjangoObjectType):
    """
    Tipo GraphQL para el modelo Location.
    """
    class Meta:
        model = Location
        fields = "__all__"
class AssignmentdistributorType(DjangoObjectType):
    """
    Tipo GraphQL para el modelo Assignmentdistributor.
    """
    class Meta:
        model = Assignmentdistributor
        fields = "__all__"

class RevisiondistributorType(DjangoObjectType):
    """
    Tipo GraphQL para el modelo Revisiondistributor.
    """
    class Meta:
        model = Revisiondistributor
        fields = "__all__"

class DistributorNode(DjangoObjectType):
    """
    Nodo de GraphQL que representa el modelo `Distributor`.

    Expone todos los campos del modelo `Distributor` y se integra con el sistema
    de identificadores globales de Relay.
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
        """
        Resuelve los documentos asociados al distribuidor.
        """
        return self.documentos.filter(is_deleted=False)
    
    def resolve_referencias(self, info):
        """
        Resuelve las referencias asociadas al distribuidor.
        """
        return self.referencias.filter(is_deleted=False)
    
    def resolve_locations(self, info):
        """
        Resuelve las ubicaciones asociadas al distribuidor.
        """
        return self.locations.filter(is_deleted=False)

    def resolve_revisions(self, info):
        """
        Resuelve las revisiones asociadas al distribuidor.
        """
        return self.revisions.filter(is_deleted=False)

class DistributorQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Distributor`.

    Permite obtener una lista paginada y filtrada de distribuidores, un conteo
    total de distribuidores según filtros, y un distribuidor específico por su ID global.
    """

    all_distributors = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter,
        description="Recupera una lista paginada de distribuidores. Admite filtros."
    )

    distributors_total_count = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        estado=graphene.String(description="Filtra por estado del distribuidor."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de distribuidores que coinciden con los filtros."
        
    )

     # Campo genérico - cuenta TODOS los distribuidores (sin filtro de estado)
    distributors_total_count_all = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de TODOS los distribuidores (sin filtrar por estado)."
    )

    # Campo genérico - cuenta TODOS los distribuidores (sin filtro de estado)
    distributors_total_count_revision_correction = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        estado=graphene.String(description="Filtra por estado del distribuidor."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de TODOS los distribuidores (sin filtrar por estado)."
    )

    # Campo específico para pendientes (tu actual)
    distributors_total_count_pending = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        estado=graphene.String(description="Filtra por estado del distribuidor."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de distribuidores con estado 'pendiente'."
    )

    # Campo específico para validados
    distributors_total_count_validated = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        estado=graphene.String(description="Filtra por estado del distribuidor."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de distribuidores con estado 'validado'."
    )

    # Campo específico para aprobados
    distributors_total_count_approved = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de distribuidores con estado 'aprobado'."
    )

    # Campo específico para rechazados
    distributors_total_count_rejected = graphene.Int(
        search=graphene.String(description="Filtra por texto en negocio, nit o DPI."),
        tipo_persona=graphene.String(description="Filtra por tipo de persona."),
        estado=graphene.String(description="Filtra por estado del distribuidor."),
        departamento=graphene.String(description="Filtra por departamento."),
        description="Obtiene el número total de distribuidores con estado 'rechazado'."
    )



    distributor = relay.Node.Field(
        DistributorNode,
        description="Recupera un distribuidor específico por su ID global de Relay."
    )   

    my_assigned_distributors = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter,
        description="Recupera los distribuidores asignados al usuario autenticado. Admite filtros."
    )

    my_assigned_distributors_validated = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter,
        description="Recupera los distribuidores asignados al usuario autenticado con estado 'validado'. Admite filtros."
    )

    my_assigned_distributors_approved = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter,
        description="Recupera los distribuidores asignados al usuario autenticado con estado 'aprobado'. Admite filtros."
    )

    my_assigned_distributors_rejected = DjangoFilterConnectionField(
        DistributorNode,
        filterset_class=DistributorFilter,
        description="Recupera los distribuidores asignados al usuario autenticado con estado 'rechazado'. Admite filtros."
    )

    def resolve_all_distributors(self, info, **kwargs):
        """
        Resuelve la consulta `all_distributors`.

        Aplica los filtros y devuelve un queryset de distribuidores activos y en estado pendiente.
        Requiere autenticación.
        """
       
        if not info.context.user.is_authenticated:
            
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")

        return Distributor.objects.filter(is_deleted=False, estado='pendiente')

    def resolve_distributors_total_count(self, info, **kwargs):
        """
        Resuelve la consulta `distributors_total_count`.

        Aplica los filtros y devuelve el conteo total de distribuidores activos.
        Requiere autenticación.
        """
       
        if not info.context.user.is_authenticated:
           
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(is_deleted=False, estado='pendiente')
        )
        return filterset.qs.count()
    
        
    
    def resolve_distributors_total_count_all(self, info, **kwargs):
        """
        Cuenta TODOS los distribuidores sin filtrar por estado.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(is_deleted=False)  # SIN filtro de estado
        )
        return filterset.qs.count()
    
    def resolve_distributors_total_count_pending(self, info, **kwargs):
        """
        Cuenta solo distribuidores con estado 'pendiente'.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(is_deleted=False, estado='pendiente')
        )
        return filterset.qs.count()
    
    def resolve_distributors_total_count_validated(self, info, **kwargs):
        """
        Cuenta solo distribuidores con estado 'validado'.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        
        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(is_deleted=False, estado='validado')
        )
        return filterset.qs.count()
    
    def resolve_distributors_total_count_approved(self, info, **kwargs):
        """
        Cuenta solo distribuidores con estado 'aprobado'.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(is_deleted=False, estado='aprobado')
        )
        return filterset.qs.count()
    
    def resolve_distributors_total_count_rejected(self, info, **kwargs):
        """
        Cuenta solo distribuidores con estado 'rechazado'.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(is_deleted=False, estado='rechazado')
        )
        return filterset.qs.count()
    
    def resolve_distributors_total_count_revision_correction(self, info, **kwargs):
        """
        Cuenta distribuidores asignados al usuario en estado 'revision' o 'correccion'.
        """
        if not info.context.user.is_authenticated:
            raise GraphQLError("Debes estar autenticado para consultar distribuidores.")
        
        user = info.context.user

        filterset = DistributorFilter(
            data=kwargs,
            queryset=Distributor.objects.filter(
                assignments__usuario=user,
                assignments__is_deleted=False,
                is_deleted=False,
                estado__in=['revision', 'correccion']
            )
        )
        return filterset.qs.count()
    
    
    def resolve_distributor(self, info, id):
        """
        Resuelve la consulta `distributor` para obtener un distribuidor por su ID global.
        Requiere autenticación.
        """
        
        if not info.context.user.is_authenticated:
            
            raise GraphQLError("Debes estar autenticado para consultar un distribuidor.")
        
        return relay.Node.get_node_from_global_id(info, id, only_type=DistributorNode)
    
    
    def resolve_my_assigned_distributors(self, info, **kwargs):
        """
        Resuelve la consulta `my_assigned_distributors`.

        Devuelve los distribuidores asignados al usuario autenticado.
        Requiere autenticación.
        """
        
        if not info.context.user.is_authenticated:
            
            raise GraphQLError("Debes estar autenticado para consultar tus distribuidores asignados.")
        
        user = info.context.user

        # Obtener distribuidores asignados al usuario autenticado en revisión o corrección
        assigned_distributors = Distributor.objects.filter(
            assignments__usuario=user,
            assignments__is_deleted=False,
            is_deleted=False,
            estado__in=['revision', 'correccion']            
        ).distinct()

        # Aplicar filtros adicionales si se proporcionan
        filterset = DistributorFilter(
            data=kwargs,
            queryset=assigned_distributors
        )
        return filterset.qs
    

    def resolve_my_assigned_distributors_validated(self, info, **kwargs):
        """
        Resuelve la consulta `my_assigned_distributors_validate`.

        Devuelve los distribuidores asignados al usuario autenticado para validación.
        Requiere autenticación.
        """
        
        if not info.context.user.is_authenticated:
            
            raise GraphQLError("Debes estar autenticado para consultar tus distribuidores asignados para validación.")
        
        user = info.context.user

        # Obtener distribuidores asignados al usuario autenticado para validación
        assigned_distributors = Distributor.objects.filter(
            assignments__usuario=user,
            assignments__is_deleted=False,
            is_deleted=False,
            estado='validado'
        ).distinct()

        # Aplicar filtros adicionales si se proporcionan
        filterset = DistributorFilter(
            data=kwargs,
            queryset=assigned_distributors
        )
        return filterset.qs

    def resolve_my_assigned_distributors_approved(self, info, **kwargs):
        """
        Resuelve la consulta `my_assigned_distributors_approved`.

        Devuelve todos los distribuidores con estado 'aprobado'.
        Requiere autenticación.
        """
        if not info.context.user.is_authenticated:

           raise GraphQLError("Debes estar autenticado para consultar distribuidores.")

        # Obtener todos los distribuidores con estado aprobado
        approved_distributors = Distributor.objects.filter(is_deleted=False, estado='aprobado')

        # Aplicar filtros adicionales si se proporcionan
        filterset = DistributorFilter(
            data=kwargs,
            queryset=approved_distributors
        )
        return filterset.qs
    

    def resolve_my_assigned_distributors_rejected(self, info, **kwargs):
        """
        Resuelve la consulta `my_assigned_distributors_rejected`.

        Devuelve todos los distribuidores con estado 'rechazado'.
        Requiere autenticación.
        """
        if not info.context.user.is_authenticated:

           raise GraphQLError("Debes estar autenticado para consultar distribuidores.")

        # Obtener todos los distribuidores con estado rechazado
        rejected_distributors = Distributor.objects.filter(is_deleted=False, estado='rechazado')

        # Aplicar filtros adicionales si se proporcionan
        filterset = DistributorFilter(
            data=kwargs,
            queryset=rejected_distributors
        )
        return filterset.qs

    

class DistributorType(DjangoObjectType):
    """
    Tipo simple de GraphQL para el modelo `Distributor`.
    Usado en mutations y queries simples.
    """
    class Meta:
        model = Distributor
        fields = "__all__"