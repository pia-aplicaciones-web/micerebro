// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { Rnd } from 'react-rnd';
import { useRouter } from 'next/navigation';
import { BookCopy,
  RectangleHorizontal,
  StickyNote,
  Wrench,
  ImageIcon,
  FileText,
  Link,
  MoreHorizontal,
  Move,
  GripVertical,
  Plus,
  Save,
  LogOut,
  Trash2,
  Upload,
  Link as LinkIcon,
  EyeOff,
  FileImage,
  Images,
  ChevronDown,
  MessageCircle,
  LayoutGrid,
  LayoutDashboard,
  List,
  CalendarRange,
  Palette,
  Columns2,
  MapPin,
  Frame,
  UtensilsCrossed,
  Grid3X3,
  Mic,
  MicOff
} from 'lucide-react';
import { useMoodboardStore } from '@/components/creative';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { ElementType, CanvasElement, Board, WithId, NotepadContent } from '@/lib/types';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import CreateBoardDialog from './create-board-dialog';
import { useMediaQuery } from '@/hooks/use-media-query';

const stickyNoteColors = [
  { name: 'yellow', label: 'Amarillo', className: 'bg-yellow-200' },
  { name: 'pink', label: 'Rosa', className: 'bg-pink-200' },
  { name: 'blue', label: 'Azul', className: 'bg-blue-200' },
  { name: 'green', label: 'Verde', className: 'bg-green-200' },
  { name: 'orange', label: 'Naranja', className: 'bg-orange-200' },
  { name: 'purple', label: 'Morado', className: 'bg-purple-200' },
];

const SidebarButton = forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button> & {
    label: string;
    icon?: React.ElementType;
    isActive?: boolean;
  }
>(({ label, icon: Icon, className, isActive, children, ...props }, ref) => {
  const isDictationActive = className?.includes('bg-red-500');
  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        'flex flex-col items-center justify-center h-auto py-[6px] px-[6px] min-w-[65px] text-[10px] gap-1',
        'hover:bg-gray-700 focus-visible:bg-gray-700',
        'text-white border border-gray-600 rounded-md',
        'bg-black',
        isActive && 'bg-gray-800 border-gray-500',
        !isDictationActive && 'text-white',
        className
      )}
      style={{
        backgroundColor: isDictationActive ? '#ef4444' : (isActive ? '#374151' : '#000000'),
        color: '#ffffff',
        border: `1px solid ${isDictationActive ? '#ef4444' : (isActive ? '#6b7280' : '#4b5563')}`,
      }}
      {...props}
    >
      {children || (Icon && <Icon className={cn('size-[16px] flex-shrink-0', isDictationActive ? 'text-white' : 'text-white')} style={isDictationActive ? undefined : { color: '#ffffff' }} />)}
      <span className={cn('text-center leading-tight text-[9px] truncate text-white', isDictationActive ? 'text-white' : 'text-white')} style={{ color: '#ffffff', fontSize: '9px' }}>
        {label}
      </span>
    </Button>
  );
});

SidebarButton.displayName = 'SidebarButton';

interface ToolsSidebarProps {
  elements: WithId<CanvasElement>[];
  boards: WithId<Board>[];
  onUploadImage: () => void;
  onAddImageFromUrl: () => void;
  onPanToggle: () => void;
  onRenameBoard: () => void;
  onDeleteBoard: () => void;
  isListening: boolean;
  onToggleDictation: () => void;
  onOpenNotepad: (id: string) => void;
  onLocateElement: (id: string) => void;
  onAddComment: () => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  selectedElementIds: string[];
  addElement: (type: ElementType, content?: any) => void;
  clearCanvas: () => void;
  onExportBoardToPng: () => void;
  onFormatToggle: () => void;
  isFormatToolbarOpen: boolean;
  onOpenGlobalSearch: () => void;
  canvasScrollPosition: number;
  canvasScale: number;
  isGalleryPanelOpen: boolean;
  onToggleGalleryPanel: () => void;
}

