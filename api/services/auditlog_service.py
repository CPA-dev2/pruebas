from api.models import Auditlog

def format_field_change(field_name, old_value, new_value):
    """
    Formatea un cambio de campo para auditoría.
    
    :param field_name: Nombre del campo que cambió
    :param old_value: Valor anterior
    :param new_value: Valor nuevo
    :return: String formateado "Campo: 'anterior' → 'nuevo'"
    """
    # Manejar valores None
    old_display = 'Vacío' if old_value is None or old_value == '' else str(old_value)
    new_display = 'Vacío' if new_value is None or new_value == '' else str(new_value)
    
    return f"{field_name}: '{old_display}' → '{new_display}'"

def build_audit_description(base_description, changes_list):
    """
    Construye la descripción completa de auditoría con cambios.
    
    :param base_description: Descripción base (ej: "Item 'X' actualizado")
    :param changes_list: Lista de cambios formateados
    :return: Descripción completa para auditoría
    """
    if not changes_list:
        return base_description + " (Sin cambios detectados)"
    
    return base_description + "\n" + "\n".join(changes_list)

def track_model_changes(instance, updated_fields, field_labels=None):
    """
    Función genérica para trackear cambios en cualquier modelo Django.
    
    :param instance: Instancia del modelo (antes de guardar)
    :param updated_fields: Diccionario con nuevos valores {field_name: new_value}
    :param field_labels: Diccionario opcional con labels personalizados {field_name: label}
    :return: Lista de cambios formateados
    """
    if field_labels is None:
        field_labels = {}
    
    cambios = []
    
    for field_name, new_value in updated_fields.items():
        if new_value is None:
            continue
            
        # Obtener valor actual del modelo
        current_value = getattr(instance, field_name, None)
        
        # Solo registrar si hay cambio real
        if new_value != current_value:
            # Usar label personalizado o nombre del campo
            # Si no existe en field_labels, convertir 'field_name' a 'Field Name'
            label = field_labels.get(field_name, field_name.replace('_', ' ').title())
            
            # Manejar campos especiales del modelo base
            if field_name == 'is_active':
                current_display = "Activo" if current_value else "Inactivo"
                new_display = "Activo" if new_value else "Inactivo"
                cambios.append(format_field_change(label, current_display, new_display))
            elif field_name.startswith('can_'):
                # Si el campo comienza con 'can_' (permisos booleanos)
                current_display = "Sí" if current_value else "No"
                new_display = "Sí" if new_value else "No"
                cambios.append(format_field_change(label, current_display, new_display))
            else:
                # Para todos los demás campos
                cambios.append(format_field_change(label, current_value, new_value))

    return cambios

def log_model_update(usuario, instance, updated_fields, model_name, field_labels=None):
    """
    Función completa para loggear actualizaciones de cualquier modelo.
    
    :param usuario: Usuario que realiza la acción
    :param instance: Instancia del modelo (antes de guardar)
    :param updated_fields: Diccionario con nuevos valores
    :param model_name: Nombre del modelo para la descripción
    :param field_labels: Diccionario opcional con labels personalizados

    Uso típico en una mutación GraphQL:
    # 1. Importar la función
    from api.services.auditlog_service import log_model_update

    # 2. En la mutación
    updated_fields = {'campo1': nuevo_valor1, 'campo2': nuevo_valor2}
    field_labels = {'campo1': 'Campo Bonito 1', 'campo2': 'Campo Bonito 2'}

    log_model_update(
        usuario=info.context.user,
        instance=la_instancia,
        updated_fields=updated_fields,
        model_name="ElModelo",
        field_labels=field_labels
    )

    """
    # Trackear cambios
    cambios = track_model_changes(instance, updated_fields, field_labels)
    
    # Construir descripción base
    nombre_display = getattr(instance, 'nombre', None) or getattr(instance, 'username', None) or str(instance)
    descripcion_base = f"{model_name} '{nombre_display}' (ID {instance.id}) actualizado."
    
    # Construir descripción completa
    descripcion_completa = build_audit_description(descripcion_base, cambios)
    
    # Registrar en auditoría
    log_action(
        usuario=usuario,
        accion=f"Actualización de {model_name}",
        descripcion=descripcion_completa
    )

def log_action(usuario, accion, descripcion=None):
    """
    Registra una acción creación y borrados en el modelo Auditlog.
    
    :param usuario: Instancia del usuario que realizó la acción.
    :param accion: Descripción breve de la acción realizada.
    :param descripcion: Detalles adicionales sobre la acción (opcional).
    """
    return Auditlog.objects.create(
        usuario=usuario,
        accion=accion,
        descripcion=descripcion
    )