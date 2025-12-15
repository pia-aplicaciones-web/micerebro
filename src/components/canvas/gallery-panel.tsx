// src/components/canvas/gallery-panel.tsx
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardHeader } from '@/components/ui/card';
import type { CanvasElement, ContainerContent, WithId, CommonElementProps } from '@/lib/types';
import { GripVertical, Maximize, Minus, Trash2, Unlink, Eye, EyeOff, Pin, PinOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Rnd } from 'react-rnd';

// CRÍTICO: IMPORTACIONES DIRECTAS - Cambiar de lazy a imports directos para evitar problemas con chunks de webpack
// Esto previene errores como "Cannot find module './586.js'" durante desarrollo
import ElementCardContent from './element-card-content';
import ElementCardDetails from './element-card-details';

interface GalleryPanelProps {
  allElements: WithId<CanvasElement>[];
  onUpdate: (id: string, updates: Partial<CanvasElement>) => void;
  onDelete: (id: string) => void;
  onLocateElement: (id: string) => void;
  onEditElement: (id: string) => void;
  onActivateDrag: (id: string) => void;
  activatedElementId: string | null;
  unanchorElement: (id: string) => void;
  onClose?: () => void;
}

const dummyFunction = () => { /* noop */ };

export default function GalleryPanel({
  allElements,
  onUpdate,
  onDelete,
  onLocateElement,
  onEditElement,
  onActivateDrag,
  activatedElementId,
  unanchorElement,
  onClose,
}: GalleryPanelProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 20 });
  const [windowHeight, setWindowHeight] = useState(800);

  // Elementos visibles en el canvas (no ocultos)
  const visibleElements = useMemo(() => {
    return allElements.filter((el) => !el.hidden && el.type !== 'container' && el.type !== 'two-columns');
  }, [allElements]);

  // Elementos ocultos/cerrados
  const hiddenElements = useMemo(() => {
    return allElements.filter((el) => el.hidden === true);
  }, [allElements]);

  const handlePin = () => {
    setIsPinned(!isPinned);
  };

  const handleUnanchor = (elementId: string) => {
    unanchorElement(elementId);
  };

  // Posición inicial en el lado izquierdo y altura de ventana
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const leftX = 0; // Pegado al lado izquierdo
      setPosition({ x: leftX, y: 20 });
      setWindowHeight(window.innerHeight);

      const handleResize = () => {
        setWindowHeight(window.innerHeight);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  return (
    <div className="fixed left-0 top-0 bottom-0 z-[1000] flex items-stretch">
      <Rnd
        position={position}
        onDragStop={(e, d) => {
          if (!isPinned) {
            setPosition({ x: Math.max(0, d.x), y: d.y });
          }
        }}
        size={{ width: 300, height: windowHeight }}
        minWidth={250}
        minHeight={400}
        maxWidth={400}
        maxHeight={windowHeight}
        bounds="window"
        dragHandleClassName="gallery-drag-handle"
        enableResizing={true}
        className={cn(
          "bg-slate-900/95 backdrop-blur border-r border-slate-700 shadow-2xl flex flex-col overflow-hidden",
          activatedElementId && "ring-2 ring-blue-500 ring-offset-2",
          isPinned && "pointer-events-none"
        )}
        style={{ zIndex: 1000, height: '100vh' }}
      >
        {/* Header con fondo verde */}
        <CardHeader className="flex flex-row items-center justify-between p-3 cursor-grab gallery-drag-handle bg-green-500 border-b border-green-600">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-white" />
            <h3 className="font-semibold text-sm text-white">🖼️ Galería</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-white" title="Elementos visibles" />
              <span className="text-xs text-white/90">{visibleElements.length}</span>
              {hiddenElements.length > 0 && (
                <>
                  <div className="w-2 h-2 rounded-full bg-white/70 ml-2" title="Elementos ocultos" />
                  <span className="text-xs text-white/90">{hiddenElements.length}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-green-600 text-white"
              onClick={handlePin}
              title={isPinned ? "Desanclar panel" : "Anclar panel"}
            >
              {isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 hover:bg-green-600 text-white"
              onClick={onClose}
              title="Cerrar galería"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

      {/* Content */}
      <div className="flex-grow p-3 overflow-y-auto space-y-3">
          {/* Elementos Visibles */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-green-400" />
              <h4 className="text-sm font-medium text-white">Elementos Visibles</h4>
            </div>
            {visibleElements.length === 0 ? (
              <p className="text-slate-400 text-center text-sm py-4">No hay elementos visibles</p>
            ) : (
              <div className="grid gap-2 grid-cols-1">
                {visibleElements.map((element) => (
                  <Card
                    key={element.id}
                    className={cn(
                      "p-2 bg-slate-800/50 border border-slate-600 hover:bg-slate-700/50 transition-colors cursor-pointer",
                      activatedElementId === element.id && "ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900"
                    )}
                    onMouseDown={(e) => { e.stopPropagation(); onEditElement(element.id); }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onLocateElement(element.id);
                    }}
                  >
                    <div className="flex items-center justify-between text-sm text-slate-300 mb-1">
                      <span className="capitalize text-xs">{element.type}</span>
                      <div className="flex gap-1">
                        {element.color && (
                          <div
                            className="w-3 h-3 rounded-full border border-slate-500"
                            style={{ backgroundColor: element.color }}
                            title={`Color: ${element.color}`}
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-slate-600 text-slate-400"
                          onClick={(e) => { e.stopPropagation(); handleUnanchor(element.id); }}
                          title="Liberar elemento"
                        >
                          <Unlink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-red-600 text-red-400"
                          onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
                          title="Eliminar elemento"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <ElementCardContent
                      element={element}
                      onUpdate={onUpdate}
                      onEditComment={dummyFunction}
                      onOpenNotepad={dummyFunction}
                      onLocateElement={onLocateElement}
                    />
                    <ElementCardDetails
                      element={element}
                      onUpdate={onUpdate}
                      onLocateElement={onLocateElement}
                    />
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Elementos Ocultos */}
          {hiddenElements.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="h-4 w-4 text-gray-400" />
                <h4 className="text-sm font-medium text-slate-300">Elementos Ocultos</h4>
              </div>
              <div className="grid gap-2 grid-cols-1">
                {hiddenElements.map((element) => (
                  <Card
                    key={element.id}
                    className="p-2 bg-slate-800/30 border border-slate-600 hover:bg-slate-700/30 transition-colors cursor-pointer opacity-75"
                    onClick={() => onUpdate(element.id, { hidden: false })}
                  >
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span className="capitalize text-xs">{element.type} (oculto)</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 hover:bg-red-600 text-red-400"
                        onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
                        title="Eliminar elemento"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </Rnd>
    </div>
  );
}