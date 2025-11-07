import graphene

from .graphql.schema.items import ItemQuery
from .graphql.schema.users import UserQuery
from .graphql.schema.roles import RolQuery 
from .graphql.schema.clients import ClientQuery
from .graphql.schema.distributor import DistributorQuery 
from .graphql.schema.trackingdistributors_table import DistributorsTrackingTableQuery
from .graphql.mutations.items import ItemMutations
from .graphql.mutations.auth import AuthMutations
from .graphql.mutations.users import UserMutations
from .graphql.mutations.roles import RolMutations
from .graphql.mutations.clients import ClientMutations
from .graphql.mutations.distributors import DistributorMutations
from .graphql.mutations.documents import DocumentMutations
from .graphql.mutations.references import ReferenceMutations
from .graphql.mutations.revisions import RevisionMutations
from .graphql.mutations.locations import LocationMutations
from .graphql.mutations.assignments import AssignmentMutations


class Query(
    ItemQuery, 
    UserQuery, 
    RolQuery, 
    ClientQuery, 
    DistributorQuery,
    DistributorsTrackingTableQuery,
    graphene.ObjectType):
    """
    Combina todas las consultas de la aplicación.
    """
    pass


class Mutation(
    ItemMutations, 
    AuthMutations, 
    UserMutations, 
    RolMutations, 
    ClientMutations, 
    DistributorMutations, 
    DocumentMutations,
    ReferenceMutations,
    RevisionMutations,
    LocationMutations,
    AssignmentMutations,
    graphene.ObjectType):
    """
    Combina todas las mutaciones de la aplicación.
    """
    pass


schema = graphene.Schema(query=Query, mutation=Mutation)
