// @ts-nocheck
'use client';

import React, { useState, useEffect, useMemo, forwardRef } from 'react';
import { Rnd } from 'react-rnd';
import { useRouter } from 'next/navigation';
import {
  BookCopy,
  RectangleHorizontal,
  StickyNote,
  Wrench,
  ImageIcon,
  FileText,
  Link,
  MoreHorizontal,
  Mic,
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
} from 'lucide-react';
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
  // Detectar si es el botón de dictado activo (tiene bg-red-500 en className)
  const isDictationActive = className?.includes('bg-red-500');
  
  return (
    <Button
      ref={ref}
      variant="ghost"
      className={cn(
        'flex flex-col items-center justify-center h-auto py-2 px-2 w-full text-[11px] gap-1',
        'hover:bg-white/20 focus-visible:bg-white/20',
        'text-white border border-white',
        isActive && 'bg-white/30 text-white hover:bg-white/40',
        !isDictationActive && 'text-white',
        className
      )}
      style={{
        backgroundColor: isDictationActive ? undefined : (isActive ? 'rgba(255, 255, 255, 0.3)' : 'transparent'),
        color: isDictationActive ? undefined : '#FFFFFF',
        border: '1px solid #FFFFFF',
      }}
      {...props}
    >
      {children || (Icon && <Icon className={cn('size-[18px]', isDictationActive ? 'text-white' : 'text-white')} style={isDictationActive ? undefined : { color: '#FFFFFF' }} />)}
      <span className={cn('mt-0.5 text-center leading-tight text-[9px]', isDictationActive ? 'text-white' : 'text-white')} style={isDictationActive ? undefined : { color: '#FFFFFF', fontSize: '9px' }}>
        {label}
      </span>
    </Button>
  );
});
SidebarButton.displayName = 'SidebarButton';


type ToolsSidebarProps = {
  elements: WithId<CanvasElement>[];
  boards: WithId<Board>[];
  onUploadImage: () => void;
  onAddImageFromUrl: () => void;
  onPanToggle: () => void;
  isListening?: boolean;
  onToggleDictation?: () => void;
  onRenameBoard: () => void;
  onDeleteBoard: () => void;
  onOpenNotepad: (id: string) => void;
  onLocateElement: (id: string) => void;
  onAddComment?: () => void;
  onOpenGlobalSearch?: () => void;
  addElement: (type: ElementType, props?: any) => Promise<string>;
  clearCanvas: () => void;
  onExportBoardToPng: () => void;
  onFormatToggle: () => void;
  isFormatToolbarOpen: boolean;
  isPanningActive?: boolean;
  updateElement?: (id: string, updates: Partial<CanvasElement>) => Promise<void> | void;
  selectedElementIds?: string[];
};

