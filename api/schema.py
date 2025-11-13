import graphene

from .graphql.schema.items import ItemQuery
from .graphql.schema.users import UserQuery
from .graphql.schema.roles import RolQuery 
from .graphql.mutations.items import ItemMutations
from .graphql.mutations.auth import AuthMutations
from .graphql.mutations.users import UserMutations
from .graphql.mutations.roles import RolMutations


class Query(ItemQuery, UserQuery, RolQuery, graphene.ObjectType):
    """
    Combina todas las consultas de la aplicación.
    """
    pass


class Mutation(ItemMutations, AuthMutations, UserMutations, RolMutations, graphene.ObjectType):
    """
    Combina todas las mutaciones de la aplicación.
    """
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
