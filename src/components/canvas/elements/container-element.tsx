'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CommonElementProps,
  ContainerContent,
  CanvasElementProperties,
  WithId,
  CanvasElement,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { GripVertical, X, Paintbrush, Columns2, Link as LinkIcon, Move, Minus, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAutoSave } from '@/hooks/use-auto-save';
import { SaveStatusIndicator } from '@/components/canvas/save-status-indicator';
// import { useDictationBinding } from '@/hooks/use-dictation-binding';

// Paletas expandidas con texto oscuro del mismo tono (NO usar negro)
const EXTENDED_PALETTES = {
  // Pasteles clásicos
  yellow: { bg: '#FFF9C4', text: '#7D6608', name: 'Amarillo' },
  pink: { bg: '#F8BBD9', text: '#880E4F', name: 'Rosa' },
  blue: { bg: '#B3E5FC', text: '#01579B', name: 'Azul' },
  green: { bg: '#C8E6C9', text: '#1B5E20', name: 'Verde' },
  orange: { bg: '#FFE0B2', text: '#E65100', name: 'Naranja' },
  purple: { bg: '#E1BEE7', text: '#4A148C', name: 'Morado' },

  // Tierra
  sage: { bg: '#D7E4C0', text: '#3D5C2E', name: 'Salvia' },
  terracotta: { bg: '#FFCCBC', text: '#BF360C', name: 'Terracota' },
  sand: { bg: '#FFF3E0', text: '#8D6E63', name: 'Arena' },
  coffee: { bg: '#D7CCC8', text: '#4E342E', name: 'Café' },

  // Océano
  seafoam: { bg: '#B2DFDB', text: '#004D40', name: 'Espuma' },
  coral: { bg: '#FFAB91', text: '#D84315', name: 'Coral' },
  navy: { bg: '#90CAF9', text: '#0D47A1', name: 'Marino' },
  aqua: { bg: '#80DEEA', text: '#006064', name: 'Aqua' },

  // Sofisticados
  lavender: { bg: '#D1C4E9', text: '#311B92', name: 'Lavanda' },
  mint: { bg: '#A5D6A7', text: '#2E7D32', name: 'Menta' },
  peach: { bg: '#FFCCBC', text: '#E64A19', name: 'Durazno' },
  rose: { bg: '#F48FB1', text: '#AD1457', name: 'Rosa Fuerte' },
  // Nuevos
  limeOlive: { bg: '#C2D96A', text: '#2F3A11', name: 'Lima Oliva' },
  brick: { bg: '#DB6441', text: '#4A1C0F', name: 'Ladrillo' },
  sky: { bg: '#42B0DB', text: '#0A3A52', name: 'Cielo' },
  aquaSoft: { bg: '#9ED5DE', text: '#0E3C46', name: 'Aqua' },
  lavenderSoft: { bg: '#CEC5DB', text: '#3A3046', name: 'Lavanda Suave' },
  sand: { bg: '#DBD393', text: '#4A4320', name: 'Arena' },
  amber: { bg: '#E09D22', text: '#4A2F00', name: 'Ámbar' },
  chartreuse: { bg: '#B8E100', text: '#2E3B00', name: 'Chartreuse' },
  ocean: { bg: '#1D93CE', text: '#062C3E', name: 'Océano' },

  // Colores adicionales de otras paletas
  calypso: { bg: '#CAE3E1', text: '#2C3E3D', name: 'Calipso' },
  lightYellow: { bg: '#FEF08A', text: '#7C4A03', name: 'Amarillo Claro' },
  lightBlue: { bg: '#DBEAFE', text: '#1E3A8A', name: 'Azul Claro' },
  lightGreen: { bg: '#DCFCE7', text: '#14532D', name: 'Verde Claro' },
  lightPink: { bg: '#FCE7F3', text: '#831843', name: 'Rosa Claro' },
  lightGray: { bg: '#F3F4F6', text: '#374151', name: 'Gris Claro' },
  lightRose: { bg: '#FCE4EC', text: '#9D174D', name: 'Rosa Suave' },
  skyLight: { bg: '#E0F2FE', text: '#0C4A6E', name: 'Cielo Claro' },
  skyVeryLight: { bg: '#F0F9FF', text: '#0F172A', name: 'Cielo Muy Claro' },
  emeraldVeryLight: { bg: '#ECFDF5', text: '#064E3B', name: 'Esmeralda Muy Claro' },
};

