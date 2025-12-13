'use client';

import { useEffect, useRef, useCallback } from 'react';

type DictationTarget =
  | React.RefObject<HTMLElement>
  | React.RefObject<HTMLInputElement>
  | React.RefObject<HTMLTextAreaElement>;

type DictationInputParams = {
  elementRef?: DictationTarget;
  isListening?: boolean;
  finalTranscript?: string;
  interimTranscript?: string;
  isSelected?: boolean;
  enabled?: boolean;
};

/**
 * DICTADO PERFECTO (sin preview gris)
 * - Muestra interim en texto plano mientras hablas
 * - Consolida final sin duplicar
 * - Cursor siempre al final
 */
export function useDictationInput(params?: DictationInputParams) {
  const {
    elementRef,
    isListening = false,
    finalTranscript = '',
    interimTranscript = '',
    isSelected = true,
    enabled = true,
  } = params || {};

  const baseTextRef = useRef<string>('');
  const wasListeningRef = useRef<boolean>(false);
  const appliedFinalRef = useRef<string>('');
  const appliedInterimRef = useRef<string>('');
  const initialElementRef = useRef<HTMLElement | null>(null);

  const joinParts = useCallback((parts: Array<string | undefined | null>) => {
    return parts
      .map((p) => (p || '').trim())
      .filter((p) => p.length > 0)
      .join(' ');
  }, []);

  const placeCaretAtEnd = useCallback((el: HTMLElement) => {
    try {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!enabled || !elementRef?.current) return;

    const el = elementRef.current as HTMLElement;
    // Solo actuar sobre el elemento enfocado
    const active = document.activeElement as HTMLElement | null;
    if (!active || active !== el) return;

    // Recordar el elemento inicial cuando empieza la sesión
    if (isListening && !wasListeningRef.current) {
      initialElementRef.current = el;
    }

    // Solo permitir inserción en el elemento inicial
    if (!initialElementRef.current || el !== initialElementRef.current) return;

    const isContentEditable = (el as HTMLElement).isContentEditable;

    const getText = (): string => {
      if (isContentEditable) {
        return (el.textContent || '').trim();
      }
      if ((el as HTMLInputElement).value !== undefined) return (el as HTMLInputElement).value || '';
      if ((el as HTMLTextAreaElement).value !== undefined) return (el as HTMLTextAreaElement).value || '';
      return '';
    };

    const setText = (text: string) => {
      if (isContentEditable) {
        el.textContent = text;
        placeCaretAtEnd(el as HTMLElement);
      } else if ((el as HTMLInputElement).value !== undefined) {
        const inputEl = el as HTMLInputElement;
        inputEl.value = text;
        inputEl.setSelectionRange(text.length, text.length);
      } else if ((el as HTMLTextAreaElement).value !== undefined) {
        const textareaEl = el as HTMLTextAreaElement;
        textareaEl.value = text;
        textareaEl.setSelectionRange(text.length, text.length);
      }
    };

    const currentText = getText();

    // INICIO: guardar base
    if (isListening && !wasListeningRef.current) {
      baseTextRef.current = currentText;
      wasListeningRef.current = true;
      appliedFinalRef.current = '';
      appliedInterimRef.current = '';
    }

    const committedText = joinParts([baseTextRef.current, appliedFinalRef.current]);

    // MIENTRAS: aplicar interim en vivo sobre base + final ya aplicado
    if (isListening && interimTranscript && interimTranscript !== appliedInterimRef.current) {
      const next = joinParts([committedText, interimTranscript]);
      setText(next);
      appliedInterimRef.current = interimTranscript;
    }

    // FINAL: solo agregar el delta nuevo del finalTranscript
    if (finalTranscript && finalTranscript !== appliedFinalRef.current) {
      const delta = finalTranscript.substring(appliedFinalRef.current.length).trim();
      const nextAppliedFinal = joinParts([appliedFinalRef.current, delta]);
      const next = joinParts([baseTextRef.current, nextAppliedFinal]);
      setText(next);
      appliedFinalRef.current = nextAppliedFinal;
      appliedInterimRef.current = '';
    }

    // FIN: limpiar refs
    if (!isListening && wasListeningRef.current) {
      wasListeningRef.current = false;
      baseTextRef.current = '';
      appliedFinalRef.current = '';
      appliedInterimRef.current = '';
      initialElementRef.current = null;
    }
  }, [elementRef, isListening, interimTranscript, finalTranscript, isSelected, enabled, placeCaretAtEnd, joinParts]);
}

export default useDictationInput;
