import React, { useState, useRef, useCallback, useEffect } from 'react';

type EditorTool = 'select' | 'crop' | 'mosaic' | 'draw';
type DrawMode = 'pen' | 'line' | 'rect' | 'circle';

interface Point {
    x: number;
    y: number;
}

const ImageEditorTool: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imageSrc, setImageSrc] = useState<string>('');
    const [activeTool, setActiveTool] = useState<EditorTool>('select');
    const [drawMode, setDrawMode] = useState<DrawMode>('pen');
    const [drawColor, setDrawColor] = useState<string>('#FF0000');
    const [lineWidth, setLineWidth] = useState<number>(3);
    const [mosaicSize, setMosaicSize] = useState<number>(10);

    // 裁剪相关状态
    const [cropStart, setCropStart] = useState<Point | null>(null);
    const [cropEnd, setCropEnd] = useState<Point | null>(null);
    const [isCropping, setIsCropping] = useState<boolean>(false);

    // 绘制相关状态
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [drawStart, setDrawStart] = useState<Point | null>(null);
    const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);

    // 分辨率修改
    const [targetWidth, setTargetWidth] = useState<number>(0);
    const [targetHeight, setTargetHeight] = useState<number>(0);
    const [originalWidth, setOriginalWidth] = useState<number>(0);
    const [originalHeight, setOriginalHeight] = useState<number>(0);
    const [maintainRatio, setMaintainRatio] = useState<boolean>(true);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement | null>(null);

    // 处理文件选择
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setImageSrc(dataUrl);

            const img = new Image();
            img.onload = () => {
                imageRef.current = img;
                setOriginalWidth(img.width);
                setOriginalHeight(img.height);
                setTargetWidth(img.width);
                setTargetHeight(img.height);

                const canvas = canvasRef.current;
                if (canvas) {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0);
                        saveHistory(ctx);
                    }
                }
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
    }, []);

    // 保存历史记录
    const saveHistory = (ctx: CanvasRenderingContext2D) => {
        const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        setDrawHistory(prev => [...prev, imageData]);
    };

    // 撤销
    const handleUndo = () => {
        if (drawHistory.length > 1) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const newHistory = [...drawHistory];
            newHistory.pop();
            const lastState = newHistory[newHistory.length - 1];
            ctx.putImageData(lastState, 0, 0);
            setDrawHistory(newHistory);
        }
    };

    // 获取鼠标在canvas上的坐标
    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    // 处理鼠标按下
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const point = getCanvasPoint(e);

        if (activeTool === 'crop') {
            setIsCropping(true);
            setCropStart(point);
            setCropEnd(point);
        } else if (activeTool === 'draw' || activeTool === 'mosaic') {
            setIsDrawing(true);
            setDrawStart(point);
        }
    };

    // 处理鼠标移动
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const point = getCanvasPoint(e);

        if (isCropping && cropStart) {
            setCropEnd(point);

            // 绘制裁剪框预览
            if (drawHistory.length > 0) {
                const lastState = drawHistory[drawHistory.length - 1];
                ctx.putImageData(lastState, 0, 0);
            }

            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(
                cropStart.x,
                cropStart.y,
                point.x - cropStart.x,
                point.y - cropStart.y
            );
            ctx.setLineDash([]);
        } else if (isDrawing && drawStart) {
            if (activeTool === 'mosaic') {
                // 马赛克效果
                applyMosaic(ctx, point);
            } else if (activeTool === 'draw') {
                if (drawMode === 'pen') {
                    ctx.strokeStyle = drawColor;
                    ctx.lineWidth = lineWidth;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    ctx.moveTo(drawStart.x, drawStart.y);
                    ctx.lineTo(point.x, point.y);
                    ctx.stroke();
                    setDrawStart(point);
                } else {
                    // 其他绘图模式需要先恢复上一状态
                    if (drawHistory.length > 0) {
                        const lastState = drawHistory[drawHistory.length - 1];
                        ctx.putImageData(lastState, 0, 0);
                    }

                    ctx.strokeStyle = drawColor;
                    ctx.lineWidth = lineWidth;

                    if (drawMode === 'line') {
                        ctx.beginPath();
                        ctx.moveTo(drawStart.x, drawStart.y);
                        ctx.lineTo(point.x, point.y);
                        ctx.stroke();
                    } else if (drawMode === 'rect') {
                        ctx.strokeRect(
                            drawStart.x,
                            drawStart.y,
                            point.x - drawStart.x,
                            point.y - drawStart.y
                        );
                    } else if (drawMode === 'circle') {
                        const radius = Math.sqrt(
                            Math.pow(point.x - drawStart.x, 2) +
                            Math.pow(point.y - drawStart.y, 2)
                        );
                        ctx.beginPath();
                        ctx.arc(drawStart.x, drawStart.y, radius, 0, 2 * Math.PI);
                        ctx.stroke();
                    }
                }
            }
        }
    };

    // 马赛克效果
    const applyMosaic = (ctx: CanvasRenderingContext2D, point: Point) => {
        const size = mosaicSize;
        const x = Math.floor(point.x / size) * size;
        const y = Math.floor(point.y / size) * size;

        const imageData = ctx.getImageData(x, y, size, size);
        const pixels = imageData.data;

        let r = 0, g = 0, b = 0;
        const pixelCount = size * size;

        for (let i = 0; i < pixels.length; i += 4) {
            r += pixels[i];
            g += pixels[i + 1];
            b += pixels[i + 2];
        }

        r = Math.floor(r / pixelCount);
        g = Math.floor(g / pixelCount);
        b = Math.floor(b / pixelCount);

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, size, size);
    };

    // 处理鼠标释放
    const handleMouseUp = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (isCropping && cropStart && cropEnd) {
            // 执行裁剪
            const x = Math.min(cropStart.x, cropEnd.x);
            const y = Math.min(cropStart.y, cropEnd.y);
            const width = Math.abs(cropEnd.x - cropStart.x);
            const height = Math.abs(cropEnd.y - cropStart.y);

            if (width > 10 && height > 10) {
                const imageData = ctx.getImageData(x, y, width, height);
                canvas.width = width;
                canvas.height = height;
                ctx.putImageData(imageData, 0, 0);

                setTargetWidth(width);
                setTargetHeight(height);
                setOriginalWidth(width);
                setOriginalHeight(height);
                setDrawHistory([ctx.getImageData(0, 0, width, height)]);
            }

            setIsCropping(false);
            setCropStart(null);
            setCropEnd(null);
        } else if (isDrawing) {
            saveHistory(ctx);
            setIsDrawing(false);
            setDrawStart(null);
        }
    };

    // 修改分辨率
    const handleResize = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;

        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = targetWidth;
        canvas.height = targetHeight;
        ctx.drawImage(tempCanvas, 0, 0, targetWidth, targetHeight);

        setOriginalWidth(targetWidth);
        setOriginalHeight(targetHeight);
        saveHistory(ctx);
    };

    // 宽度变化处理
    const handleWidthChange = (value: number) => {
        setTargetWidth(value);
        if (maintainRatio && originalWidth > 0) {
            setTargetHeight(Math.round(value * originalHeight / originalWidth));
        }
    };

    // 高度变化处理
    const handleHeightChange = (value: number) => {
        setTargetHeight(value);
        if (maintainRatio && originalHeight > 0) {
            setTargetWidth(Math.round(value * originalWidth / originalHeight));
        }
    };

    // 导出图片
    const handleExport = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.toBlob((blob) => {
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `edited-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3 text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white sm:text-5xl">
                        图片快速编辑
                    </h1>
                    <p className="text-base font-normal text-gray-600 dark:text-gray-400">
                        支持裁剪、调整分辨率、涂鸦、马赛克等功能
                    </p>
                </div>

                {!imageSrc ? (
                    <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark shadow-sm">
                        <label className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 sm:p-14 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors m-6">
                            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-500">
                                upload_file
                            </span>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    拖拽图片至此或点击选择
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    支持 JPG, PNG, GIF 等格式
                                </p>
                            </div>
                            <span className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-white/10 px-4 text-sm font-bold text-gray-800 dark:text-white transition-colors hover:bg-gray-200 dark:hover:bg-white/20">
                                选择图片
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
                        {/* 左侧：编辑区域 */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    编辑区域
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUndo}
                                        disabled={drawHistory.length <= 1}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span className="material-symbols-outlined text-base">undo</span>
                                        撤销
                                    </button>
                                    <button
                                        onClick={() => {
                                            setImageSrc('');
                                            setSelectedFile(null);
                                            setDrawHistory([]);
                                        }}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <span className="material-symbols-outlined text-base">refresh</span>
                                        更换图片
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-auto">
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    className="max-w-full max-h-[600px] cursor-crosshair"
                                    style={{
                                        cursor: activeTool === 'select' ? 'default' :
                                               activeTool === 'crop' ? 'crosshair' :
                                               activeTool === 'mosaic' ? 'cell' : 'crosshair'
                                    }}
                                />
                            </div>
                        </div>

                        {/* 右侧：工具栏 */}
                        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm flex flex-col gap-6">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                                    工具
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { id: 'select', icon: 'touch_app', label: '选择' },
                                        { id: 'crop', icon: 'crop', label: '裁剪' },
                                        { id: 'draw', icon: 'brush', label: '涂鸦' },
                                        { id: 'mosaic', icon: 'grid_on', label: '马赛克' }
                                    ].map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setActiveTool(tool.id as EditorTool)}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${
                                                activeTool === tool.id
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary/50'
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-2xl">
                                                {tool.icon}
                                            </span>
                                            <span className="text-xs font-medium">{tool.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {activeTool === 'draw' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        绘图模式
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {[
                                            { id: 'pen', icon: 'edit', label: '画笔' },
                                            { id: 'line', icon: 'show_chart', label: '直线' },
                                            { id: 'rect', icon: 'crop_square', label: '矩形' },
                                            { id: 'circle', icon: 'circle', label: '圆形' }
                                        ].map((mode) => (
                                            <button
                                                key={mode.id}
                                                onClick={() => setDrawMode(mode.id as DrawMode)}
                                                className={`flex items-center gap-2 p-2 rounded-lg border text-xs transition-all ${
                                                    drawMode === mode.id
                                                        ? 'border-primary bg-primary/10 text-primary'
                                                        : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200'
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-base">
                                                    {mode.icon}
                                                </span>
                                                {mode.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                                颜色
                                            </label>
                                            <input
                                                type="color"
                                                value={drawColor}
                                                onChange={(e) => setDrawColor(e.target.value)}
                                                className="w-full h-8 rounded cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                                线条粗细: {lineWidth}px
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="20"
                                                value={lineWidth}
                                                onChange={(e) => setLineWidth(Number(e.target.value))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTool === 'mosaic' && (
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                        马赛克设置
                                    </h3>
                                    <div>
                                        <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                            马赛克大小: {mosaicSize}px
                                        </label>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={mosaicSize}
                                            onChange={(e) => setMosaicSize(Number(e.target.value))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                    修改分辨率
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-600 dark:text-gray-400 w-12">
                                            宽度
                                        </label>
                                        <input
                                            type="number"
                                            value={targetWidth}
                                            onChange={(e) => handleWidthChange(Number(e.target.value))}
                                            className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                                        />
                                        <span className="text-xs text-gray-500">px</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <label className="text-xs text-gray-600 dark:text-gray-400 w-12">
                                            高度
                                        </label>
                                        <input
                                            type="number"
                                            value={targetHeight}
                                            onChange={(e) => handleHeightChange(Number(e.target.value))}
                                            className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                                        />
                                        <span className="text-xs text-gray-500">px</span>
                                    </div>
                                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={maintainRatio}
                                            onChange={(e) => setMaintainRatio(e.target.checked)}
                                            className="rounded"
                                        />
                                        保持宽高比
                                    </label>
                                    <button
                                        onClick={handleResize}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        应用分辨率
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleExport}
                                style={{ backgroundColor: '#607AFB' }}
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90"
                            >
                                <span className="material-symbols-outlined text-base">download</span>
                                导出图片
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageEditorTool;
