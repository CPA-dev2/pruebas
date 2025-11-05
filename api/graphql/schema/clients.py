import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from api.models import Client
from ..filters import ClientFilter



class ClientNode(DjangoObjectType):
    """
    Nodo de GraphQL que representa el modelo `Cliente`.

    Expone todos los campos del modelo y usa identificadores globales de Relay.
    """
    class Meta:
        model = Client
        fields = "__all__"
        interfaces = (relay.Node,)


class ClientQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Cliente`.

    Permite obtener una lista paginada y filtrada de clientes, un conteo
    total según filtros, y un cliente específico por su ID global.
    """

    all_clients = DjangoFilterConnectionField(
        ClientNode,
        filterset_class=ClientFilter,
        description="Recupera una lista paginada de clientes. Admite filtros."
    )

    clients_total_count = graphene.Int(
        search=graphene.String(description="Filtra por texto en nombres, apellidos, DPI o NIT."),
        nombres=graphene.String(description="Filtra por nombres específicos."),
        apellidos=graphene.String(description="Filtra por apellidos específicos."),
        dpi=graphene.String(description="Filtra por DPI específico."),
        nit=graphene.String(description="Filtra por NIT específico."),
        description="Obtiene el número total de clientes que coinciden con los filtros."
    )

    client = relay.Node.Field(
        ClientNode,
        description="Recupera un cliente específico por su ID global de Relay."
    )

    def resolve_all_clients(self, info, **kwargs):
        
        return Client.objects.filter(is_deleted=False)

    def resolve_clients_total_count(self, info, **kwargs):
        
        filterset = ClientFilter(
            data=kwargs,
            queryset=Client.objects.filter(is_deleted=False)
        )
        return filterset.qs.count()