function isContainerContent(content: unknown): content is ContainerContent {
  return typeof content === 'object' && content !== null && 'elementIds' in content;
}

interface ElementCard {
  elementId: string;
  element: WithId<CanvasElement>;
}

export default function ContainerElement(
  props: CommonElementProps & { unanchorElement?: (id: string) => void }
) {
  const {
    id,
    properties,
    isSelected,
    onSelectElement,
    onEditElement,
    content,
    onUpdate,
    deleteElement,
    allElements = [],
    unanchorElement,
    isPreview,
    minimized,
    isListening,
    finalTranscript,
    interimTranscript,
  } = props;

  const safeProperties: CanvasElementProperties =
    typeof properties === 'object' && properties !== null ? properties : {};

  const defaultLayout = content && typeof content === 'object' && (content as any).layout === 'two-columns'
    ? 'two-columns'
    : props.type === 'two-columns'
      ? 'two-columns'
      : 'single';

  const containerContent: ContainerContent = isContainerContent(content)
    ? { ...content, layout: content.layout || defaultLayout }
    : { title: 'Nuevo Contenedor', elementIds: [], layout: defaultLayout };

  const backgroundColor = safeProperties.backgroundColor || '#ffffff';
  const layout = containerContent.layout || 'single';
  const [isDragOver, setIsDragOver] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevZRef = useRef<number | null>(null);
  // const { bindDictationTarget } = useDictationBinding({
  //   isListening,
  //   finalTranscript,
  //   interimTranscript,
  //   isSelected,
  // });

  // Handler para recibir elementos arrastrados
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Obtener el ID del elemento arrastrado
    const elementId = e.dataTransfer.getData('application/element-id');
    if (!elementId) return;
    
    // Verificar que el elemento existe y no es el mismo contenedor
    const element = allElements.find(el => el.id === elementId);
    if (!element || element.id === id) return;
    
    // Agregar el elemento al contenedor
    if (!containerContent.elementIds.includes(elementId)) {
      const newElementIds = [...containerContent.elementIds, elementId];
      onUpdate(id, { content: { ...containerContent, elementIds: newElementIds } });
      
      // Ocultar el elemento original del canvas
      onUpdate(elementId, { parentId: id, hidden: true });
    }
  }, [id, containerContent, allElements, onUpdate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // Regla: al seleccionar, traer al frente; al deseleccionar, volver a z original
  useEffect(() => {
    const currentZ = (safeProperties as any)?.zIndex ?? -1;
    if (isSelected) {
      if (prevZRef.current === null) prevZRef.current = currentZ;
      if (currentZ !== 9999) {
        onUpdate(id, { zIndex: 9999, properties: { ...(properties || {}), zIndex: 9999 } });
      }
    } else {
      if (prevZRef.current !== null && currentZ !== prevZRef.current) {
        onUpdate(id, { zIndex: prevZRef.current, properties: { ...(properties || {}), zIndex: prevZRef.current } });
      }
      prevZRef.current = null;
    }
  }, [isSelected, id, onUpdate, properties, safeProperties]);

  const containedElements: ElementCard[] = containerContent.elementIds
    .map((elementId) => {
      const element = allElements.find((el) => el.id === elementId);
      return element ? { elementId, element } : null;
    })
    .filter((card): card is ElementCard => card !== null);

  const { saveStatus: titleSaveStatus, handleBlur: handleTitleBlur, handleChange: handleTitleChange } =
    useAutoSave({
      getContent: () => titleInputRef.current?.value || containerContent.title || '',
      onSave: async (newTitle) => {
        if (newTitle !== containerContent.title) {
          onUpdate(id, { content: { ...containerContent, title: newTitle } });
        }
      },
      debounceMs: 1000,
    });

  const handleColorChange = useCallback(
    (colorKey: { hex: string }) => {
      const selectedPalette = EXTENDED_PALETTES[colorKey.hex as keyof typeof EXTENDED_PALETTES];
      if (selectedPalette) {
        onUpdate(id, {
          properties: {
            ...safeProperties,
            backgroundColor: selectedPalette.bg,
          },
        });
      }
    },
    [id, safeProperties, onUpdate]
  );

  const handleLayoutToggle = useCallback(() => {
    const newLayout = layout === 'single' ? 'two-columns' : 'single';
    onUpdate(id, { content: { ...containerContent, layout: newLayout } });
  }, [id, containerContent, layout, onUpdate]);

  const handleClose = useCallback(() => {
    onUpdate(id, { hidden: true });
  }, [id, onUpdate]);

  const handleReleaseElement = useCallback(
    (elementId: string) => {
      const newElementIds = containerContent.elementIds.filter((eid) => eid !== elementId);
      onUpdate(id, { content: { ...containerContent, elementIds: newElementIds } });

      const containerPosition = safeProperties.position || { x: 0, y: 0 };
      const containerSize = safeProperties.size || { width: 378, height: 567 };
      const releasedElement = allElements.find((el) => el.id === elementId);
      if (releasedElement) {
        const releasePosition = {
          x:
            containerPosition.x +
            (typeof containerSize.width === 'number'
              ? containerSize.width
              : parseInt(String(containerSize.width))) +
            20,
          y: containerPosition.y,
        };

        const releasedProps =
          typeof releasedElement.properties === 'object' && releasedElement.properties !== null
            ? releasedElement.properties
            : {};

        const props = {
          ...releasedProps,
          position: releasePosition,
          relativePosition: null,
        };

        // Limpiar undefined antes de enviar
        Object.keys(props).forEach((k) => {
          if (props[k as keyof typeof props] === undefined) {
            delete (props as any)[k];
          }
        });

        onUpdate(elementId, {
          parentId: null,
          hidden: false,
          x: releasePosition.x,
          y: releasePosition.y,
          properties: props,
        });
      }
    },
    [id, containerContent, allElements, onUpdate, unanchorElement, safeProperties]
  );

  const getElementName = (element: WithId<CanvasElement>): string => {
    if (element.type === 'text') {
      return typeof element.content === 'string' ? element.content.substring(0, 30) : 'Texto';
    }
    if (element.type === 'sticky') {
      return typeof element.content === 'string' ? element.content.substring(0, 30) : 'Nota';
    }
    if (element.type === 'notepad' || element.type === 'yellow-notepad') {
      const notepadContent = element.content as any;
      return notepadContent?.title || 'Cuaderno';
    }
    if (element.type === 'todo') {
      const todoContent = element.content as any;
      return todoContent?.title || 'Lista de Tareas';
    }
    if (element.type === 'image') {
      return 'Imagen';
    }
    return element.type.charAt(0).toUpperCase() + element.type.slice(1);
  };

  const getElementThumbnail = (element: WithId<CanvasElement>): React.ReactNode => {
    const size =
      typeof element.properties === 'object' && element.properties !== null && element.properties.size
        ? element.properties.size
        : { width: element.width || 100, height: element.height || 100 };

    const elementWidth = typeof size.width === 'number' ? size.width : parseInt(String(size.width));
    const elementHeight = typeof size.height === 'number' ? size.height : parseInt(String(size.height));

    const maxThumbnailSize = 100;
    const aspectRatio = elementWidth / elementHeight;
    let thumbWidth = maxThumbnailSize;
    let thumbHeight = maxThumbnailSize;

    if (aspectRatio > 1) {
      thumbHeight = maxThumbnailSize / aspectRatio;
    } else {
      thumbWidth = maxThumbnailSize * aspectRatio;
    }

    if (element.type === 'image') {
      const imageContent = element.content as any;
      return (
        <div className="relative w-full h-full rounded overflow-hidden bg-gray-100">
          <img
            src={imageContent?.url || ''}
            alt="Preview"
            className="w-full h-full object-cover"
            style={{ width: thumbWidth, height: thumbHeight }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    if (element.type === 'sticky') {
      const stickyColor = (element.properties as any)?.color || element.color || 'yellow';
      const colorMap: Record<string, string> = {
        yellow: '#fffb8b',
        pink: '#ffc2d4',
        blue: '#bce8f1',
        green: '#d4edda',
        orange: '#ffeeba',
        purple: '#e9d5ff',
      };
      const colorHex = colorMap[stickyColor] || (String(stickyColor).startsWith('#') ? String(stickyColor) : '#fffb8b');
      const stickyText = typeof element.content === 'string' ? element.content.substring(0, 50) : 'Nota';
      return (
        <div
          className="w-full h-full rounded p-2 text-xs overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: colorHex, minHeight: thumbHeight }}
        >
          <p className="line-clamp-3 text-center">{stickyText}</p>
        </div>
      );
    }

    if (element.type === 'text') {
      const textContent = typeof element.content === 'string' ? element.content.substring(0, 100) : 'Texto';
      return (
        <div className="w-full h-full rounded p-2 bg-white border border-gray-200 flex items-center justify-center text-xs text-gray-600">
          <p className="line-clamp-4 text-center">{textContent}</p>
        </div>
      );
    }

    if (element.type === 'notepad' || element.type === 'yellow-notepad') {
      const notepadContent = element.content as any;
      const title = notepadContent?.title || 'Cuaderno';
      const preview =
        (Array.isArray(notepadContent?.pages) && notepadContent.pages[0]) ||
        notepadContent?.content ||
        notepadContent?.text ||
        '';
      return (
        <div className="w-full h-full rounded p-2 bg-white border border-gray-200 flex flex-col">
          <div className="font-semibold text-xs mb-1 truncate">{title}</div>
          <div className="text-xs text-gray-500 line-clamp-2">{String(preview).substring(0, 80)}</div>
        </div>
      );
    }

    if (element.type === 'comment' || element.type === 'comment-small') {
      const c = (element.content || {}) as any;
      const text = c?.text || c?.label || c?.title || 'Comentario';
      return (
        <div className="w-full h-full rounded p-2 bg-white border border-gray-200 flex items-center justify-center">
          <p className="text-xs text-gray-600 line-clamp-3 text-center">{String(text)}</p>
        </div>
      );
    }

    if (
      element.type === 'photo-grid' ||
      element.type === 'photo-grid-horizontal' ||
      element.type === 'photo-grid-adaptive'
    ) {
      const grid = (element.content || {}) as any;
      const title = grid?.title || 'Guía Fotos';
      const rows = grid?.rows || 0;
      const cols = grid?.columns || 0;
      const count = Array.isArray(grid?.cells) ? grid.cells.filter((c: any) => c?.url).length : 0;
      return (
        <div className="w-full h-full rounded p-2 bg-white border border-gray-200 flex flex-col items-center justify-center text-center">
          <div className="text-[10px] font-semibold text-gray-700 truncate">{title}</div>
          <div className="text-[10px] text-gray-500"> {rows} x {cols}</div>
          <div className="text-[10px] text-gray-500">{count} imgs</div>
        </div>
      );
    }

    if (element.type === 'todo') {
      const todoContent = element.content as any;
      const items = todoContent?.items || [];
      const completedCount = items.filter((item: any) => item && item.completed).length;
      return (
        <div className="w-full h-full rounded p-2 bg-white border border-gray-200 flex flex-col">
          <div className="font-semibold text-xs mb-1">{todoContent?.title || 'Lista'}</div>
          <div className="text-xs text-gray-500">
            {completedCount}/{items.length} completadas
          </div>
        </div>
      );
    }

    return (
      <div
        className="bg-gradient-to-br from-gray-100 to-gray-200 rounded flex flex-col items-center justify-center text-xs text-gray-500 p-2"
        style={{ minHeight: thumbHeight }}
      >
        <div className="text-lg mb-1">{element.type.charAt(0).toUpperCase()}</div>
        <div className="text-center capitalize">{element.type}</div>
      </div>
    );
  };

  // Toggle minimize (copiado del notepad)
  const toggleMinimize = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isPreview) return;

    const isCurrentlyMinimized = !!minimized;
    const currentSize = (properties as CanvasElementProperties)?.size || { width: 378, height: 567 };

    // Convertir currentSize a valores numéricos para originalSize
    const currentSizeNumeric = {
      width: typeof currentSize.width === 'number' ? currentSize.width : parseFloat(String(currentSize.width)) || 378,
      height: typeof currentSize.height === 'number' ? currentSize.height : parseFloat(String(currentSize.height)) || 567,
    };

    if (isCurrentlyMinimized) {
        // Restaurar: recuperar tamaño original
        const { originalSize, ...restProps } = (properties || {}) as Partial<CanvasElementProperties>;
        const restoredSize = originalSize || { width: 378, height: 567 };
        const newProperties: Partial<CanvasElementProperties> = {
          ...restProps,
          size: restoredSize
        };

        onUpdate(id, {
            minimized: false,
            properties: newProperties,
        });
    } else {
        // Minimizar: guardar tamaño actual y reducir altura
        const currentWidth = typeof currentSize.width === 'number' ? currentSize.width : parseFloat(String(currentSize.width)) || 378;
        onUpdate(id, {
            minimized: true,
            properties: {
              ...properties,
              size: { width: currentWidth, height: 48 },
              originalSize: currentSizeNumeric
            },
        });
    }
  }, [isPreview, minimized, properties, onUpdate, id]);

  return (
    <Card
      id={id}
      data-element-type="container"
      data-element-id={id}
      ref={containerRef}
      className={cn(
        'w-full h-full flex flex-col overflow-hidden',
        'min-w-[200px] min-h-[300px]',
        'rounded-lg shadow-lg border border-gray-200/50',
        isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
        isDragOver && 'ring-2 ring-green-500 ring-offset-2 bg-green-50/50',
        'hover:shadow-xl transition-shadow'
      )}
      style={{
        backgroundColor: backgroundColor === 'transparent' ? '#ffffff' : backgroundColor,
        pointerEvents: 'auto',
      }}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('.drag-handle')) {
          onEditElement(id);
        }
      }}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
          return;
        }
        e.stopPropagation();
        onSelectElement(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CardHeader className="p-3 border-b border-gray-200 bg-white flex flex-row items-center justify-between group/header">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="drag-handle cursor-grab active:cursor-grabbing flex-shrink-0">
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          <input
            ref={titleInputRef}
            type="text"
            value={containerContent.title || ''}
            onChange={(e) => {
              handleTitleChange();
              const newContent: ContainerContent = { ...containerContent, title: e.target.value };
              onUpdate(id, { content: newContent });
            }}
            onBlur={handleTitleBlur}
            className="flex-1 min-w-0 text-sm font-semibold bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-1"
            placeholder="Título del contenedor..."
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onFocus={(e) => {}}
          />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <SaveStatusIndicator status={titleSaveStatus} size="sm" />

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={layout === 'single' ? 'Dividir en dos columnas' : 'Una sola columna'}
            onClick={(e) => {
              e.stopPropagation();
              handleLayoutToggle();
            }}
          >
            <Columns2 className={cn('h-4 w-4', layout === 'two-columns' && 'text-blue-600')} />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Cambiar color de fondo"
                onClick={(e) => e.stopPropagation()}
              >
                <Paintbrush className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              onClick={(e) => e.stopPropagation()}
              className="w-auto p-3 border-none bg-white shadow-xl rounded-xl"
            >
              <div className="grid grid-cols-6 gap-2">
                {Object.entries(EXTENDED_PALETTES).map(([key, palette]) => (
                  <button
                    key={key}
                    onClick={() => handleColorChange({ hex: key })}
                    className={cn(
                      'w-8 h-8 rounded-lg shadow-sm hover:scale-110 transition-transform flex items-center justify-center text-xs font-bold',
                      backgroundColor === palette.bg && 'ring-2 ring-offset-1 ring-gray-800 scale-110'
                    )}
                    style={{
                      backgroundColor: palette.bg,
                      color: palette.text,
                      border: `1px solid ${palette.text}30`
                    }}
                    title={palette.name}
                  >
                    Aa
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Botón minimizar */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title={minimized ? "Maximizar" : "Minimizar"}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); toggleMinimize(e); }}
          >
            {minimized ? <Maximize className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            title="Cerrar contenedor"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex-1 p-3 overflow-y-auto",
          isDragOver && "bg-green-50/30"
        )}
        style={{ minHeight: 0 }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {containedElements.length === 0 ? (
          <div className={cn(
            "flex flex-col items-center justify-center h-full text-sm text-gray-400 border-2 border-dashed rounded-lg transition-colors",
            isDragOver ? "border-green-400 bg-green-50/50 text-green-600" : "border-gray-200"
          )}>
            <Move className="w-8 h-8 mb-2 opacity-50" />
            <span>{isDragOver ? "Suelta aquí para agregar" : "Arrastra elementos aquí"}</span>
          </div>
        ) : (
          <div className={cn('grid gap-3', layout === 'two-columns' ? 'grid-cols-2' : 'grid-cols-1')}>
            {containedElements.map(({ elementId, element }) => (
              <div
                key={elementId}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex flex-col gap-2 group/card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-center bg-gray-50 rounded p-2 min-h-[80px]">
                  {getElementThumbnail(element)}
                </div>

                <div className="text-xs font-medium text-gray-700 truncate">{getElementName(element)}</div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 self-end opacity-0 group-hover/card:opacity-100 transition-opacity"
                  title="Soltar elemento del contenedor"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReleaseElement(elementId);
                  }}
                >
                  <LinkIcon className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
