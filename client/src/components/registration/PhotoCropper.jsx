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
  ShieldCheck,
  Sparkles
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

  // Redraw canvas and live preview whenever zoom, rotation, or pan updates
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

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2 + pan.x, height / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

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
      {/* Section 1: Photo Guidelines Card */}
      <div className="enterprise-card bg-white p-6 space-y-4">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Camera className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Profile Photo Standards</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Upload a clear photograph for your official Shineteck Inc. corporate badge and employee profile directory
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
            <ScanFace className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 font-display">Centered & Visible</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Position face directly within the center grid guide</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
            <ImageIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 font-display">Neutral Background</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Plain white, light gray, or professional office backdrop</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
            <Glasses className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 font-display">No Obscurations</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Avoid dark sunglasses or hats covering forehead/eyes</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800 font-display">Format & Resolution</p>
              <p className="text-slate-500 text-[11px] mt-0.5">JPG, PNG, WebP up to 5MB (Square 1:1 recommended)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Interactive Photo Editor Studio */}
      <div className="enterprise-card bg-white p-6 space-y-5">
        <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Crop className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Interactive Photo Studio</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Use zoom, drag, and rotation controls to frame your face perfectly</p>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-xl font-semibold">
            {uploadError}
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80">
          {/* Canvas with Crop Box and 3x3 Grid */}
          <div
            className="relative w-[280px] h-[280px] sm:w-[300px] sm:h-[300px] rounded-2xl overflow-hidden bg-slate-200 cursor-grab active:cursor-grabbing select-none shrink-0 shadow-inner border border-slate-300"
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

            {/* 3x3 Composition Grid Lines */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/40">
              <div className="border-b border-r border-dashed border-white/70" />
              <div className="border-b border-r border-dashed border-white/70" />
              <div className="border-b border-dashed border-white/70" />

              <div className="border-b border-r border-dashed border-white/70" />
              <div className="border-b border-r border-dashed border-white/70 relative flex items-center justify-center">
                <div className="w-20 h-24 rounded-full border border-dashed border-white/60" />
              </div>
              <div className="border-b border-dashed border-white/70" />

              <div className="border-r border-dashed border-white/70" />
              <div className="border-r border-dashed border-white/70" />
              <div />
            </div>

            {/* 4 Corner Brackets */}
            <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-blue-600 pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-blue-600 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-blue-600 pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-blue-600 pointer-events-none" />
          </div>

          {/* Action Toolbar */}
          <div className="grid grid-cols-5 md:grid-cols-1 gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={handleZoomIn}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-bold">Zoom +</span>
            </button>

            <button
              type="button"
              onClick={handleZoomOut}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-bold">Zoom -</span>
            </button>

            <button
              type="button"
              onClick={handleRotateLeft}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
              title="Rotate Left"
            >
              <RotateCcw className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-bold">Rot Left</span>
            </button>

            <button
              type="button"
              onClick={handleRotateRight}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
              title="Rotate Right"
            >
              <RotateCw className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-bold">Rot Right</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl flex flex-col items-center justify-center transition-all shadow-2xs hover:border-slate-300 cursor-pointer active:scale-95"
              title="Reset Position"
            >
              <ResetIcon className="w-4 h-4 mb-0.5 text-slate-700" />
              <span className="text-[10px] font-bold">Reset</span>
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 transition-all shadow-2xs cursor-pointer active:scale-98"
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

      {/* Section 3: Live Badge Preview */}
      <div className="enterprise-card bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display">Official Corporate Badge Preview</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Live rendering on Shineteck Inc. identity badge</p>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl border-2 border-blue-600 overflow-hidden bg-white shadow-md">
              <img
                src={croppedPreviewUrl}
                alt="Badge Preview"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
              Verified ✓
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2 pb-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="enterprise-btn-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleConfirmSave}
          className="enterprise-btn-primary ml-auto"
        >
          <span>Save Photo & Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