export default function ToolsSidebar(props: ToolsSidebarProps) {
  const {
    elements,
    boards,
    onUploadImage,
    onAddImageFromUrl,
    onPanToggle,
    isListening = false,
    onToggleDictation,
    onRenameBoard,
    onDeleteBoard,
    onOpenNotepad,
    onLocateElement,
    addElement,
    clearCanvas,
    onExportBoardToPng,
    onFormatToggle,
    isFormatToolbarOpen,
    isPanningActive = false,
    updateElement,
    selectedElementIds = [],
  } = props;

  const { user } = useAuthContext() as any;
  const { toast } = useToast();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isCreateBoardOpen, setIsCreateBoardOpen] = useState(false);
  const [rndPosition, setRndPosition] = useState({ x: 20, y: 80 });
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
    () => (Array.isArray(elements) ? elements : []).filter((el) => ['notepad', 'yellow-notepad', 'notes'].includes(el.type) && el.hidden !== true),
    [elements]
  );

  const allLocators = useMemo(
    () => (Array.isArray(elements) ? elements : []).filter((el) => el.type === 'locator'),
    [elements]
  );


  const hiddenNotepads = useMemo(
    () => (Array.isArray(elements) ? elements : []).filter((el) => el.type === 'notepad' && el.hidden === true),
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
          width: 144,
          height: 'auto',
        }}
        minWidth={144}
        maxWidth={144}
        bounds="window"
        dragHandleClassName="drag-handle"
        onDragStop={onDragStop}
        className="z-[10001]"
      >
        <div 
          className="rounded-lg shadow-lg border border-white/30 p-2 flex flex-col gap-1"
          style={{ backgroundColor: '#0b8384' }}
        >
          <div className="drag-handle cursor-grab active:cursor-grabbing py-1 flex justify-center">
            <GripVertical className="size-5" style={{ color: '#FFFFFF' }} />
          </div>
          <div className="grid grid-cols-2 gap-1">

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={LayoutDashboard} label="Tableros" />
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

          <SidebarButton
            icon={Mic}
            label={isListening ? 'Detener' : 'Dictar'}
            onClick={(e) => {
              e.preventDefault();
              if (onToggleDictation) {
                onToggleDictation();
              } else {
                toast({
                  variant: 'destructive',
                  title: 'Dictado no disponible',
                  description: 'No se encontró la acción de dictado.',
                });
              }
            }}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              isListening && 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
            )}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={BookCopy} label="Cuaderno" />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={StickyNote} label="Notas" />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MessageCircle} label="Burbuja" />
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="start" sideOffset={5}>
              {[
                { key: 'yellow', label: 'Amarillo pastel', backgroundColor: '#fff9c4' },
                { key: 'white', label: 'Blanco', backgroundColor: '#ffffff' },
              ].map((option) => (
                <DropdownMenuItem
                  key={option.key}
                  onClick={() =>
                    handleAddElement('comment-bubble', {
                      properties: { backgroundColor: option.backgroundColor },
                      content: { text: '' },
                    })
                  }
                >
                  <div
                    className="w-4 h-4 rounded-sm border border-slate-300 mr-2"
                    style={{ backgroundColor: option.backgroundColor }}
                  />
                  <span>{option.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MapPin} label="Localizador" />
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

          <SidebarButton icon={List} label="To-do" onClick={() => handleAddElement('todo')} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={CalendarRange} label="Mi Plan" />
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

          <SidebarButton icon={Wrench} label="Tools" onClick={onFormatToggle} isActive={isFormatToolbarOpen} />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={ImageIcon} label="Imagen" />
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

          <SidebarButton 
            icon={Images} 
            label="Moodboard" 
            onClick={() => handleAddElement('moodboard')} 
          />

          <SidebarButton 
            icon={Frame}
            label="Frame"
            onClick={() => handleAddElement('image-frame')}
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MessageCircle} label="Comentario" />
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton
                icon={Grid3X3}
                label="Guía Fotos"
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
            </DropdownMenuContent>
          </DropdownMenu>

          <SidebarButton
            icon={BookCopy}
            label="Revista"
            onClick={() => handleAddElement('magazine')}
          />

          <SidebarButton
            icon={Columns2}
            label="Contenedor"
            onClick={() => handleAddElement('container')}
          />



          <Popover>
            <PopoverTrigger asChild>
              <SidebarButton icon={FileText} label="Texto" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 m-2">
              <div className="text-xs text-gray-600 mb-2">Color de fondo</div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'white', value: '#ffffff', label: 'Blanco' },
                  { name: 'yellow', value: '#fffb8b', label: 'Amarillo' },
                  { name: 'pink', value: '#ffc2d4', label: 'Rosa' },
                  { name: 'blue', value: '#bce8f1', label: 'Azul' },
                  { name: 'green', value: '#d4edda', label: 'Verde' },
                  { name: 'orange', value: '#ffeeba', label: 'Naranja' },
                  { name: 'purple', value: '#e9d5ff', label: 'Morado' },
                ].map((color) => (
                  <button
                    key={color.name}
                    className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleAddElement('text', {
                      properties: {
                        backgroundColor: color.value
                      }
                    })}
                    title={color.label}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>


          {/* Temas, Redactor AI, Recordatorios, Ideas, Colores removidos */}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarButton icon={MoreHorizontal} label="Más" />
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
        </div>
      </Rnd>

    </>
  );
}
