import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FAIcon } from '../common/FAIcon';
import { Button } from '../common/Button';

interface AvatarCanvasCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBase64: string) => void;
  onCancel: () => void;
}

export const AvatarCanvasCropper: React.FC<AvatarCanvasCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Transformation states
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);

  // Dragging interaction state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialPinchDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);

  // Display canvas size
  const CANVAS_SIZE = 280;
  const CROP_RADIUS = 110; // 220px diameter circle

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      // Auto-fit zoom so image fills the crop area nicely
      const minDimension = Math.min(img.width, img.height);
      const initialScale = Math.max((CROP_RADIUS * 2) / minDimension, 1);
      setZoom(initialScale);
      setPan({ x: 0, y: 0 });
      setRotation(0);
    };
  }, [imageSrc]);

  // Redraw canvas whenever transformation changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Retina sharpness
    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Save state for image rendering
    ctx.save();

    // Move to center of canvas + pan offset
    const centerX = CANVAS_SIZE / 2 + pan.x;
    const centerY = CANVAS_SIZE / 2 + pan.y;
    ctx.translate(centerX, centerY);

    // Apply rotation (in radians)
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom
    ctx.scale(zoom, zoom);

    // Draw image centered
    const imgW = image.width;
    const imgH = image.height;
    ctx.drawImage(image, -imgW / 2, -imgH / 2, imgW, imgH);

    ctx.restore();

    // Draw Dark Overlay & Circular Cutout Hole
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 20, 0.65)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Cut circular hole
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Restore to normal composite mode
    ctx.globalCompositeOperation = 'source-over';

    // Draw Circular Guide Border
    ctx.beginPath();
    ctx.arc(CANVAS_SIZE / 2, CANVAS_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = '#84A282';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Subtle crosshair / alignment tick marks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    // Horizontal guide line
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2 - CROP_RADIUS, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE / 2 + CROP_RADIUS, CANVAS_SIZE / 2);
    ctx.stroke();
    // Vertical guide line
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2 - CROP_RADIUS);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE / 2 + CROP_RADIUS);
    ctx.stroke();

    ctx.restore();
  }, [image, zoom, pan, rotation]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Touch Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      dragStartRef.current = {
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      };
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      isDraggingRef.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDistRef.current = Math.hypot(dx, dy);
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const newX = e.touches[0].clientX - dragStartRef.current.x;
      const newY = e.touches[0].clientY - dragStartRef.current.y;
      setPan({ x: newX, y: newY });
    } else if (e.touches.length === 2 && initialPinchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      const ratio = currentDist / initialPinchDistRef.current;
      const nextZoom = Math.min(Math.max(initialZoomRef.current * ratio, 0.4), 3.5);
      setZoom(nextZoom);
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    initialPinchDistRef.current = null;
  };

  // Mouse Handlers for Desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.4), 3.5));
  };

  // Rotate 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset positioning
  const handleReset = () => {
    if (!image) return;
    const minDimension = Math.min(image.width, image.height);
    const initialScale = Math.max((CROP_RADIUS * 2) / minDimension, 1);
    setZoom(initialScale);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };

  // Perform Final Crop on Output Canvas
  const handleCropAndApply = () => {
    if (!image) return;

    // Create a 360x360 offscreen output canvas
    const OUTPUT_SIZE = 360;
    const offscreen = document.createElement('canvas');
    offscreen.width = OUTPUT_SIZE;
    offscreen.height = OUTPUT_SIZE;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Smooth image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Scale factor from preview canvas to final output
    const scaleFactor = OUTPUT_SIZE / (CROP_RADIUS * 2);

    // Save and transform
    ctx.save();
    // Center of output
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);

    // Apply pan scaled up
    ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply zoom
    ctx.scale(zoom * scaleFactor, zoom * scaleFactor);

    // Draw the image
    ctx.drawImage(image, -image.width / 2, -image.height / 2, image.width, image.height);
    ctx.restore();

    // Export as high-quality WebP or JPEG Data URL
    const croppedDataUrl = offscreen.toDataURL('image/jpeg', 0.88);
    onCropComplete(croppedDataUrl);
  };

  return (
    <div className="flex flex-col items-center space-y-4 w-full animate-fadeIn select-none">
      <div className="text-center">
        <h4 className="text-sm font-extrabold text-[#26382B]">Sesuaikan & Potong Foto</h4>
        <p className="text-[11px] text-[#778477] mt-0.5">
          Geser foto untuk menyesuaikan posisi di dalam lingkaran
        </p>
      </div>

      {/* Interactive HTML5 Canvas Container */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#84A282]/40 shadow-soft bg-stone-900 touch-none flex items-center justify-center">
        <canvas
          ref={canvasRef}
          style={{ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }}
          className="cursor-grab active:cursor-grabbing block"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Floating pan/pinch instruction pill */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-3 py-1 rounded-full pointer-events-none flex items-center gap-1.5 shadow-sm">
          <FAIcon name="sliders" className="text-[9px] text-[#84A282]" />
          <span>Geser untuk memposisikan</span>
        </div>
      </div>

      {/* Interactive Transformation Controls */}
      <div className="w-full max-w-xs space-y-3 bg-[#F0F5ED] p-3.5 rounded-2xl border border-[#E7EBE4]">
        {/* Zoom Slider */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setZoom((prev) => Math.max(prev - 0.15, 0.4))}
            className="w-7 h-7 rounded-xl bg-white hover:bg-stone-100 text-[#587A58] flex items-center justify-center text-xs shadow-xs border border-stone-200 transition-colors"
            title="Perkecil"
          >
            <FAIcon name="minus" />
          </button>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#587A58] h-1.5 bg-stone-200 rounded-lg cursor-pointer"
            aria-label="Perbesaran foto"
          />

          <button
            type="button"
            onClick={() => setZoom((prev) => Math.min(prev + 0.15, 3.5))}
            className="w-7 h-7 rounded-xl bg-white hover:bg-stone-100 text-[#587A58] flex items-center justify-center text-xs shadow-xs border border-stone-200 transition-colors"
            title="Perbesar"
          >
            <FAIcon name="plus" />
          </button>
        </div>

        {/* Rotate & Reset Action Pills */}
        <div className="flex items-center justify-between pt-1 border-t border-[#E7EBE4]/60">
          <button
            type="button"
            onClick={handleRotate}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-xs border border-stone-200 transition-colors"
          >
            <FAIcon name="refresh" className="text-[10px] text-[#587A58]" />
            <span>Putar 90°</span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold flex items-center gap-1.5 shadow-xs border border-stone-200 transition-colors"
          >
            <span>Reset Posisi</span>
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-stone-200 text-stone-600 hover:bg-stone-100"
        >
          Batal
        </Button>
        <Button
          type="button"
          variant="primary"
          icon="check"
          onClick={handleCropAndApply}
        >
          Terapkan Foto
        </Button>
      </div>
    </div>
  );
};
