from graphql import GraphQLError

def check_permission(user, permission_attr: str):
    """
    Verifica si un usuario tiene un permiso específico.
    El permiso se comprueba a través de un atributo booleano en el modelo Rol.
    Un superusuario siempre tendrá todos los permisos.

    Args:
        user: La instancia del usuario que realiza la solicitud.
        permission_attr (str): El nombre del campo de permiso en el modelo Rol
                               (ej. 'can_create_items').
    """
    if not user.is_authenticated:
        raise GraphQLError("Debes iniciar sesión para realizar esta acción.")

    if user.is_superuser:
        return True

    if not user.rol:
        raise GraphQLError("No tienes un rol asignado para realizar esta acción.")

    if not getattr(user.rol, permission_attr, False):
        raise GraphQLError("No tienes los permisos necesarios para realizar esta acción.")

    return True

def is_authenticated(func):
    """
    Decorador para verificar que el usuario está autenticado.
    """
    def wrapper(self, info, **kwargs):
        if not info.context.user.is_authenticated:
            raise GraphQLError(
                "Debes iniciar sesión para realizar esta acción."
            )
        return func(self, info, **kwargs)
    return wrapper


def is_superuser(func):
    """
    Decorador para verificar que el usuario es un superusuario.
    """
    def wrapper(self, info, **kwargs):
        user = info.context.user
        if not user.is_authenticated or not user.is_superuser:
            raise GraphQLError(
                "No tienes permisos de administrador para realizar esta acción."
            )
        return func(self, info, **kwargs)
    return wrapper


def check_is_authenticated(user):
    if not user.is_authenticated:
        raise GraphQLError("Debes iniciar sesión para realizar esta acción.")


def check_is_superuser(user):
    if not user.is_authenticated or not user.is_superuser:
        raise GraphQLError(
            "No tienes permisos de administrador para realizar esta acción."
        )


def check_user_role(user, allowed_roles: list):
    """
    Verifica si el usuario tiene uno de los roles permitidos.
    """
    check_is_authenticated(user)
    if not user.rol or user.rol.nombre not in allowed_roles:
        raise GraphQLError(
            "No tienes los permisos necesarios para realizar esta acción."
        )


def has_role(allowed_roles: list):
    """
    Decorador para verificar que el usuario tiene uno de los roles permitidos.
    """
    def decorator(func):
        def wrapper(self, info, **kwargs):
            check_user_role(info.context.user, allowed_roles)
            return func(self, info, **kwargs)
        return wrapper
    return decorator
