'use client';

import React, { useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import {
  GripVertical,
  FilePenLine,
  Square,
  Link2,
  Box,
  MessageSquare,
  Brush,
  Highlighter,
  Clock,
  Timer,
  LayoutGrid,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ElementType } from '@/lib/types';

type Props = {
  addElement: (type: ElementType, props?: any) => Promise<string>;
  defaultOpen?: boolean;
};

const items: { type: ElementType; label: string; icon: React.ElementType }[] = [
  { type: 'comment', label: 'Comentario', icon: MessageSquare },
  { type: 'highlight-text', label: 'Texto destacado', icon: Highlighter },
  { type: 'stopwatch', label: 'Cronómetro', icon: Clock },
  { type: 'countdown', label: 'Cuenta regresiva', icon: Timer },
];

export default function Menu3HiddenElements({ addElement, defaultOpen = true }: Props) {
  const [pos, setPos] = useState({ x: 200, y: 140 });
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPos({
        x: Math.max(40, window.innerWidth / 2 - 180),
        y: Math.max(40, window.innerHeight / 2 - 140),
      });
    }
  }, []);

  if (!open) return null;

  return (
    <Rnd
      position={pos}
      size={{ width: 360, height: 'auto' }}
      bounds="window"
      dragHandleClassName="menu3-drag"
      onDragStop={(_, d) => setPos({ x: d.x, y: d.y })}
      enableResizing={false}
      className="z-[10002]"
    >
      <div className="bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-3">
        <div className="menu3-drag flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-semibold">Menú 3 · Elementos sin botón</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.type}
                variant="outline"
                onClick={() => addElement(item.type, item.props)}
                className="justify-start gap-2 h-10 text-sm border-slate-200 text-slate-700 hover:border-slate-300"
              >
                <Icon className="w-4 h-4 text-slate-500" />
                <span>{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </Rnd>
  );
}
