import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from ..permissions import check_is_authenticated, check_is_superuser

from api.models import Usuario
from ..filters import UserFilter

from .roles import RolType


class UsuarioType(DjangoObjectType):
    """
    Nodo de GraphQL que representa el modelo `Usuario`.

    Extiende el modelo `Usuario` con campos adicionales para facilitar
    la visualización de datos relacionados, como el nombre del rol.
    Excluye el campo `password` por seguridad.
    """
    rol_display = graphene.String(description="Nombre del rol del usuario, o 'Sin rol' si no tiene uno.")
    rol = graphene.Field(RolType, description="Objeto completo del rol asignado al usuario.")

    class Meta:
        model = Usuario
        interfaces = (relay.Node,)
        exclude = ("password",)
        description = "Representa un usuario del sistema, con sus datos personales y rol."

    def resolve_rol_display(self, info):
        """
        Resuelve el campo `rol_display` con el nombre del rol del usuario.
        """
        if self.rol:
            return self.rol.nombre
        return "Sin rol"

    def resolve_rol(self, info):
        """
        Resuelve el campo `rol` devolviendo el objeto `Rol` completo.
        """
        return self.rol

class UserQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Usuario`.

    Ofrece queries para obtener listas de usuarios (restringido a superusuarios),
    el usuario actualmente autenticado (`me`), y un usuario específico por ID.
    """
    all_users = DjangoFilterConnectionField(
        UsuarioType,
        filterset_class=UserFilter,
        description="Recupera una lista paginada de usuarios. Requiere ser superusuario."
    )
    users_total_count = graphene.Int(
        search=graphene.String(description="Filtra por texto en nombre, apellido o email."),
        is_active=graphene.Boolean(description="Filtra por estado activo o inactivo."),
        description="Obtiene el número total de usuarios. Requiere ser superusuario."
    )
    user = relay.Node.Field(
        UsuarioType,
        description="Recupera un usuario por su ID global. Requiere ser superusuario."
    )
    me = graphene.Field(
        UsuarioType,
        description="Recupera los datos del usuario actualmente autenticado."
    )

    def resolve_all_users(self, info, **kwargs):
        """
        Resuelve la consulta `all_users`, verificando que el solicitante
        sea superusuario.
        """
        check_is_superuser(info.context.user)
        return Usuario.objects.filter(is_deleted=False)

    def resolve_users_total_count(self, info, **kwargs):
        """
        Resuelve el conteo total de usuarios, aplicando filtros y permisos
        de superusuario.
        """
        check_is_superuser(info.context.user)
        filterset = UserFilter(
            data=kwargs,
            queryset=Usuario.objects.filter(is_deleted=False)
        )
        return filterset.qs.count()

    def resolve_user(self, info, id):
        """
        Resuelve la consulta `user`, verificando que el solicitante
        sea superusuario antes de devolver el usuario.
        """
        check_is_superuser(info.context.user)
        return relay.Node.get_node_from_global_id(info, id, only_type=UsuarioType)

    def resolve_me(self, info):
        """
        Resuelve la consulta `me`, devolviendo el usuario autenticado
        que realiza la petición.
        """
        check_is_authenticated(info.context.user)
        return info.context.user