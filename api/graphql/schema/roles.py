import graphene
from graphene import relay
from graphene_django import DjangoObjectType
from graphene_django.filter import DjangoFilterConnectionField
from ..permissions import check_is_superuser
from api.models import Rol
from ..filters import RolFilter

class RolType(DjangoObjectType):
    """
    Nodo de GraphQL que representa el modelo `Rol`.

    Extiende el modelo `Rol` con campos calculados para contar permisos
    y usuarios asociados.
    """
    permission_count = graphene.Int(description="Número de permisos activos para este rol.")
    user_count = graphene.Int(description="Número de usuarios activos asignados a este rol.")

    class Meta:
        model = Rol
        interfaces = (relay.Node,)
        fields = "__all__"
        description = "Representa un rol de usuario en el sistema, con sus permisos asociados."

    def resolve_permission_count(self, info):
        """
        Calcula y devuelve la cantidad de permisos booleanos que están
        establecidos en `True` para esta instancia de rol.
        """
        permissions = [
            self.can_create_items,
            self.can_update_items,
            self.can_delete_items,
        ]
        return sum(1 for p in permissions if p)

    def resolve_user_count(self, info):
        """
        Calcula y devuelve el número de usuarios activos que tienen
        asignado este rol.
        """
        return self.usuario_set.filter(is_deleted=False).count()


class RolQuery(graphene.ObjectType):
    """
    Consultas de GraphQL para el modelo `Rol`.

    Permite obtener una lista de roles, su conteo total y un rol específico.
    El acceso a estas consultas está restringido a superusuarios.
    """
    all_roles = DjangoFilterConnectionField(
        RolType,
        filterset_class=RolFilter,
        description="Recupera una lista paginada de roles. Requiere ser superusuario."
    )
    roles_total_count = graphene.Int(
        search=graphene.String(description="Filtra por texto en el nombre del rol."),
        description="Obtiene el número total de roles. Requiere ser superusuario."
    )
    rol = relay.Node.Field(
        RolType,
        description="Recupera un rol específico por su ID global. Requiere ser superusuario."
    )

    def resolve_all_roles(self, info, **kwargs):
        """
        Resuelve la consulta `all_roles`, asegurando que el usuario
        sea un superusuario antes de devolver los datos.
        """
        check_is_superuser(info.context.user)
        return Rol.objects.filter(is_deleted=False)

    def resolve_roles_total_count(self, info, **kwargs):
        """
        Resuelve la consulta `roles_total_count`, contando solo los roles
        que coinciden con el filtro y después de verificar que el usuario
        es un superusuario.
        """
        check_is_superuser(info.context.user)
        filterset = RolFilter(
            data=kwargs,
            queryset=Rol.objects.filter(is_deleted=False)
        )
        return filterset.qs.count()