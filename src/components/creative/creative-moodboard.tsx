'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import dynamic from 'next/dynamic';
import {
  X,
  Upload,
  Trash2,
  Download,
  ImagePlus,
  Link as LinkIcon,
  Frame,
  MessageSquare,
  Minus,
  Plus,
  Maximize2,
  EyeOff,
  Eye,
  ExternalLink,
  BookCopy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useMoodboardStore, MoodboardImage } from './moodboard-store';
import IdeasPanel from './ideas-panel';
import html2canvas from 'html2canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const MoodboardPanel3 = dynamic(() => import('@/components/canvas/moodboard-panel3'), { ssr: false });

interface CreativeMoodboardProps {
  addElement?: (type: any, props?: any) => Promise<string>;
  onCreateMoodboard3?: () => void;
}

export default function CreativeMoodboard({ addElement, onCreateMoodboard3 }: CreativeMoodboardProps = {}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [panelSize, setPanelSize] = useState({ width: 760, height: 520 });
  const [panelPosition, setPanelPosition] = useState({ x: 100, y: 50 });
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isLinksOpen, setIsLinksOpen] = useState(true);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [links, setLinks] = useState<Array<{ id: string; title: string; url: string }>>([]);
  const [isMoodboard3Open, setIsMoodboard3Open] = useState(false);

  const {
    isOpen,
    ideasMinimized,
    closeMoodboard,
    deleteMoodboard,
    getActiveMoodboard,
    updateMoodboardName,
    updateIdeas,
    addImage,
    updateImage,
    removeImage,
    toggleIdeasMinimized,
  } = useMoodboardStore();

  const moodboard = getActiveMoodboard();

  // Util: cargar dimensiones y mantener proporción con límites compactos
  const loadDimensions = useCallback((src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const maxW = 200;
        const maxH = 200;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        resolve({
          width: Math.max(80, Math.round(img.width * scale)),
          height: Math.max(80, Math.round(img.height * scale)),
        });
      };
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  // Handle file upload (manteniendo proporción y compactando)
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            try {
              const src = e.target?.result as string;
              const { width, height } = await loadDimensions(src);
              addImage({
                src,
                x: Math.random() * 120 + 30,
                y: Math.random() * 120 + 30,
                width,
                height,
              });
            } catch (err) {
              console.error('Error loading image', err);
            } finally {
              resolve();
            }
          };
          reader.onerror = () => resolve();
          reader.readAsDataURL(file);
        });
      }
    },
    [addImage, loadDimensions]
  );

  // Handle image from URL (manteniendo proporción)
  const handleAddImageFromUrl = useCallback(async () => {
    if (!imageUrl.trim()) return;
    const src = imageUrl.trim();
    try {
      const { width, height } = await loadDimensions(src);
      addImage({
        src,
        x: Math.random() * 120 + 30,
        y: Math.random() * 120 + 30,
        width,
        height,
      });
      setImageUrl('');
      setShowUrlInput(false);
    } catch (err) {
      console.error('Error adding image from URL', err);
    }
  }, [imageUrl, addImage, loadDimensions]);

  // Links panel handlers
  const handleAddLink = useCallback(() => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    setLinks((prev) => [
      ...prev,
      { id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, title: linkTitle.trim(), url: linkUrl.trim() },
    ]);
    setLinkTitle('');
    setLinkUrl('');
  }, [linkTitle, linkUrl]);

  const handleRemoveLink = useCallback((id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    await handleFileUpload(e.dataTransfer.files);
  };

  // Export to PNG
  const handleExportPng = async () => {
    if (!canvasRef.current) return;
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
        logging: false,
        windowWidth: canvasRef.current.scrollWidth,
        windowHeight: canvasRef.current.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${moodboard?.name || 'moodboard'}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting moodboard:', error);
    }
  };

  // Delete selected image
  const handleDeleteSelected = () => {
    if (selectedImageId) {
      removeImage(selectedImageId);
      setSelectedImageId(null);
    }
  };

  if (!isOpen || !moodboard) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <Rnd
        size={panelSize}
        position={panelPosition}
        onDragStop={(e, d) => setPanelPosition({ x: d.x, y: d.y })}
        onResizeStop={(e, direction, ref, delta, position) => {
          setPanelSize({
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          setPanelPosition(position);
        }}
        minWidth={600}
        minHeight={400}
        bounds="window"
        dragHandleClassName="moodboard-drag-handle"
        className="pointer-events-auto"
      >
        <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden relative">
          {/* Botón eliminar siempre visible */}
          <button
            className="absolute top-2 right-2 z-30 bg-white border border-gray-200 rounded-full p-2 shadow hover:bg-red-50 text-red-500"
            title="Borrar moodboard"
            onClick={() => moodboard?.id && deleteMoodboard(moodboard.id)}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {!isHeaderHidden && (
            <div className="moodboard-drag-handle flex items-center justify-between px-3 py-2 bg-white border-b border-gray-200 cursor-grab active:cursor-grabbing text-sm">
              <div className="flex items-center gap-2">
                <Input
                  value={moodboard.name}
                  onChange={(e) => updateMoodboardName(e.target.value)}
                  className="border-0 bg-transparent font-medium text-gray-700 focus-visible:ring-0 focus-visible:ring-offset-0 w-48 h-8"
                  placeholder="Nombre del moodboard"
                />
              </div>
              <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 h-8 px-2">
                      <ImagePlus className="w-4 h-4 mr-1" />
                      Imagen
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir imagen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowUrlInput(true)}>
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Desde URL
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 h-8 px-2"
                  title="Frame pequeño (tablero)"
                  onClick={() => {
                    if (!addElement) return;
                    addElement('image-frame', { properties: { size: { width: 150, height: 120 } } });
                  }}
                >
                  <Frame className="w-4 h-4 mr-1" />
                  Frame
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 h-8 px-2"
                  title="Nota 10px (tablero)"
                  onClick={() => {
                    if (!addElement) return;
                    addElement('comment-small');
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Nota
                </Button>

                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 h-8 px-2" onClick={handleExportPng}>
                  <Download className="w-4 h-4 mr-1" />
                  PNG
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 h-8 px-2"
                  title="Caja de enlace"
                  onClick={() => setIsLinksOpen((v) => !v)}
                >
                  <BookCopy className="w-4 h-4 mr-1" />
                  Enlaces
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-800 h-8 px-2"
                  title="Abrir Moodboard3"
                  onClick={() => setIsMoodboard3Open((v) => !v)}
                >
                  <ImagePlus className="w-4 h-4 mr-1" />
                  Moodboard3
                </Button>
                {selectedImageId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="text-red-500 hover:text-red-600 h-8 px-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={closeMoodboard} className="text-gray-500 hover:text-gray-700 h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moodboard?.id && deleteMoodboard(moodboard.id)}
                  className="text-red-500 hover:text-red-600 h-8 w-8"
                  title="Borrar moodboard"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized((v) => !v)}
                  className="text-gray-500 hover:text-gray-700 h-8 w-8"
                  title={isMinimized ? 'Restaurar' : 'Minimizar panel'}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsHeaderHidden(true)}
                  className="text-gray-500 hover:text-gray-700 h-8 w-8"
                  title="Focus (ocultar header)"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
          {isHeaderHidden && (
            <div className="flex items-center justify-end px-2 py-1 bg-white border-b border-gray-200">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-600"
                title="Mostrar header"
                onClick={() => setIsHeaderHidden(false)}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* URL Input modal */}
          {showUrlInput && (
            <div className="absolute top-16 right-4 z-50 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="URL de la imagen..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddImageFromUrl();
                    if (e.key === 'Escape') setShowUrlInput(false);
                  }}
                  className="w-64"
                  autoFocus
                />
                <Button size="sm" onClick={handleAddImageFromUrl}>Agregar</Button>
                <Button size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Contenedor de enlaces dentro del lienzo */}
          {!isMinimized && (
            <div className="absolute bottom-3 right-3 w-52 max-h-48 bg-white border border-gray-200 rounded-lg shadow-md flex flex-col">
              <div className="px-2 py-1 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <span className="text-xs font-semibold text-gray-700">Enlaces</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsLinksOpen((v) => !v)}>
                  {isLinksOpen ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </Button>
              </div>
              {isLinksOpen && (
                <div className="p-2 space-y-2 overflow-y-auto flex-1">
                  {links.map((link) => (
                    <div key={link.id} className="p-2 border border-gray-200 rounded-md bg-gray-50">
                      <div className="text-[12px] font-semibold text-gray-800 truncate">{link.title || '(sin título)'}</div>
                      <div className="flex items-center justify-between mt-1">
                        <button
                          className="text-[11px] text-red-500 hover:text-red-600 inline-flex items-center gap-1"
                          onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')}
                          title={link.url}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Abrir
                        </button>
                        <button
                          className="text-[11px] text-gray-500 hover:text-gray-700"
                          onClick={() => handleRemoveLink(link.id)}
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ))}
                  {links.length === 0 && (
                    <div className="text-[11px] text-gray-400 text-center">Sin enlaces</div>
                  )}
                </div>
              )}
              <div className="p-2 border-t border-gray-200 bg-white space-y-1">
                <Input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Título"
                  className="h-8 text-xs"
                />
                <Input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="URL"
                  className="h-8 text-xs"
                />
                <Button size="sm" className="w-full text-xs" onClick={handleAddLink}>
                  Guardar
                </Button>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          {!isMinimized && (
            <div
              ref={canvasRef}
              className={cn(
                'flex-1 relative bg-[#FAFAFA] overflow-hidden',
                isDraggingOver && 'bg-blue-50 border-2 border-dashed border-blue-300'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => setSelectedImageId(null)}
            >
              {moodboard.images.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <Upload className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Arrastra imágenes aquí o usa Imagen</p>
                </div>
              )}

              {moodboard.images.map((img) => (
                <DraggableImage
                  key={img.id}
                  image={img}
                  isSelected={selectedImageId === img.id}
                  onSelect={() => setSelectedImageId(img.id)}
                  onUpdate={(updates) => updateImage(img.id, updates)}
                  onDelete={() => removeImage(img.id)}
                />
              ))}

              <IdeasPanel
                value={moodboard.ideas}
                onChange={updateIdeas}
                isMinimized={ideasMinimized}
                onToggleMinimize={toggleIdeasMinimized}
                textareaId="ideas-textarea"
              />
            </div>
          )}

          {/* Moodboard3 integrado dentro del panel Creative, a la derecha */}
          <div className="absolute top-0 right-0 h-full">
            <MoodboardPanel3
              isOpen={true}
              onToggle={() => setIsMoodboard3Open(!isMoodboard3Open)}
              onDragImageToCanvas={(imageUrl) => {
                addElement?.('image', { content: { url: imageUrl } });
              }}
              savedImages={[]}
              positioning="static"
              disableAnimation
              alwaysOpen
              showToggle={false}
            />
          </div>

        </div>
      </Rnd>
    </div>
  );
}

// Draggable Image Component
interface DraggableImageProps {
  image: MoodboardImage;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<MoodboardImage>) => void;
  onDelete: () => void;
}

function DraggableImage({
  image,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: DraggableImageProps) {
  return (
    <Rnd
      size={{ width: image.width, height: image.height }}
      position={{ x: image.x, y: image.y }}
      onDragStop={(e, d) => {
        onUpdate({ x: d.x, y: d.y });
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        onUpdate({
          width: parseInt(ref.style.width),
          height: parseInt(ref.style.height),
          x: position.x,
          y: position.y,
        });
      }}
      minWidth={50}
      minHeight={50}
      bounds="parent"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        'group',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
    >
      <div className="relative w-full h-full">
        <img
          src={image.src}
          alt=""
          className="w-full h-full object-contain rounded-lg shadow-md bg-white"
          draggable={false}
        />
        {/* Delete button on hover */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </Rnd>
  );
}
