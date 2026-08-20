import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_PORTRAIT_SVG } from '../../assets/defaultPortrait.js';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  RotateCcw as ResetIcon,
  ImageIcon,
  Camera,
  Glasses,
  FileText,
  Crop,
  Check,
  Square,
  FileCheck2,
  ScanFace,
  ArrowLeft,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export function PhotoCropper({ onSave, initialImage = null, onCancel, onBack }) {
  const [imageSrc, setImageSrc] = useState(initialImage || DEFAULT_PORTRAIT_SVG);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [croppedPreviewUrl, setCroppedPreviewUrl] = useState(DEFAULT_PORTRAIT_SVG);
  const [uploadError, setUploadError] = useState(null);

  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load image object whenever imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
      generatePreview();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Redraw canvas and live circular preview whenever zoom, rotation, or pan updates
  useEffect(() => {
    if (imageRef.current) {
      drawCanvas();
      generatePreview();
    }
  }, [zoom, rotation, pan]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Center of canvas
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Aspect ratio fit
    const hRatio = width / img.width;
    const vRatio = height / img.height;
    const ratio = Math.max(hRatio, vRatio);

    const drawW = img.width * ratio;
    const drawH = img.height * ratio;

    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
  };

  const generatePreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCroppedPreviewUrl(previewDataUrl);
    } catch (e) {
      // Fallback
    }
  };

  const handleFileChange = (e) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size exceeds 5MB limit.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPG, JPEG, PNG, or WebP images are allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Pan controls
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(3, Math.round((prev + 0.15) * 100) / 100));
  const handleZoomOut = () => setZoom(prev => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100));
  const handleRotateLeft = () => setRotation(prev => (prev - 90 + 360) % 360);
  const handleRotateRight = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleConfirmSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const previewUrl = canvas.toDataURL('image/jpeg', 0.95);
      if (onSave) {
        onSave({ blob, previewUrl });
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="space-y-5">
      {/* ── Section 1: Photo Guidelines Card ─────────────────────────── */}
      <div className="enterprise-card bg-white p-6 space-y-4">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            <Camera className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Profile Photo Standards</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload a clear photograph for your official Shineteck Inc. corporate badge and employee profile directory
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <ScanFace className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Centered & Visible</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Position face directly within the center 3×3 grid</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Neutral Background</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Plain white, light gray, or professional background</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <Glasses className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">No Face Obscurations</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Avoid dark sunglasses or hats that cover forehead/eyes</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Format & Size</p>
              <p className="text-slate-500 text-[11px] mt-0.5">JPG, PNG, WebP up to 5MB (Square 1:1 recommended)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Interactive Photo Editor Studio ────────────────── */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <Crop className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Interactive Photo Studio</h3>
            <p className="text-xs text-slate-500 mt-0.5">Use zoom, drag, and rotation controls to frame your face perfectly</p>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {uploadError}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
          {/* Canvas with Crop Box and 3x3 Grid */}
          <div
            className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] rounded-xl overflow-hidden bg-slate-200 cursor-grab active:cursor-grabbing select-none shrink-0 shadow-inner border border-slate-300"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={300}
              height={300}
              className="w-full h-full block"
            />

            {/* 3x3 Dashed White Composition Grid Lines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/40">
              <div className="border-b border-r border-dashed border-white/70" />
              <div className="border-b border-r border-dashed border-white/70" />
              <div className="border-b border-dashed border-white/70" />

              <div className="border-b border-r border-dashed border-white/70" />
              <div className="border-b border-r border-dashed border-white/70 relative flex items-center justify-center">
                {/* Face target guide oval */}
                <div className="w-20 h-24 rounded-full border border-dashed border-white/50" />
              </div>
              <div className="border-b border-dashed border-white/70" />

              <div className="border-r border-dashed border-white/70" />
              <div className="border-r border-dashed border-white/70" />
              <div />
            </div>

            {/* 4 Crisp Blue Corner Brackets */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-600 pointer-events-none" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-600 pointer-events-none" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-600 pointer-events-none" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-600 pointer-events-none" />
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-5 md:grid-cols-1 gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleZoomIn}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex flex-col items-center justify-center transition-colors shadow-2xs hover:border-slate-300"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-semibold">Zoom +</span>
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex flex-col items-center justify-center transition-colors shadow-2xs hover:border-slate-300"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-semibold">Zoom -</span>
            </button>

            <button
              type="button"
              onClick={handleRotateLeft}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex flex-col items-center justify-center transition-colors shadow-2xs hover:border-slate-300"
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-semibold">Rot Left</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex flex-col items-center justify-center transition-colors shadow-2xs hover:border-slate-300"
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-semibold">Rot Right</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg flex flex-col items-center justify-center transition-colors shadow-2xs hover:border-slate-300"
              title="Reset Position"
            >
              <ResetIcon className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-semibold">Reset</span>
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg border border-blue-200 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload New Photo</span>
          </button>
          <span className="text-xs text-slate-400 font-medium text-center">
            Supports JPG, JPEG, PNG, WebP (Max 5.0 MB)
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* ── Section 3: Live Badge Preview ────────────────────────────── */}
      <div className="enterprise-card bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Official Badge Preview</h3>
            <p className="text-xs text-slate-500 mt-0.5">Live rendering on Shineteck Inc. identity badge</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-blue-600 overflow-hidden bg-white shadow-md">
              <img
                src={croppedPreviewUrl}
                alt="Badge Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              Verified ✓
            </span>
          </div>
        </div>
      </div>

      {/* ── Navigation Buttons ───────────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2 pb-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <button
          type="button"
          onClick={handleConfirmSave}
          className="inline-flex items-center gap-2 px-7 py-2.5 bg-[#0f2b48] hover:bg-[#1a416b] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <span>Save Photo & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
