import graphene

from .graphql.schema.items import ItemQuery
from .graphql.schema.users import UserQuery
from .graphql.schema.roles import RolQuery 
from .graphql.mutations.items import ItemMutations
from .graphql.mutations.auth import AuthMutations
from .graphql.mutations.users import UserMutations
from .graphql.mutations.roles import RolMutations
from .graphql.schema.distributor_request import DistributorRequestQuery
from .graphql.schema.distributor import DistributorQuery
from .graphql.mutations.distributor_request import DistributorRequestMutations
from .graphql.mutations.distributor import DistributorMutations
from .graphql.mutations.distributor_review import DistributorReviewMutations


class Query(
    ItemQuery, 
    UserQuery, 
    RolQuery, 
    DistributorRequestQuery,
    DistributorQuery,
    graphene.ObjectType
):
    """
    Combina todas las consultas de la aplicación.
    """
    pass


class Mutation(
    ItemMutations, 
    AuthMutations, 
    UserMutations, 
    RolMutations,
    DistributorRequestMutations,
    DistributorMutations,
    DistributorReviewMutations,
    graphene.ObjectType,
):
    """
    Combina todas las mutaciones de la aplicación.
    """
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)