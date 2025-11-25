import React, { useRef } from 'react';
import { Calculator, Image as ImageIcon, Info, Upload, X } from 'lucide-react';
import { proxy, useSnapshot } from 'valtio';

// ============================================================================
// Model Configuration
// ============================================================================

interface ModelConfig {
  name: string;
  patchSize: number;
  mergeSize: number;
  blockSize: number;
  color: string;
}

const MODELS: Record<string, ModelConfig> = {
  'qwen2.5': {
    name: 'Qwen2.5-VL',
    patchSize: 14,
    mergeSize: 2,
    blockSize: 28, // patchSize * mergeSize
    color: 'blue',
  },
  qwen3: {
    name: 'Qwen3-VL',
    patchSize: 16,
    mergeSize: 2,
    blockSize: 32,
    color: 'violet',
  },
};

// ============================================================================
// State Management (Valtio)
// ============================================================================

interface ImageTokenState {
  selectedModel: string;
  width: number;
  height: number;
  imagePreview: string | null;
  isDragging: boolean;
  minPixels: number;
  maxPixels: number;
  showSettings: boolean;
}

const createImageTokenState = (): ImageTokenState => ({
  selectedModel: 'qwen3',
  width: 1024,
  height: 1024,
  imagePreview: null,
  isDragging: false,
  minPixels: 28 * 28,
  maxPixels: 1280 * 28 * 28,
  showSettings: false,
});

// ============================================================================
// Calculation Logic
// ============================================================================

interface CalculationResult {
  snappedW: number;
  snappedH: number;
  gridW: number;
  gridH: number;
  totalTokens: number;
}

function calculateTokens(width: number, height: number, blockSize: number): CalculationResult {
  // Snap dimensions to nearest block multiple
  let snappedW = Math.round(width / blockSize) * blockSize;
  let snappedH = Math.round(height / blockSize) * blockSize;

  // Ensure at least one block
  snappedW = Math.max(snappedW, blockSize);
  snappedH = Math.max(snappedH, blockSize);

  const gridW = snappedW / blockSize;
  const gridH = snappedH / blockSize;
  const totalTokens = gridW * gridH;

  return {
    snappedW,
    snappedH,
    gridW,
    gridH,
    totalTokens,
  };
}

// ============================================================================
// File Handling Utilities
// ============================================================================

