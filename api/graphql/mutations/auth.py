import graphene
import graphql_jwt
from api.graphql.schema.users import UsuarioType


class ObtainJSONWebToken(graphql_jwt.JSONWebTokenMutation):
    """
    Mutación de login personalizada que devuelve el objeto de usuario
    junto con los tokens de autenticación. Esto evita que el frontend
    tenga que hacer una segunda consulta para obtener los datos del usuario.
    """
    user = graphene.Field(UsuarioType)

    @classmethod
    def resolve(cls, root, info, **kwargs):
        return cls(user=info.context.user)


class AuthMutations(graphene.ObjectType):
    """
    Agrupa todas las mutaciones relacionadas con la autenticación.
    """
    # Usamos nuestra mutación personalizada en lugar de la por defecto.
    token_auth = ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    delete_token_cookie = graphql_jwt.DeleteJSONWebTokenCookie.Field()
    delete_refresh_token_cookie = graphql_jwt.DeleteRefreshTokenCookie.Field()