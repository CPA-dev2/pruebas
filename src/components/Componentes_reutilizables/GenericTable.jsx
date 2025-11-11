import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Tooltip,
  Text,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { EditIcon, DeleteIcon, ViewIcon } from '@chakra-ui/icons';

/**
 * `GenericTable` es un componente de tabla reutilizable y estilizado para mostrar
 * colecciones de datos. Es flexible y configurable a través de props.
 *
 * @param {object} props - Las propiedades del componente.
 * @param {Array<object>} props.columns - Define la estructura de las columnas. Cada objeto debe tener:
 *   - `Header` (string): El texto que aparecerá en el encabezado de la columna.
 *   - `accessor` (string): La clave del objeto de datos que se usará para poblar las celdas de esta columna.
 * @param {Array<object>} props.data - El array de objetos que se mostrará en la tabla. Si está vacío, se muestra un mensaje.
 * @param {Function} [props.onView] - Callback opcional que se ejecuta al hacer clic en el botón de visualizar. Recibe el objeto de la fila como parámetro.
 * @param {Function} [props.onEdit] - Callback opcional para el botón de editar. Recibe el objeto de la fila.
 * @param {Function} [props.onDelete] - Callback opcional para el botón de eliminar. Recibe el objeto de la fila.
 * @param {Function} [props.renderActions] - Una función "escape hatch" para renderizar acciones personalizadas. Recibe el objeto de la fila y debe devolver JSX.
 */
const GenericTable = ({ columns, data = [], onEdit, onDelete, onView, renderActions }) => {
  const headerBg = useColorModeValue('gray.100', 'gray.700');
  const rowHoverBg = useColorModeValue('gray.50', 'gray.600');

  // Comprobación de seguridad para asegurar que `data` es un array.
  if (!Array.isArray(data)) {
    console.error("GenericTable: la prop `data` debe ser un array. Se recibió:", data);
    return (
      <Text textAlign="center" color="red.500">
        Error: los datos proporcionados no son válidos.
      </Text>
    );
  }

  return (
    <Box overflowX="auto" borderWidth="1px" borderRadius="lg" p={4}>
      {data.length === 0 ? (
        <Text textAlign="center" fontSize="lg" p={10}>
          No hay datos para mostrar.
        </Text>
      ) : (
        <Table variant="simple">
          <Thead bg={headerBg}>
            <Tr>
              {columns.map((col) => (
                <Th key={col.accessor} textAlign="center">
                  {col.Header}
                </Th>
              ))}
              {/* La columna de acciones solo se muestra si se proporciona al menos una función de acción. */}
              {(onView || onEdit || onDelete || renderActions) && (
                <Th textAlign="center">Acciones</Th>
              )}
            </Tr>
          </Thead>
          <Tbody>
            {data.map((row, rowIndex) => (
              // Usar `row.id` si está disponible, de lo contrario, usar el índice como fallback.
              <Tr key={row.id || rowIndex} _hover={{ bg: rowHoverBg }}>
                {columns.map((col) => (
                  <Td key={`${rowIndex}-${col.accessor}`} textAlign="center">
                    {/* Renderizado especial para valores booleanos para mayor claridad. */}
                    {typeof row[col.accessor] === 'boolean'
                      ? row[col.accessor] ? 'Sí' : 'No'
                      : row[col.accessor] || '-'}
                  </Td>
                ))}
                {/* El contenedor de acciones solo se renderiza si es necesario. */}
                {(onView || onEdit || onDelete || renderActions) && (
                  <Td textAlign="center">
                    <Flex align="center" justify="center">
                      {onView && (
                        <Tooltip label="Visualizar" aria-label="Visualizar">
                          <IconButton
                            icon={<ViewIcon />}
                            size="sm"
                            colorScheme="blue"
                            onClick={() => onView(row)}
                            mr={2}
                          />
                        </Tooltip>
                      )}
                      {onEdit && (
                        <Tooltip label="Editar" aria-label="Editar">
                          <IconButton
                            icon={<EditIcon />}
                            size="sm"
                            colorScheme="yellow"
                            onClick={() => onEdit(row)}
                            mr={2}
                          />
                        </Tooltip>
                      )}
                      {onDelete && (
                        <Tooltip label="Eliminar" aria-label="Eliminar">
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            colorScheme="red"
                            onClick={() => onDelete(row)}
                          />
                        </Tooltip>
                      )}
                      {/* Permite renderizar botones de acción adicionales o personalizados. */}
                      {renderActions && renderActions(row)}
                    </Flex>
                  </Td>
                )}
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default GenericTable;