const ToolsSidebar = forwardRef<HTMLDivElement, ToolsSidebarProps>(({
  elements,
  boards,
  onUploadImage,
  onAddImageFromUrl,
  onPanToggle,
  onRenameBoard,
  onDeleteBoard,
  isListening,
  onToggleDictation,
  onOpenNotepad,
  onLocateElement,
  onAddComment,
  updateElement,
  selectedElementIds,
  addElement,
  clearCanvas,
  onExportBoardToPng,
  onFormatToggle,
  isFormatToolbarOpen,
  onOpenGlobalSearch,
  canvasScrollPosition,
  canvasScale,
  isGalleryPanelOpen,
  onToggleGalleryPanel,
}, ref) => {
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [rndPosition, setRndPosition] = useState(() => {
    // Posición inicial centrada en la parte superior
    if (typeof window !== 'undefined') {
      const centerX = (window.innerWidth - 750) / 2; // 750 es el ancho del menú
      return { x: Math.max(0, centerX), y: 20 };
    }
    return { x: 20, y: 20 };
  });
  useEffect(() => {
    try {
      const savedPosition = localStorage.getItem('toolsSidebarPosition');
      if (savedPosition) {
        setRndPosition(JSON.parse(savedPosition));
      }
    } catch (e) {
      console.error('Failed to load sidebar position from localStorage', e);
    }
  }, []);

  const onDragStop = (e: any, d: { x: number; y: number }) => {
    const newPosition = { x: d.x, y: d.y };
    setRndPosition(newPosition);
    try {
      localStorage.setItem('toolsSidebarPosition', JSON.stringify(newPosition));
    } catch (error) {
      console.error('Failed to save sidebar position to localStorage', error);
    }
  };

  const elementsOnCanvas = useMemo(
    () => (Array.isArray(elements) ? elements : []).filter((el) => ['notepad', 'yellow-notepad', 'notes', 'mini-notes', 'mini'].includes(el.type) && el.hidden !== true),
    [elements]
  );

  const allLocators = useMemo(
    () => (Array.isArray(elements) ? elements : []).filter((el) => el.type === 'locator'),
    [elements]
  );


  const hiddenNotepads = useMemo(
    () => (Array.isArray(elements) ? elements : []).filter((el) => ['notepad', 'yellow-notepad', 'mini-notes', 'mini'].includes(el.type) && el.hidden === true),
    [elements]
  );

  const handleAddElement = async (type: ElementType, props?: any) => {
    try {
      await addElement(type, props);
      toast({
        title: 'Elemento creado',
        description: `Se ha creado un nuevo ${type}.`,
      });
    } catch (error: any) {
      console.error(`Error al crear elemento ${type}:`, error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || `No se pudo crear el elemento ${type}.`,
      });
    }
  };

  // Helpers para mejoras
  const getViewportCenter = () => {
    const centerX = typeof window !== 'undefined' ? window.innerWidth / 2 : 500;
    const centerY = typeof window !== 'undefined' ? window.innerHeight / 2 : 400;
    return { centerX, centerY };
  };

  const getSelectedElementContent = () => {
    if (!selectedElementIds || selectedElementIds.length !== 1) return '';
    const el = elements.find(e => e.id === selectedElementIds[0]);
    if (!el) return '';
    if (el.type === 'notepad') {
      const content = el.content as any;
      if (content?.pages?.length) {
        const idx = content.currentPage || 0;
        return content.pages[idx] || '';
      }
      return content?.text || '';
    }
    if (el.type === 'text' || el.type === 'sticky') {
      return typeof el.content === 'string' ? el.content : '';
    }
    return '';
  };

  const handleTextEditorSave = async (newContent: string) => {
    return;
  };

  const handleSignOut = () => {
    toast({ variant: 'destructive', title: 'Cerrar sesión no disponible en este build' });
  };

  return (
    <>
      <CreateBoardDialog isOpen={isCreateBoardOpen} onOpenChange={setIsCreateBoardOpen} />
      <Rnd
        default={{
          x: rndPosition.x,
          y: rndPosition.y,
          width: 750,
          height: 80,
        }}
        minWidth={750}
        maxWidth={900}
        bounds="window"
        dragHandleClassName="drag-handle"
        onDragStop={onDragStop}
        className="z-[10001]"
      >
        <div className="flex flex-row gap-[3.5px] flex-nowrap justify-start p-2">
          <div className="drag-handle cursor-grab active:cursor-grabbing py-1 px-2 mr-2 rounded-md bg-black border border-gray-600 flex justify-center" title="Arrastrar menú">
            <GripVertical className="size-4 rotate-90 text-white" />
          </div>

          {/* Tableros */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={LayoutDashboard} label="Tableros" title="Gestionar tableros" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              <DropdownMenuItem onClick={() => setIsCreateBoardOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Tablero</span>
              </DropdownMenuItem>
              {boards.length > 0 && (
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <span>Abrir Tablero...</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {boards.map((board) => (
                      <DropdownMenuItem key={board.id} onClick={() => router.push(`/board/${board.id}`)}>
                        <span>{board.name || 'Sin nombre'}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Botón Dictar */}
          <SidebarButton
            icon={isListening ? MicOff : Mic}
            label={isListening ? 'Detener' : 'Dictar'}
            title={isListening ? 'Detener dictado por voz' : 'Iniciar dictado por voz'}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onToggleDictation) {
                onToggleDictation();
              }
            }}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              isListening && 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
            )}
          />

          {/* Cuaderno */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={BookCopy} label="Cuaderno" title="Gestionar cuadernos y notas" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              <DropdownMenuItem onClick={() => handleAddElement('notepad')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Agregar Cuaderno</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('yellow-notepad')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Cuaderno Amarillo</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('notes')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Agregar Apuntes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('mini-notes')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Mini Notes</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('mini')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Mini</span>
              </DropdownMenuItem>
              {elementsOnCanvas.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Elementos Abiertos ({elementsOnCanvas.length})</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {elementsOnCanvas.map((element) => {
                        let title = 'Sin título';
                        switch (element.type) {
                          case 'notepad':
                            const notepadContent = element.content as NotepadContent;
                            title = notepadContent?.title || 'Cuaderno';
                            break;
                          case 'yellow-notepad':
                            title = 'Cuaderno Amarillo';
                            break;
                          case 'notes':
                            title = 'Apuntes';
                            break;
                          case 'mini-notes':
                            title = 'Mini Notas';
                            break;
                          case 'mini':
                            title = 'Mini';
                            break;
                          default:
                            title = 'Elemento';
                        }
                        return (
                          <DropdownMenuItem key={element.id} onClick={() => onLocateElement(element.id)}>
                            <span>{title}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
              {hiddenNotepads.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Cerrados ({hiddenNotepads.length})</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {hiddenNotepads.map((notepad) => {
                        const content = notepad.content as NotepadContent;
                        const title = content?.title || 'Sin título';
                        return (
                          <DropdownMenuItem key={notepad.id} onClick={() => onOpenNotepad(notepad.id)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            <span>{title}</span>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={StickyNote} label="Notas" title="Crear notas adhesivas" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              {stickyNoteColors.map((color) => (
                <DropdownMenuItem key={color.name} onClick={() => handleAddElement('sticky', { color: color.name })}>
                  <div className={cn('w-4 h-4 rounded-sm mr-2 border border-slate-300', color.className)} />
                  <span className="capitalize">{color.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* To-do */}
          <SidebarButton icon={List} label="To-do" title="Crear lista de tareas" onClick={() => handleAddElement('todo')} />

          {/* Contenedor */}
          <SidebarButton
            icon={Columns2}
            label="Contenedor"
            title="Crear contenedor para elementos"
            onClick={() => handleAddElement('container')}
          />

          {/* Localizador */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MapPin} label="Localizador" title="Gestionar localizadores" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5} className="w-56">
              <DropdownMenuItem onClick={() => handleAddElement('locator')}>
                <Plus className="mr-2 h-4 w-4" />
                <span>Nuevo Localizador</span>
              </DropdownMenuItem>
              {allLocators.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-xs text-gray-500 font-medium">
                    Localizadores ({allLocators.length})
                  </div>
                  {allLocators.map((loc) => {
                    const label =
                      typeof loc.content === 'object' && loc.content && (loc.content as any).label
                        ? (loc.content as any).label
                        : 'Localizador';
                    return (
                      <DropdownMenuItem key={loc.id} onClick={() => onLocateElement(loc.id)}>
                        <MapPin className="mr-2 h-4 w-4 text-slate-600" />
                        <span className="truncate">{label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Imagen */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={ImageIcon} label="Imagen" title="Agregar imágenes" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              <DropdownMenuItem onClick={onAddImageFromUrl}>
                <LinkIcon className="mr-2 h-4 w-4" />
                <span>Desde URL</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUploadImage}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Subir</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mi Plan */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={CalendarRange} label="Mi Plan" title="Herramientas de planificación" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5} className="w-52">
              <DropdownMenuItem
                onClick={() => handleAddElement('weekly-planner')}
                className="flex items-start gap-3"
              >
                <CalendarRange className="h-4 w-4 mt-0.5 text-slate-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Plan Semanal</span>
                  <span className="text-xs text-slate-500">Vista completa de lunes a domingo</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleAddElement('weekly-menu')}
                className="flex items-start gap-3"
              >
                <UtensilsCrossed className="h-4 w-4 mt-0.5 text-teal-600" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">Menú Semanal</span>
                  <span className="text-xs text-slate-500">Planifica comidas de la semana</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Guía Fotos */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton
                icon={Grid3X3}
                label="Guía Fotos"
                title="Herramientas para organizar fotos"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5} className="w-44">
              <DropdownMenuItem onClick={() => handleAddElement('photo-grid')}>
                Cuadrada
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('photo-grid-horizontal')}>
                Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('photo-grid-adaptive')}>
                Adaptable
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('image-frame')}>
                Marco de fotos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Comentario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MessageCircle} label="Comentario" title="Agregar comentarios y texto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              <DropdownMenuLabel>Insertar</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAddElement('comment-bubble')}>
                Burbuja
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('text', {
                properties: { backgroundColor: '#ffffff' }
              })}>
                Texto
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddElement('comment-small')}>
                Nota
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Moodboard */}
          <SidebarButton 
            icon={Images} 
            label="Moodboard" 
            title="Crear tablero de inspiración"
            onClick={() => handleAddElement('moodboard')} 
          />

          {/* Galería */}
          <SidebarButton
            icon={LayoutGrid}
            label="Galería"
            title={isGalleryPanelOpen ? "Ocultar panel de galería" : "Mostrar panel de galería"}
            isActive={isGalleryPanelOpen}
            onClick={() => onToggleGalleryPanel?.()}
          />

          {/* Tools */}
          <SidebarButton icon={Wrench} label="Tools" title="Herramientas de formato" onClick={onFormatToggle} isActive={isFormatToolbarOpen} />

          {/* Más */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MoreHorizontal} label="Más" title="Más opciones" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              <DropdownMenuItem onClick={onFormatToggle}>
                <Wrench className="mr-2 h-4 w-4" />
                <span>Formato de Texto</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportBoardToPng}>
                <FileImage className="mr-2 h-4 w-4" />
                <span>Exportar a PNG: alta resolución</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Eliminar Tablero</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente este tablero y todo su contenido. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={onDeleteBoard}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, eliminar tablero
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Limpiar Tablero</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará todos los elementos del tablero. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={clearCanvas}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sí, limpiar tablero
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </Rnd>

    </>
  );
});

ToolsSidebar.displayName = 'ToolsSidebar';

export default ToolsSidebar;
