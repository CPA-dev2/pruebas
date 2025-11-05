import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField

from api.models import Item
from ..filters import ItemFilter
from ..permissions import check_is_authenticated


class ItemNode(DjangoObjectType):
    """
    Nodo de GraphQL que representa el modelo `Item`.

    Expone todos los campos del modelo `Item` y se integra con el sistema
    de identificadores globales de Relay.
    """
    class Meta:
        model = Item
        fields = "__all__"
        interfaces = (relay.Node,)


class ItemQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Item`.

    Permite obtener una lista paginada y filtrada de items, un conteo
    total de items según filtros, y un item específico por su ID global.
    """

    all_items = DjangoFilterConnectionField(
        ItemNode,
        filterset_class=ItemFilter,
        description="Recupera una lista paginada de items. Admite filtros."
    )

    items_total_count = graphene.Int(
        search=graphene.String(description="Filtra por texto en nombre o descripción."),
        is_active=graphene.Boolean(description="Filtra por estado activo o inactivo."),
        created_after=graphene.Date(description="Filtra por fecha de creación posterior a la indicada."),
        created_before=graphene.Date(description="Filtra por fecha de creación anterior a la indicada."),
        description="Obtiene el número total de items que coinciden con los filtros."
    )

    item = relay.Node.Field(
        ItemNode,
        description="Recupera un item específico por su ID global de Relay."
    )

    def resolve_all_items(self, info, **kwargs):
        """
        Resuelve la consulta `all_items`.

        Aplica los filtros y devuelve un queryset de items activos.
        """
        check_is_authenticated(info.context.user)
        return Item.objects.filter(is_active=True)
        
    def resolve_items_total_count(self, info, **kwargs):
        """
        Resuelve la consulta `items_total_count`.

        Calcula y devuelve el número total de items activos que coinciden
        con los filtros proporcionados.
        """
        check_is_authenticated(info.context.user)
        filterset = ItemFilter(
            data=kwargs, 
            queryset=Item.objects.filter(is_active=True)
        )
        return filterset.qs.count()