function processImageFile(file: File, onLoad: (width: number, height: number, dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      onLoad(img.width, img.height, event.target?.result as string);
    };
    img.src = event.target?.result as string;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// Sub-Components
// ============================================================================

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ selectedModel, onSelectModel }) => {
  return (
    <div className="relative flex rounded-lg bg-slate-100 p-1">
      {Object.entries(MODELS).map(([key, model]) => (
        <button
          key={key}
          onClick={() => onSelectModel(key)}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all duration-200 ${
            selectedModel === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {model.name}
        </button>
      ))}
    </div>
  );
};

interface DimensionInputsProps {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}

const DimensionInputs: React.FC<DimensionInputsProps> = ({ width, height, onWidthChange, onHeightChange }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">宽度 (px)</label>
        <input
          type="number"
          value={width}
          onChange={(e) => onWidthChange(Math.max(1, parseInt(e.target.value) || 0))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">高度 (px)</label>
        <input
          type="number"
          value={height}
          onChange={(e) => onHeightChange(Math.max(1, parseInt(e.target.value) || 0))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
};

interface ImageUploadZoneProps {
  imagePreview: string | null;
  isDragging: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClear: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ImageUploadZone: React.FC<ImageUploadZoneProps> = ({
  imagePreview,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClear,
  fileInputRef,
  onFileSelect,
}) => {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`group relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-all duration-200 ${
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : imagePreview
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
      }`}
      onClick={() => !imagePreview && fileInputRef.current?.click()}
    >
      {imagePreview ? (
        <div className="relative h-full w-full p-2">
          <img src={imagePreview} alt="Preview" className="h-full w-full rounded-lg object-contain" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-3 top-3 rounded-full bg-white/90 p-1 shadow-sm backdrop-blur transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="pointer-events-none space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-110">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-sm text-slate-600">
            <span className="font-semibold text-indigo-600">点击上传</span> 或拖拽图片
          </div>
          <p className="text-xs text-slate-400">支持 JPG, PNG, WEBP</p>
        </div>
      )}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onFileSelect} />
    </div>
  );
};

interface ModelInfoProps {
  config: ModelConfig;
  selectedModel: string;
}

const ModelInfo: React.FC<ModelInfoProps> = ({ config, selectedModel }) => {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        selectedModel === 'qwen3'
          ? 'border-violet-100 bg-violet-50 text-violet-800'
          : 'border-blue-100 bg-blue-50 text-blue-800'
      }`}
    >
      <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="space-y-1">
        <p className="font-semibold">{config.name} 机制:</p>
        <ul className="list-inside list-disc space-y-1 text-xs opacity-90">
          <li>
            ViT Patch Size: <strong>{config.patchSize}px</strong>
          </li>
          <li>
            Merge Window: <strong>{config.mergeSize}x{config.mergeSize}</strong>
          </li>
          <li>
            有效 Token 步长: <strong>{config.blockSize}x{config.blockSize}px</strong>
          </li>
          <li>图片宽高将被调整为 {config.blockSize} 的整数倍。</li>
        </ul>
      </div>
    </div>
  );
};

interface ResultsPanelProps {
  width: number;
  height: number;
  stats: CalculationResult;
  config: ModelConfig;
  selectedModel: string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ width, height, stats, config, selectedModel }) => {
  const blockSize = config.blockSize;

  return (
    <div className="relative flex w-full flex-col justify-between overflow-hidden bg-slate-900 p-6 text-white md:w-1/2 md:p-8">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute right-0 top-0 p-12 opacity-5">
        <ImageIcon className="h-64 w-64" />
      </div>

      <div className="relative z-10 space-y-8">
        <div className="flex items-center justify-between border-b border-slate-700 pb-6">
          <h2 className="text-lg font-medium text-slate-300">计算结果</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
              selectedModel === 'qwen3' ? 'bg-violet-500/20 text-violet-300' : 'bg-blue-500/20 text-blue-300'
            }`}
          >
            {config.name}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">原始尺寸</p>
            <p className="font-mono text-2xl text-white">
              {width} <span className="text-base text-slate-500">x</span> {height}
            </p>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">对齐后尺寸 ({blockSize}px 步长)</p>
            <p className="font-mono text-2xl text-emerald-400">
              {stats.snappedW} <span className="text-base text-emerald-600/70">x</span> {stats.snappedH}
            </p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">Grid 结构 (Tokens)</p>
          <div className="flex items-center gap-3">
            <div className="rounded border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-lg">
              W: {stats.gridW}
            </div>
            <span className="text-slate-500">×</span>
            <div className="rounded border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-lg">
              H: {stats.gridH}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            即每 {blockSize}x{blockSize} 像素区域对应 1 个 Token
          </p>
        </div>

        {/* Main Result */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6 backdrop-blur-sm">
          <p className="mb-1 text-sm font-medium text-slate-400">预估 Visual Tokens 总数</p>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold tracking-tight text-white">{stats.totalTokens.toLocaleString()}</span>
            <span className="font-medium text-slate-500">tokens</span>
          </div>
          {/* Visual representation bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full ${selectedModel === 'qwen3' ? 'bg-violet-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, (stats.totalTokens / 2000) * 100)}%` }}
            ></div>
          </div>
          <p className="mt-2 text-right text-xs text-slate-500">基于 2k token 作为参照 (进度条)</p>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">
        注意：实际推理中可能包含额外的 Vision Start/End 特殊 Token。此工具计算的是图像内容本身占用的 Patch Token 数量。
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const Composite: React.FC = () => {
  const state = useRef(proxy(createImageTokenState())).current;
  const snap = useSnapshot(state);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentConfig = MODELS[snap.selectedModel];
  const stats = calculateTokens(snap.width, snap.height, currentConfig.blockSize);

  // Event Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, (width, height, dataUrl) => {
        state.width = width;
        state.height = height;
        state.imagePreview = dataUrl;
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    state.isDragging = true;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    state.isDragging = false;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    state.isDragging = false;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file, (width, height, dataUrl) => {
        state.width = width;
        state.height = height;
        state.imagePreview = dataUrl;
      });
    }
  };

  const clearImage = () => {
    state.imagePreview = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 font-sans text-slate-800 md:p-8">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl md:flex-row">
        {/* Left Side: Controls */}
        <div className="flex w-full flex-col gap-6 p-6 md:w-1/2 md:p-8">
          {/* Header */}
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Calculator className="h-6 w-6 text-indigo-600" />
              Vision Token Calculator
            </h1>
            <p className="mt-1 text-sm text-slate-500">基于 Patch Size 和动态分辨率计算视觉 Token</p>
          </div>

          {/* Model Selection */}
          <ModelSelector selectedModel={snap.selectedModel} onSelectModel={(model) => (state.selectedModel = model)} />

          {/* Input Area */}
          <div className="space-y-4">
            <DimensionInputs
              width={snap.width}
              height={snap.height}
              onWidthChange={(w) => (state.width = w)}
              onHeightChange={(h) => (state.height = h)}
            />

            {/* Upload Zone */}
            <ImageUploadZone
              imagePreview={snap.imagePreview}
              isDragging={snap.isDragging}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClear={clearImage}
              fileInputRef={fileInputRef}
              onFileSelect={handleImageUpload}
            />
          </div>

          {/* Model Info */}
          <ModelInfo config={currentConfig} selectedModel={snap.selectedModel} />
        </div>

        {/* Right Side: Results */}
        <ResultsPanel
          width={snap.width}
          height={snap.height}
          stats={stats}
          config={currentConfig}
          selectedModel={snap.selectedModel}
        />
      </div>
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export const ImageTokenCounter = {
  Composite,
};
