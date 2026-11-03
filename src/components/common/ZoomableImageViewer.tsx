/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  X,
} from 'lucide-react';

interface ZoomableImageViewerProps {
  src: string;
  alt: string;
  caption?: string;
  'data-testid'?: string;
  mediaId?: string;
  viewLabel?: string;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.35;

export const ZoomableImageViewer: React.FC<ZoomableImageViewerProps> = ({
  src,
  alt,
  caption,
  'data-testid': testId,
  mediaId,
  viewLabel,
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const dragOrigin = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    resetView();
  }, [src, resetView]);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen]);

  const zoomBy = (delta: number) => {
    setScale((current) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number((current + delta).toFixed(2))));
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const onPointerDown = (event: React.PointerEvent) => {
    if (scale <= MIN_SCALE) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOrigin.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
    setDragging(true);
  };

  const onPointerMove = (event: React.PointerEvent) => {
    if (!dragOrigin.current) return;
    setOffset({
      x: dragOrigin.current.ox + (event.clientX - dragOrigin.current.x),
      y: dragOrigin.current.oy + (event.clientY - dragOrigin.current.y),
    });
  };

  const onPointerUp = (event: React.PointerEvent) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragOrigin.current = null;
    setDragging(false);
  };

  const onWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? SCALE_STEP : -SCALE_STEP);
  };

  const controls = (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => zoomBy(-SCALE_STEP)}
        disabled={scale <= MIN_SCALE}
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-[#242326]/12 text-[#242326] hover:bg-[#FAF7F2] disabled:opacity-40 cursor-pointer"
        aria-label="Zoom out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => zoomBy(SCALE_STEP)}
        disabled={scale >= MAX_SCALE}
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-[#242326]/12 text-[#242326] hover:bg-[#FAF7F2] disabled:opacity-40 cursor-pointer"
        aria-label="Zoom in"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setRotation((value) => value - 90)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-[#242326]/12 text-[#242326] hover:bg-[#FAF7F2] cursor-pointer"
        aria-label="Rotate left"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setRotation((value) => value + 90)}
        className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-[#242326]/12 text-[#242326] hover:bg-[#FAF7F2] cursor-pointer"
        aria-label="Rotate right"
      >
        <RotateCw className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={resetView}
        className="inline-flex items-center px-2.5 h-8 rounded-xl bg-white border border-[#242326]/12 text-[11px] font-semibold text-[#5C585E] hover:text-[#242326] hover:bg-[#FAF7F2] cursor-pointer"
      >
        Reset
      </button>
      <span className="text-[11px] text-[#5C585E] px-1 tabular-nums">{Math.round(scale * 100)}%</span>
      <button
        type="button"
        onClick={() => setFullscreen((open) => !open)}
        className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-xl bg-[#9C6A61] hover:bg-[#83554D] text-white text-[11px] font-semibold cursor-pointer ml-auto"
        aria-label={fullscreen ? 'Exit full screen' : 'Open full screen'}
      >
        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        <span>{fullscreen ? 'Close' : 'Full view'}</span>
      </button>
    </div>
  );

  const stage = (
    <div
      ref={frameRef}
      className={`relative overflow-hidden bg-[#FAF7F2] select-none touch-none ${
        fullscreen ? 'flex-1 rounded-none' : 'aspect-3/4 sm:aspect-auto sm:max-h-[70vh]'
      }`}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{ cursor: scale > MIN_SCALE ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
      onDoubleClick={() => zoomBy(scale >= 2 ? -(scale - 1) : SCALE_STEP * 2)}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="w-full h-full object-contain transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
        data-testid={testId}
        data-result-media-id={mediaId}
        data-result-view={viewLabel}
      />
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-[#242326]/90 backdrop-blur-sm flex flex-col" data-testid="tryon-zoom-fullscreen">
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-[#242326] text-white">
          <p className="text-xs font-medium truncate">{caption || alt}</p>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 cursor-pointer"
            aria-label="Close full view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 py-2 bg-[#242326]/80">{controls}</div>
        {stage}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#B49361]/40 overflow-hidden bg-white space-y-0" data-testid="tryon-after">
      <div className="p-2.5 border-b border-[#242326]/8 bg-[#FAF7F2]/80">
        {controls}
      </div>
      {stage}
      {caption ? (
        <p className="text-[11px] p-2 text-[#5C585E]">{caption}</p>
      ) : null}
      <p className="text-[10px] px-2 pb-2 text-[#5C585E]/80">
        Pinch or scroll to zoom · drag to pan · double-click to enlarge · rotate to change the view
      </p>
    </div>
  );
};
