'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X,
  Upload,
  ChevronRight,
  ChevronLeft,
  Trash2,
  GripVertical,
  Link as LinkIcon,
  ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MoodboardPanelImage {
  id: string;
  url: string;
  thumbnail?: string;
}

interface MoodboardPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  onDragImageToCanvas: (imageUrl: string) => void;
  onSaveImageFromCanvas?: (imageUrl: string) => void;
  savedImages?: MoodboardPanelImage[];
  onRemoveImage?: (imageId: string) => void;
  label?: string;
  storageKey?: string;
  panelOffset?: number;
  positioning?: 'fixed' | 'absolute';
  anchorTop?: number;
  anchorRight?: number;
  headerBg?: string;
  disableAnimation?: boolean;
  alwaysOpen?: boolean;
  showToggle?: boolean;
}

const PANEL_WIDTH = 265; // ~7cm

export default function MoodboardPanel({
  isOpen,
  onToggle,
  onDragImageToCanvas,
  onSaveImageFromCanvas,
  savedImages = [],
  onRemoveImage,
  label = 'Moodboard2',
  storageKey = 'moodboard2-images',
  panelOffset = 0,
  positioning = 'fixed',
  anchorTop = 0,
  anchorRight = 0,
  headerBg = '#f8fafc',
  disableAnimation = false,
  alwaysOpen = false,
  showToggle = true,
}: MoodboardPanelProps) {
  const [images, setImages] = useState<MoodboardPanelImage[]>(savedImages);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with saved images
  useEffect(() => {
    setImages(savedImages);
  }, [savedImages]);

  // Autosave to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(images));
    }
  }, [images, storageKey]);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          setImages(JSON.parse(saved));
        } catch {
          // ignore
        }
      }
    }
  }, [storageKey]);

  // Reducir imagen a 72dpi aprox y max 200KB (permite entrada hasta 20MB)
  const compressImage = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          // Escalar a ancho máximo 1280 para reducir peso (~72dpi equivalente)
          const maxSize = 1280;
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          let quality = 0.9;
          let result = canvas.toDataURL('image/jpeg', quality);
          while (result.length > 200 * 1024 * 1.37 && quality > 0.3) {
            quality -= 0.1;
            result = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(result);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Handle file upload con compresión
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const url = await compressImage(file);
        const newImage: MoodboardPanelImage = {
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          url,
        };
        setImages((prev) => [...prev, newImage]);
      } catch (err) {
        console.error('Error compressing image', err);
      }
    }
  }, [compressImage]);

  // Handle URL input
  const handleAddFromUrl = useCallback(() => {
    if (!imageUrl.trim()) return;
    const newImage: MoodboardPanelImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: imageUrl.trim(),
    };
    setImages((prev) => [...prev, newImage]);
    setImageUrl('');
    setShowUrlInput(false);
  }, [imageUrl]);

  // Handle delete
  const handleDeleteImage = useCallback((imageId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    onRemoveImage?.(imageId);
  }, [onRemoveImage]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, imageUrl: string) => {
    e.dataTransfer.setData('text/plain', imageUrl);
    e.dataTransfer.setData('application/moodboard-image', imageUrl);
    setDraggedImage(imageUrl);
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedImage(null);
  }, []);

  // Handle drop from canvas (to save image)
  const handleDropFromCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const imageUrl = e.dataTransfer.getData('text/plain');
    if (imageUrl && imageUrl.startsWith('http') || imageUrl.startsWith('data:')) {
      const newImage: MoodboardPanelImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: imageUrl,
      };
      setImages((prev) => [...prev, newImage]);
      onSaveImageFromCanvas?.(imageUrl);
    }
  }, [onSaveImageFromCanvas]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <>
      {/* Toggle Button */}
      {showToggle && (
        <button
          onClick={onToggle}
          className={cn(
            `${positioning} z-[9998] bg-white border border-gray-200 shadow-md rounded-l-lg p-2 hover:bg-gray-50 transition-all`,
            positioning === 'fixed' ? 'top-1/2 -translate-y-1/2' : ''
          )}
          style={{
            top: positioning === 'absolute' ? anchorTop + 16 : undefined,
            right: (panelOffset || 0) + ((alwaysOpen || isOpen) ? PANEL_WIDTH : 0) + anchorRight,
            transform: positioning === 'fixed' ? undefined : undefined,
          }}
          title={(alwaysOpen || isOpen) ? `Cerrar ${label}` : `Abrir ${label}`}
        >
          {(alwaysOpen || isOpen) ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      )}

      {/* Panel */}
      <div
        className={cn(
          `${positioning} bg-white border-l border-gray-200 shadow-xl z-[9997]`,
          positioning === 'fixed' ? 'top-0 right-0 h-full' : 'top-0'
        )}
        style={{
          width: PANEL_WIDTH,
          right: (panelOffset || 0) + anchorRight,
          transform: disableAnimation ? 'translateX(0)' : ((alwaysOpen || isOpen) ? 'translateX(0)' : `translateX(${PANEL_WIDTH}px)`),
          transition: disableAnimation ? 'none' : 'transform 300ms',
          height: positioning === 'fixed' ? undefined : '100%',
        }}
        onDrop={handleDropFromCanvas}
        onDragOver={handleDragOver}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200" style={{ backgroundColor: headerBg }}>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
          <div className="flex items-center gap-1">
            {/* Botón Imagen clonado del menú principal */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ImagePlus className="w-4 h-4" />
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
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* URL Input */}
        {showUrlInput && (
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="flex gap-1">
              <Input
                type="url"
                placeholder="URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddFromUrl();
                  if (e.key === 'Escape') setShowUrlInput(false);
                }}
                className="h-7 text-xs"
                autoFocus
              />
              <Button size="sm" className="h-7 px-2 text-xs" onClick={handleAddFromUrl}>
                OK
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

        {/* Images Grid - 2 columns with scroll */}
        <div className="flex-1 overflow-y-auto p-2" style={{ height: 'calc(100vh - 80px)' }}>
          {images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center p-4">
              <Upload className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-xs">Arrastra imágenes aquí</p>
              <p className="text-xs">o usa el botón +</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={cn(
                    'relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-grab active:cursor-grabbing',
                    draggedImage === img.url && 'opacity-50'
                  )}
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.url)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onDragImageToCanvas(img.url)}
                  title="Arrastra al lienzo o haz clic para agregar"
                >
                  <img
                    src={img.url}
                    alt=""
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(img.id);
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    title="Eliminar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-[10px] text-gray-500 text-center">
            Arrastra imágenes al lienzo o desde él
          </p>
        </div>
      </div>
    </>
  );
}
