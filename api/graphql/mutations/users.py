import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from api.models import Usuario, Rol
from ..permissions import check_is_superuser
from api.services.auditlog_service import log_action, log_model_update
from ..schema.users import UsuarioType

class CreateUserMutation(graphene.Mutation):
    """
    Mutación para crear un nuevo usuario.

    Requiere permiso de superusuario. Valida que el `username` y `email`
    no estén ya en uso. Asigna un rol si se proporciona un `rol_id`.
    """
    class Arguments:
        username = graphene.String(required=True, description="Nombre de usuario único.")
        password = graphene.String(required=True, description="Contraseña para el nuevo usuario.")
        email = graphene.String(required=True, description="Correo electrónico único.")
        first_name = graphene.String(description="Nombre de pila del usuario.")
        last_name = graphene.String(description="Apellidos del usuario.")
        rol_id = graphene.ID(description="ID global del rol a asignar al usuario.")

    user = graphene.Field(UsuarioType, description="El usuario recién creado.")

    def mutate(self, info, username, password, email, **kwargs):
        """
        Crea un nuevo usuario tras validar los permisos y la unicidad de
        los datos.
        """
        check_is_superuser(info.context.user)

        if Usuario.objects.filter(username=username, is_deleted=False).exists():
            raise GraphQLError("Ya existe un usuario con este nombre de usuario.")
        if Usuario.objects.filter(email=email, is_deleted=False).exists():
            raise GraphQLError("Ya existe un usuario con este correo electrónico.")

        rol = None
        rol_id = kwargs.get('rol_id')
        if rol_id:
            try:
                real_rol_id = from_global_id(rol_id)[1]
                rol = Rol.objects.get(pk=real_rol_id, is_deleted=False)
            except Rol.DoesNotExist:
                raise GraphQLError("El rol especificado no existe o ha sido eliminado.")

        user = Usuario.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=kwargs.get('first_name'),
            last_name=kwargs.get('last_name'),
            rol=rol
        )
        # Registrar la acción en el log de auditoría
        log_action(
            usuario=info.context.user,
            accion="Creación de Usuario",
            descripcion=f"Usuario '{user.username}' creado con ID {user.id}."
        )
        return CreateUserMutation(user=user)

class UpdateUserMutation(graphene.Mutation):
    """
    Mutación para actualizar un usuario existente.

    Requiere permiso de superusuario. Permite modificar datos básicos y
    reasignar el rol del usuario.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del usuario a actualizar.")
        username = graphene.String(description="Nuevo nombre de usuario.")
        email = graphene.String(description="Nuevo correo electrónico.")
        first_name = graphene.String(description="Nuevo nombre de pila.")
        last_name = graphene.String(description="Nuevos apellidos.")
        is_active = graphene.Boolean(description="Nuevo estado de actividad.")
        rol_id = graphene.ID(description="ID global del nuevo rol a asignar.")

    user = graphene.Field(UsuarioType, description="El usuario actualizado.")

    def mutate(self, info, id, **kwargs):
        """
        Actualiza los campos del usuario, validando la unicidad de `username`
        y `email` si se proporcionan.
        """
        check_is_superuser(info.context.user)
        real_id = from_global_id(id)[1]
        try:
            user = Usuario.objects.get(pk=real_id)

            # Validar unicidad de username y email si cambian
            if 'username' in kwargs and Usuario.objects.filter(username=kwargs['username'], is_deleted=False).exclude(pk=real_id).exists():
                raise GraphQLError("Ese nombre de usuario ya está en uso.")
            if 'email' in kwargs and Usuario.objects.filter(email=kwargs['email'], is_deleted=False).exclude(pk=real_id).exists():
                raise GraphQLError("Ese correo electrónico ya está en uso.")

            # Preparar campos a actualizar
            updated_fields = {}
            if kwargs.get('username') is not None:
                updated_fields['username'] = kwargs['username']
            if kwargs.get('email') is not None:
                updated_fields['email'] = kwargs['email']
            if kwargs.get('first_name') is not None:
                updated_fields['first_name'] = kwargs['first_name']
            if kwargs.get('last_name') is not None:
                updated_fields['last_name'] = kwargs['last_name']
            if kwargs.get('is_active') is not None:
                updated_fields['is_active'] = kwargs['is_active']
            if kwargs.get('rol_id') is not None:
                # Manejo especial para el rol - verificar si realmente cambia
                if kwargs['rol_id'] != user.rol_id:
                    if kwargs['rol_id']:
                        real_rol_id = from_global_id(kwargs['rol_id'])[1]
                        new_rol = Rol.objects.get(pk=real_rol_id, is_deleted=False)
                        updated_fields['rol'] = new_rol.nombre  # Usar nombre del rol para auditoría
                    else:
                        updated_fields['rol'] = None  # Sin rol
            
            # Labels personalizados para campos de usuario para el frontend
            field_labels = {
                'username': 'Nombre de Usuario',
                'email': 'Correo Electrónico', 
                'first_name': 'Nombre',
                'last_name': 'Apellido',
                'is_active': 'Estado',
                'rol': 'Rol'
            }
            
            # Loggear cambios antes de guardar
            log_model_update(
                usuario=info.context.user,
                instance=user,
                updated_fields=updated_fields,
                model_name="Usuario",
                field_labels=field_labels
            )
            
            # Aplicar cambios al modelo
            for field_name, new_value in updated_fields.items():
                if field_name == 'rol':
                    # Manejo especial para el rol - aplicar al campo rol_id del modelo
                    if kwargs.get('rol_id'):
                        real_rol_id = from_global_id(kwargs['rol_id'])[1]
                        user.rol = Rol.objects.get(pk=real_rol_id, is_deleted=False)
                    else:
                        user.rol = None
                else:
                    # Para todos los demás campos, usar setattr
                    if field_name in kwargs and kwargs[field_name] is not None:
                        setattr(user, field_name, kwargs[field_name])
            
            user.save()
            return UpdateUserMutation(user=user)
        except Usuario.DoesNotExist:
            raise GraphQLError("El usuario no existe.")
        except Rol.DoesNotExist:
            raise GraphQLError("El rol especificado no existe o ha sido eliminado.")


class DeleteUserMutation(graphene.Mutation):
    """
    Mutación para realizar un borrado lógico (soft delete) de un usuario.

    Requiere permiso de superusuario. Un usuario no puede eliminarse a sí mismo.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del usuario a eliminar.")

    success = graphene.Boolean(description="Indica si la operación de borrado fue exitosa.")

    def mutate(self, info, id):
        """
        Realiza el soft delete del usuario, con validaciones de seguridad.
        """
        check_is_superuser(info.context.user)
        try:
            real_id = from_global_id(id)[1]
            user = Usuario.objects.get(pk=real_id)
            if user == info.context.user:
                raise GraphQLError("No puedes eliminar tu propio usuario.")
            user.delete()
            # Registrar la acción en el log de auditoría
            log_action(
                usuario=info.context.user,
                accion="Borrado Lógico de Usuario",
                descripcion=f"Usuario '{user.username}' (ID {user.id}) marcado como eliminado."
            )
            return DeleteUserMutation(success=True)
        except Usuario.DoesNotExist:
            raise GraphQLError("El usuario no existe.")

class UserMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones relacionadas con el modelo `Usuario`."""
    create_user = CreateUserMutation.Field(description="Crea un nuevo usuario.")
    update_user = UpdateUserMutation.Field(description="Actualiza un usuario existente.")
    delete_user = DeleteUserMutation.Field(description="Marca un usuario como eliminado (soft delete).")