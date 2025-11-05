import graphene
from graphql import GraphQLError
from graphql_relay import from_global_id
from api.models import Rol
from ..permissions import check_is_superuser
from api.services.auditlog_service import log_action, log_model_update
from ..schema.roles import RolType

class CreateRolMutation(graphene.Mutation):
    """
    Mutación para crear un nuevo rol con un conjunto de permisos.

    Requiere que el usuario sea superusuario. Lanza un error si ya existe
    un rol con el mismo nombre.
    """
    class Arguments:
        nombre = graphene.String(required=True, description="Nombre único para el nuevo rol.")
        is_active = graphene.Boolean(description="Define si el rol está activo.")
        can_create_items = graphene.Boolean(description="Permiso para crear items.")
        can_update_items = graphene.Boolean(description="Permiso para actualizar items.")
        can_delete_items = graphene.Boolean(description="Permiso para eliminar items.")
        can_create_clients = graphene.Boolean(description="Permiso para crear clientes")
        can_update_clients = graphene.Boolean(description="Permiso para actualizar clientes")
        can_delete_clients = graphene.Boolean(description="Permiso para eliminar clientes")
        can_update_distributors = graphene.Boolean(description="Permiso para actualizar distribuidores.")
        can_delete_distributors = graphene.Boolean(description="Permiso para eliminar distribuidores.")
        can_view_auditlogs = graphene.Boolean(description="Permiso para ver registros de auditoría.")

    rol = graphene.Field(RolType, description="El rol recién creado.")

    def mutate(self, info, nombre, **kwargs):
        """
        Valida los permisos del usuario y los datos de entrada, y luego
        crea el nuevo rol en la base de datos.
        """
        check_is_superuser(info.context.user)
        if Rol.objects.filter(nombre=nombre, is_deleted=False).exists():
            raise GraphQLError("Ya existe un rol con este nombre.")
        
        rol = Rol.objects.create(nombre=nombre, **kwargs)

        # Registrar la acción en el log de auditoría
        log_action(
            usuario=info.context.user,
            accion="Creación de Rol",
            descripcion=f"Rol '{rol.nombre}' creado con ID {rol.id}."
        )
        return CreateRolMutation(rol=rol)


class UpdateRolMutation(graphene.Mutation):
    """
    Mutación para actualizar los datos de un rol existente.

    Identifica el rol por su ID global y actualiza los campos proporcionados.
    Requiere que el usuario sea superusuario.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del rol a actualizar.")
        nombre = graphene.String(description="Nuevo nombre para el rol.")
        is_active = graphene.Boolean(description="Nuevo estado de actividad.")
        can_create_items = graphene.Boolean(description="Nuevo valor para el permiso de crear items.")
        can_update_items = graphene.Boolean(description="Nuevo valor para el permiso de actualizar items.")
        can_delete_items = graphene.Boolean(description="Nuevo valor para el permiso de eliminar items.")
        can_create_clients = graphene.Boolean(description="Permiso para crear clientes")
        can_update_clients = graphene.Boolean(description="Permiso para actualizar clientes")
        can_delete_clients = graphene.Boolean(description="Permiso para eliminar clientes")
        can_update_distributors = graphene.Boolean(description="Nuevo valor para el permiso de actualizar distribuidores.")
        can_delete_distributors = graphene.Boolean(description="Nuevo valor para el permiso de eliminar distribuidores.")
        can_view_auditlogs = graphene.Boolean(description="Nuevo valor para el permiso de ver registros de auditoría.")

    rol = graphene.Field(RolType, description="El rol actualizado.")

    def mutate(self, info, id, **kwargs):
        """
        Busca el rol, aplica las actualizaciones y guarda los cambios,
        previa validación de permisos.
        """
        check_is_superuser(info.context.user)
        try:
            real_id = from_global_id(id)[1]
            rol = Rol.objects.get(pk=real_id)

            # Evitar actualizar el nombre si ya existe en otro rol no eliminado
            new_name = kwargs.get('nombre')
            if new_name and Rol.objects.filter(nombre=new_name, is_deleted=False).exclude(pk=real_id).exists():
                raise GraphQLError("Ya existe otro rol con este nombre.")

            # Preparar campos a actualizar
            updated_fields = {}
            if kwargs.get('nombre') is not None:
                updated_fields['nombre'] = kwargs['nombre']
            if kwargs.get('is_active') is not None:
                updated_fields['is_active'] = kwargs['is_active']
            if kwargs.get('can_create_items') is not None:
                updated_fields['can_create_items'] = kwargs['can_create_items']
            if kwargs.get('can_update_items') is not None:
                updated_fields['can_update_items'] = kwargs['can_update_items']
            if kwargs.get('can_delete_items') is not None:
                updated_fields['can_delete_items'] = kwargs['can_delete_items']
            if kwargs.get('can_view_auditlogs') is not None:
                updated_fields['can_view_auditlogs'] = kwargs['can_view_auditlogs']

            # Labels personalizados para campos de rol para el frontend
            field_labels = {
                'nombre': 'Nombre del Rol',
                'descripcion': 'Descripción',
                'is_active': 'Estado',
                'can_create_items': 'Permiso Crear Items',
                'can_update_items': 'Permiso Actualizar Items',
                'can_delete_items': 'Permiso Eliminar Items',
                'can_view_auditlogs': 'Permiso Ver Auditorías'
            }
           
            # Loggear cambios antes de guardar
            log_model_update(
                usuario=info.context.user,
                instance=rol,
                updated_fields=updated_fields,
                model_name="Rol",
                field_labels=field_labels
            )
            
            # Aplicar cambios al modelo
            for field_name, new_value in updated_fields.items():
                setattr(rol, field_name, new_value)

            rol.save()
            return UpdateRolMutation(rol=rol)
        except Rol.DoesNotExist:
            raise GraphQLError("El rol no existe.")

class DeleteRolMutation(graphene.Mutation):
    """
    Mutación para realizar un borrado lógico (soft delete) de un rol.

    Requiere que el usuario sea superusuario. No permite eliminar un rol
    si está asignado a usuarios activos.
    """
    class Arguments:
        id = graphene.ID(required=True, description="ID global del rol a eliminar.")

    success = graphene.Boolean(description="Indica si la operación de borrado fue exitosa.")
    
    def mutate(self, info, id):
        """
        Verifica las condiciones y realiza el soft delete del rol si es posible.
        """
        check_is_superuser(info.context.user)
        try:
            real_id = from_global_id(id)[1]
            rol = Rol.objects.get(pk=real_id)
            if rol.usuario_set.filter(is_deleted=False).exists():
                raise GraphQLError("No se puede eliminar un rol asignado a usuarios activos.")
            rol.delete()
            # Registrar la acción en el log de auditoría
            log_action(
                usuario=info.context.user,
                accion="Borrado Lógico de Rol",
                descripcion=f"Rol '{rol.nombre}' (ID {rol.id}) marcado como eliminado."
            )
            return DeleteRolMutation(success=True)
        except Rol.DoesNotExist:
            raise GraphQLError("El rol no existe.")

class RolMutations(graphene.ObjectType):
    """Agrupa todas las mutaciones relacionadas con el modelo `Rol`."""
    create_rol = CreateRolMutation.Field(description="Crea un nuevo rol y define sus permisos.")
    update_rol = UpdateRolMutation.Field(description="Actualiza un rol existente.")
    delete_rol = DeleteRolMutation.Field(description="Marca un rol como eliminado (soft delete).")
    