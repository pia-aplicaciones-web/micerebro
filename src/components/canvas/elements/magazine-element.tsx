'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Plus, Trash2, FileImage, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CommonElementProps, MagazineContent, MagazinePage } from '@/lib/types';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';

function isMagazineContent(content: unknown): content is MagazineContent {
  return typeof content === 'object' && content !== null && Array.isArray((content as any).pages);
}

const defaultPages: MagazinePage[] = [
  { id: 'page-1', layout: 'single', images: [] },
  { id: 'page-2', layout: 'double', images: [] },
  { id: 'page-3', layout: 'grid', images: [] },
];

export default function MagazineElement(props: CommonElementProps) {
  const { id, content, isSelected, onSelectElement, onUpdate, deleteElement, isListening, finalTranscript, interimTranscript } = props;

  const magazine: MagazineContent = isMagazineContent(content)
    ? content as MagazineContent
    : { title: 'Revista', pages: defaultPages, currentPage: 0 };

  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const cardRef = useRef<HTMLDivElement>(null);

  const currentPageIndex = magazine.currentPage ?? 0;
  const currentPage = magazine.pages[currentPageIndex] || magazine.pages[0];

  const setPageLayout = (layout: MagazinePage['layout']) => {
    const pages = magazine.pages.map((p, idx) =>
      idx === currentPageIndex ? { ...p, layout } : p
    );
    onUpdate(id, { content: { ...magazine, pages } });
  };

  const handleAddPage = () => {
    const newPage: MagazinePage = { id: `page-${Date.now()}`, layout: 'single', images: [] };
    const pages = [...magazine.pages, newPage];
    onUpdate(id, { content: { ...magazine, pages, currentPage: pages.length - 1 } });
  };

  const handleDeletePage = () => {
    if (magazine.pages.length <= 1) return;
    const pages = magazine.pages.filter((_, idx) => idx !== currentPageIndex);
    const newIndex = Math.max(0, currentPageIndex - 1);
    onUpdate(id, { content: { ...magazine, pages, currentPage: newIndex } });
  };

  const handleMovePage = (dir: number) => {
    const newIdx = Math.min(Math.max(currentPageIndex + dir, 0), magazine.pages.length - 1);
    onUpdate(id, { content: { ...magazine, currentPage: newIdx } });
  };

  const handleUpload = (files: FileList | null) => {
    if (!files) return;
    const updated = { ...magazine } as MagazineContent;
    const page = updated.pages[currentPageIndex];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        page.images.push({ id: `img-${Date.now()}`, url, caption: '' });
        onUpdate(id, { content: { ...updated } });
      };
      reader.readAsDataURL(file);
    });
    setFileInputKey(Date.now());
  };

  const handleCaptionChange = (imgId: string, caption: string) => {
    const pages = magazine.pages.map((p, idx) => {
      if (idx !== currentPageIndex) return p;
      return {
        ...p,
        images: p.images.map((img) => (img.id === imgId ? { ...img, caption } : img)),
      };
    });
    onUpdate(id, { content: { ...magazine, pages } });
  };

  const handleExportPng = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#ffffff', scale: 3 });
      const link = document.createElement('a');
      link.download = `revista-${currentPage.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error exportando revista', err);
    }
  }, [currentPage?.id]);

  return (
    <Card
      ref={cardRef}
      data-element-id={id}
      className={cn(
        'w-full h-full flex flex-col overflow-hidden border shadow-md bg-white',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        e.stopPropagation();
        onSelectElement(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
    >
      <div className="drag-handle flex items-center justify-between px-3 py-2 border-b bg-gray-50 text-sm">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="font-semibold text-gray-700">Revista</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Página anterior" onClick={() => handleMovePage(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-gray-600">{currentPageIndex + 1}/{magazine.pages.length}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Página siguiente" onClick={() => handleMovePage(1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Agregar página" onClick={handleAddPage}>
            <Plus className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Borrar página" onClick={handleDeletePage}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7" title="Exportar PNG" onClick={handleExportPng}>
            <FileImage className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col gap-3 overflow-auto">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>Layout:</span>
          {(['single','double','grid'] as const).map((layout) => (
            <Button
              key={layout}
              size="sm"
              variant={currentPage.layout === layout ? 'default' : 'outline'}
              onClick={() => setPageLayout(layout)}
              className="h-7 px-2 text-xs"
            >
              {layout}
            </Button>
          ))}
          <input
            key={fileInputKey}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            id={`mag-upload-${id}`}
            onChange={(e) => handleUpload(e.target.files)}
          />
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => document.getElementById(`mag-upload-${id}`)?.click()}>
            Subir imágenes
          </Button>
        </div>

        <div className={cn(
          'grid gap-2 w-full flex-1',
          currentPage.layout === 'single' && 'grid-cols-1',
          currentPage.layout === 'double' && 'grid-cols-2',
          currentPage.layout === 'grid' && 'grid-cols-3'
        )}>
          {currentPage.images.map((img) => (
            <div key={img.id} className="relative bg-gray-100 border rounded p-2 flex flex-col gap-1 min-h-[140px]">
              <img src={img.url} alt="" className="w-full h-32 object-cover rounded" />
              <input
                className="w-full text-xs border rounded px-2 py-1"
                placeholder="Caption..."
                value={img.caption || ''}
                onChange={(e) => handleCaptionChange(img.id, e.target.value)}
              />
            </div>
          ))}
          {currentPage.images.length === 0 && (
            <div className="h-32 border-2 border-dashed rounded flex items-center justify-center text-xs text-gray-400">Sube imágenes</div>
          )}
        </div>
      </div>
    </Card>
  );
}
