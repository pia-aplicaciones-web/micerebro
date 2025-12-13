'use client';

import React, { useRef } from 'react';
import type { CommonElementProps, CommentContent } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDictationInput } from '@/hooks/use-dictation-input';

export default function CommentSmallElement(props: CommonElementProps) {
  const {
    id,
    content,
    isSelected,
    onSelectElement,
    onUpdate,
    deleteElement,
    isListening,
    finalTranscript,
    interimTranscript,
    isPreview,
  } = props;

  const data: CommentContent =
    typeof content === 'object' && content !== null ? (content as CommentContent) : { text: '' };

  const textRef = useRef<HTMLTextAreaElement>(null);

  useDictationInput({
    elementRef: textRef,
    isListening,
    finalTranscript,
    interimTranscript,
    isSelected: isSelected ?? true,
  });

  return (
    <Card
      data-element-id={id}
      className={cn(
        'w-full h-full rounded-md border shadow-sm flex flex-col overflow-hidden bg-white',
        isSelected && 'ring-2 ring-blue-500 ring-offset-2'
      )}
      onMouseDown={(e) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) return;
        e.stopPropagation();
        onSelectElement(id, e.shiftKey || e.ctrlKey || e.metaKey);
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="drag-handle flex items-center justify-between px-2 py-1 border-b text-xs bg-gray-50">
        <div className="flex items-center gap-2">
          <GripVertical className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-gray-700">Nota</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-500 hover:text-red-500"
          onMouseDown={(e) => {
            e.stopPropagation();
            deleteElement(id);
          }}
          title="Eliminar"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
      <div className="p-2 flex-1">
        <textarea
          ref={textRef}
          className="w-full h-full text-[10px] font-['Poppins'] leading-4 bg-transparent outline-none resize-none text-gray-800"
          placeholder="Escribe..."
          value={data.text || ''}
          onChange={(e) => onUpdate(id, { content: { ...data, text: e.target.value } })}
          onClick={(e) => e.stopPropagation()}
          onFocus={() => onSelectElement(id, false)}
          disabled={isPreview}
        />
      </div>
    </Card>
  );
}
