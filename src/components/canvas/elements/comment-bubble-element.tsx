// @ts-nocheck
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CommonElementProps, CommentContent, CanvasElementProperties } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Minus, Palette, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useDictationBinding } from '@/hooks/use-dictation-binding';

const PALETTE = [
  'rgba(255,255,255,0.7)', '#f2f2f2', '#dfe3e8', '#e0f2fe', '#fce7f3',
  '#C2D96A', '#DB6441', '#42B0DB', '#9ED5DE', '#CEC5DB', '#DBD393', '#E09D22', '#B8E100', '#1D93CE',
];

const ChatBubbleIcon = ({ size = 24, color = '#ffffff' }: { size?: number; color?: string }) => (
  <span
    className="leading-none"
    style={{
      fontFamily: "'Material Symbols Outlined'",
      fontSize: `${size}px`,
      color,
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
      lineHeight: 1,
      display: 'inline-block',
    }}
  >
    chat_bubble
  </span>
);

export default function CommentBubbleElement({
  id,
  content,
  properties,
  isSelected,
  minimized,
  onUpdate,
  onSelectElement,
  deleteElement,
  isListening,
  finalTranscript,
  interimTranscript,
}: CommonElementProps) {
  const commentContent: CommentContent =
    typeof content === 'object' && content !== null ? (content as CommentContent) : { text: '' };

  const safeProps = (typeof properties === 'object' && properties !== null ? properties : {}) as CanvasElementProperties;
  const initialBg = (safeProps.backgroundColor as string) || PALETTE[0];

  const [text, setText] = useState(commentContent.text || '');
  const [bgColor, setBgColor] = useState<string>(initialBg);
  // const { bindDictationTarget } = useDictationBinding({
  //   isListening,
  //   finalTranscript,
  //   interimTranscript,
  //   isSelected,
  // });

  useEffect(() => {
    setText(commentContent.text || '');
  }, [commentContent.text]);

  const currentColors = useMemo(() => {
    const border = '#d6d6d6';
    return { bg: bgColor, border };
  }, [bgColor]);

  const handleTextChange = useCallback(
    (value: string) => {
      setText(value);
      onUpdate(id, {
        content: { ...commentContent, text: value },
      });
    },
    [commentContent, id, onUpdate]
  );

  const handleColorChange = useCallback(
    (newColor: string) => {
      setBgColor(newColor);
      onUpdate(id, {
        properties: {
          ...safeProps,
          backgroundColor: newColor,
          borderColor: '#d6d6d6',
        },
      });
    },
    [id, onUpdate, safeProps]
  );

  const toggleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const isMin = !!minimized;
      if (isMin) {
        const restoredSize = safeProps.originalSize && typeof safeProps.originalSize === 'object'
          ? safeProps.originalSize
          : { width: 240, height: 140 };
        onUpdate(id, {
          minimized: false,
          properties: {
            ...safeProps,
            size: restoredSize,
          },
        });
        onSelectElement(id, false);
      } else {
        const currentSize = safeProps.size && typeof safeProps.size === 'object'
          ? safeProps.size
          : { width: 240, height: 140 };
        onUpdate(id, {
          minimized: true,
          properties: {
            ...safeProps,
            originalSize: currentSize,
            size: { width: 52, height: 52 },
          },
        });
      }
    },
    [id, minimized, onSelectElement, onUpdate, safeProps]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      deleteElement(id);
    },
    [deleteElement, id]
  );

  if (minimized) {
    return (
      <div
        className="w-full h-full flex items-center justify-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onUpdate(id, { minimized: false });
          onSelectElement(id, false);
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center border shadow-sm"
          style={{ backgroundColor: '#2f3438', borderColor: '#2f3438' }}
        >
          <ChatBubbleIcon size={24} color="#fff" />
        </div>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        'w-full h-full shadow-lg border rounded-lg',
        'flex flex-col relative overflow-hidden',
        isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
      )}
      style={{
        backgroundColor: currentColors.bg,
        borderColor: currentColors.border,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectElement(id, false);
      }}
    >
      {/* Estrella decorativa sincronizada con el color de la burbuja */}
      <div
        className="absolute"
        style={{ top: '-24px', left: '-10px', color: currentColors.bg, pointerEvents: 'none' }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill={currentColors.bg} xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(20deg)' }}>
          <path d="M12 2l2.39 4.84 5.34.78-3.86 3.76.91 5.31L12 14.77 6.22 16.7l.91-5.31-3.86-3.76 5.34-.78L12 2z" />
        </svg>
      </div>
      <div
        className="flex items-center justify-between px-2 py-1 drag-handle cursor-move border-b"
        style={{ borderColor: currentColors.border }}
      >
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <ChatBubbleIcon size={18} color="#475569" />
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <Palette className="w-4 h-4 text-slate-600" />
            {PALETTE.map((option) => (
              <button
                key={option}
                className={cn(
                  'w-5 h-5 rounded-sm border',
                  option === bgColor ? 'ring-2 ring-offset-1 ring-primary' : ''
                )}
                style={{
                  backgroundColor: option,
                  borderColor: '#d6d6d6',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorChange(option);
                }}
                title="Paleta"
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onMouseDown={toggleMinimize}
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onMouseDown={handleDelete} title="Eliminar">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-3 flex-1">
        <textarea
          className="w-full h-full bg-transparent outline-none resize-none text-slate-900"
          style={{ fontSize: '11px', lineHeight: '1.4' }}
          value={text}
          placeholder="Escribe tu comentario..."
          onChange={(e) => handleTextChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => {
            // bindDictationTarget(e.currentTarget);
          }}
        />
      </div>
    </Card>
  );
}
