import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from graphql import GraphQLError

from api.models import Auditlog
from ..filters import AuditlogFilter
from api.graphql.permissions import check_auditlog_permission

class AuditlogNode(DjangoObjectType):
    """
    Tipo de nodo para los registros de auditoría.
    """

    class Meta:
        model = Auditlog
        fields = "__all__"
        interfaces = (relay.Node,)


class AuditlogQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Auditlog`.
    """

    auditlog = relay.Node.Field(
        AuditlogNode, 
        description="Recupera un registro de auditoría específico por su ID global de Relay."
    )

    all_auditlogs = DjangoFilterConnectionField(
        AuditlogNode,
        filterset_class=AuditlogFilter,
        description="Recupera una lista paginada de registros de auditoría. Admite filtros."
    )
  
    auditlogs_total_count = graphene.Int(
        usuario=graphene.String(description="Filtra por usuario."),
        accion=graphene.String(description="Filtra por acción."),
        descripcion=graphene.String(description="Filtra por descripción."),
        created_after=graphene.DateTime(description="Filtra por fecha y hora de creación posterior a la indicada."),
        created_before=graphene.DateTime(description="Filtra por fecha y hora de creación anterior a la indicada."),
        description="Obtiene el número total de auditlogs que coinciden con los filtros."
    )
    def resolve_all_auditlogs(self, info, **kwargs):
        """
        Resuelve la consulta `all_auditlogs`.
        Aplica los filtros y devuelve un queryset de auditlogs.
        """
       
        check_auditlog_permission(info.context.user)
        
        # Aplicar filtros
        filterset = AuditlogFilter(
            data=kwargs,
            queryset=Auditlog.objects.all()
        )
        
        return filterset.qs

    def resolve_auditlogs_total_count(self, info, **kwargs):
        """
        Resuelve la consulta `auditlogs_total_count`.
        """
        
        check_auditlog_permission(info.context.user)
        
        # Aplicar filtros
        filterset = AuditlogFilter(
            data=kwargs,
            queryset=Auditlog.objects.all()
        )
        
        return filterset.qs.count()



