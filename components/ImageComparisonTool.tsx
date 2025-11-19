import React, { useState, useRef, useCallback } from 'react';

interface ImageLayer {
    id: string;
    name: string;
    src: string;
    visible: boolean;
    x: number;
    y: number;
    width: number;
    height: number;
    originalWidth: number;
    originalHeight: number;
    scale: number;
    rotation: number;
    opacity: number;
    zIndex: number;
}

interface TextLayer {
    id: string;
    name: string;
    text: string;
    visible: boolean;
    x: number;
    y: number;
    fontSize: number;
    fontFamily: string;
    color: string;
    rotation: number;
    opacity: number;
    zIndex: number;
}

type Layer = (ImageLayer | TextLayer) & { type: 'image' | 'text' };

const ImageComparisonTool: React.FC = () => {
    const [layers, setLayers] = useState<Layer[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 绘制画布
    const drawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 清空画布
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制棋盘背景
        const gridSize = 20;
        for (let i = 0; i < canvas.width; i += gridSize) {
            for (let j = 0; j < canvas.height; j += gridSize) {
                if ((i / gridSize + j / gridSize) % 2 === 0) {
                    ctx.fillStyle = '#ffffff';
                } else {
                    ctx.fillStyle = '#e0e0e0';
                }
                ctx.fillRect(i, j, gridSize, gridSize);
            }
        }

        // 按 zIndex 排序图层
        const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

        // 绘制所有可见图层
        sortedLayers.forEach(layer => {
            if (!layer.visible) return;

            ctx.save();
            ctx.globalAlpha = layer.opacity;

            if (layer.type === 'image') {
                const imgLayer = layer as ImageLayer;
                const img = new Image();
                img.src = imgLayer.src;

                ctx.translate(imgLayer.x + imgLayer.width / 2, imgLayer.y + imgLayer.height / 2);
                ctx.rotate((imgLayer.rotation * Math.PI) / 180);
                ctx.drawImage(img, -imgLayer.width / 2, -imgLayer.height / 2, imgLayer.width, imgLayer.height);

                // 选中状态边框
                if (selectedLayerId === layer.id) {
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-imgLayer.width / 2, -imgLayer.height / 2, imgLayer.width, imgLayer.height);

                    // 绘制控制点
                    const handleSize = 8;
                    ctx.fillStyle = '#00FF00';
                    ctx.fillRect(-imgLayer.width / 2 - handleSize / 2, -imgLayer.height / 2 - handleSize / 2, handleSize, handleSize);
                    ctx.fillRect(imgLayer.width / 2 - handleSize / 2, -imgLayer.height / 2 - handleSize / 2, handleSize, handleSize);
                    ctx.fillRect(-imgLayer.width / 2 - handleSize / 2, imgLayer.height / 2 - handleSize / 2, handleSize, handleSize);
                    ctx.fillRect(imgLayer.width / 2 - handleSize / 2, imgLayer.height / 2 - handleSize / 2, handleSize, handleSize);
                }
            } else if (layer.type === 'text') {
                const textLayer = layer as TextLayer;
                ctx.translate(textLayer.x, textLayer.y);
                ctx.rotate((textLayer.rotation * Math.PI) / 180);
                ctx.font = `${textLayer.fontSize}px ${textLayer.fontFamily}`;
                ctx.fillStyle = textLayer.color;
                ctx.fillText(textLayer.text, 0, 0);

                // 选中状态边框
                if (selectedLayerId === layer.id) {
                    const metrics = ctx.measureText(textLayer.text);
                    ctx.strokeStyle = '#00FF00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(-5, -textLayer.fontSize - 5, metrics.width + 10, textLayer.fontSize + 10);
                }
            }

            ctx.restore();
        });
    }, [layers, selectedLayerId]);

    // 重绘画布
    React.useEffect(() => {
        drawCanvas();
    }, [drawCanvas]);

    // 添加图片
    const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    const maxSize = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height / width) * maxSize;
                            width = maxSize;
                        } else {
                            width = (width / height) * maxSize;
                            height = maxSize;
                        }
                    }

                    const newLayer: Layer = {
                        id: Date.now().toString() + index,
                        type: 'image',
                        name: `图片 ${layers.length + index + 1}`,
                        src: event.target?.result as string,
                        visible: true,
                        x: 50 + index * 30,
                        y: 50 + index * 30,
                        width,
                        height,
                        originalWidth: img.width,
                        originalHeight: img.height,
                        scale: 1,
                        rotation: 0,
                        opacity: 1,
                        zIndex: layers.length + index,
                    };

                    setLayers(prev => [...prev, newLayer]);
                };
                img.src = event.target?.result as string;
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    // 添加文本
    const handleAddText = () => {
        const newLayer: Layer = {
            id: Date.now().toString(),
            type: 'text',
            name: `文本 ${layers.filter(l => l.type === 'text').length + 1}`,
            text: '双击编辑文本',
            visible: true,
            x: canvasSize.width / 2,
            y: canvasSize.height / 2,
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#000000',
            rotation: 0,
            opacity: 1,
            zIndex: layers.length,
        };

        setLayers(prev => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
    };

    // 获取鼠标在canvas上的坐标
    const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    // 检测点击的图层
    const getLayerAtPoint = (x: number, y: number): Layer | null => {
        const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

        for (const layer of sortedLayers) {
            if (!layer.visible) continue;

            if (layer.type === 'image') {
                const imgLayer = layer as ImageLayer;
                if (
                    x >= imgLayer.x &&
                    x <= imgLayer.x + imgLayer.width &&
                    y >= imgLayer.y &&
                    y <= imgLayer.y + imgLayer.height
                ) {
                    return layer;
                }
            } else if (layer.type === 'text') {
                const textLayer = layer as TextLayer;
                const canvas = canvasRef.current;
                if (!canvas) continue;
                const ctx = canvas.getContext('2d');
                if (!ctx) continue;

                ctx.font = `${textLayer.fontSize}px ${textLayer.fontFamily}`;
                const metrics = ctx.measureText(textLayer.text);

                if (
                    x >= textLayer.x - 5 &&
                    x <= textLayer.x + metrics.width + 5 &&
                    y >= textLayer.y - textLayer.fontSize - 5 &&
                    y <= textLayer.y + 5
                ) {
                    return layer;
                }
            }
        }

        return null;
    };

    // 鼠标按下
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const point = getCanvasPoint(e);
        const layer = getLayerAtPoint(point.x, point.y);

        if (layer) {
            setSelectedLayerId(layer.id);
            setIsDragging(true);
            setDragStart(point);
        } else {
            setSelectedLayerId(null);
        }
    };

    // 鼠标移动
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging || !dragStart || !selectedLayerId) return;

        const point = getCanvasPoint(e);
        const dx = point.x - dragStart.x;
        const dy = point.y - dragStart.y;

        setLayers(prev =>
            prev.map(layer => {
                if (layer.id === selectedLayerId) {
                    return {
                        ...layer,
                        x: layer.x + dx,
                        y: layer.y + dy,
                    };
                }
                return layer;
            })
        );

        setDragStart(point);
    };

    // 鼠标释放
    const handleMouseUp = () => {
        setIsDragging(false);
        setDragStart(null);
    };

    // 切换图层可见性
    const toggleLayerVisibility = (id: string) => {
        setLayers(prev =>
            prev.map(layer => (layer.id === id ? { ...layer, visible: !layer.visible } : layer))
        );
    };

    // 删除图层
    const deleteLayer = (id: string) => {
        setLayers(prev => prev.filter(layer => layer.id !== id));
        if (selectedLayerId === id) {
            setSelectedLayerId(null);
        }
    };

    // 调整图层顺序
    const moveLayer = (id: string, direction: 'up' | 'down') => {
        setLayers(prev => {
            const index = prev.findIndex(l => l.id === id);
            if (index === -1) return prev;

            const newLayers = [...prev];
            if (direction === 'up' && index < newLayers.length - 1) {
                [newLayers[index].zIndex, newLayers[index + 1].zIndex] = [
                    newLayers[index + 1].zIndex,
                    newLayers[index].zIndex,
                ];
            } else if (direction === 'down' && index > 0) {
                [newLayers[index].zIndex, newLayers[index - 1].zIndex] = [
                    newLayers[index - 1].zIndex,
                    newLayers[index].zIndex,
                ];
            }

            return newLayers;
        });
    };

    // 更新选中图层的属性
    const updateSelectedLayer = (updates: Partial<Layer>) => {
        if (!selectedLayerId) return;

        setLayers(prev =>
            prev.map(layer => {
                if (layer.id === selectedLayerId) {
                    return { ...layer, ...updates };
                }
                return layer;
            })
        );
    };

    const selectedLayer = layers.find(l => l.id === selectedLayerId);

    return (
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-3 text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white sm:text-5xl">
                        多图移动对比
                    </h1>
                    <p className="text-base font-normal text-gray-600 dark:text-gray-400">
                        在一个画布中导入多张图片，支持图层管理、位置调整和文本添加
                    </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">
                    {/* 左侧：画布区域 */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">画布</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
                                    style={{ backgroundColor: '#607AFB' }}
                                >
                                    <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                                    添加图片
                                </button>
                                <button
                                    onClick={handleAddText}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <span className="material-symbols-outlined text-base">text_fields</span>
                                    添加文本
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleAddImage}
                                    className="hidden"
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 overflow-auto">
                            <canvas
                                ref={canvasRef}
                                width={canvasSize.width}
                                height={canvasSize.height}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                                onMouseLeave={handleMouseUp}
                                className="max-w-full max-h-[600px] cursor-move shadow-lg"
                            />
                        </div>

                        {selectedLayer && (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    当前选中: {selectedLayer.name}
                                </h4>

                                {selectedLayer.type === 'image' && (
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                                缩放: {Math.round((selectedLayer as ImageLayer).scale * 100)}%
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                value={(selectedLayer as ImageLayer).scale * 100}
                                                onChange={e => {
                                                    const scale = parseFloat(e.target.value) / 100;
                                                    const imgLayer = selectedLayer as ImageLayer;
                                                    updateSelectedLayer({
                                                        scale,
                                                        width: imgLayer.originalWidth * scale,
                                                        height: imgLayer.originalHeight * scale,
                                                    });
                                                }}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedLayer.type === 'text' && (
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                                文本内容
                                            </label>
                                            <input
                                                type="text"
                                                value={(selectedLayer as TextLayer).text}
                                                onChange={e => updateSelectedLayer({ text: e.target.value })}
                                                className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                                字体大小: {(selectedLayer as TextLayer).fontSize}px
                                            </label>
                                            <input
                                                type="range"
                                                min="12"
                                                max="120"
                                                value={(selectedLayer as TextLayer).fontSize}
                                                onChange={e =>
                                                    updateSelectedLayer({ fontSize: parseInt(e.target.value) })
                                                }
                                                className="w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                                颜色
                                            </label>
                                            <input
                                                type="color"
                                                value={(selectedLayer as TextLayer).color}
                                                onChange={e => updateSelectedLayer({ color: e.target.value })}
                                                className="w-full h-8 rounded cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                        旋转: {selectedLayer.rotation}°
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={selectedLayer.rotation}
                                        onChange={e => updateSelectedLayer({ rotation: parseInt(e.target.value) })}
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                                        不透明度: {Math.round(selectedLayer.opacity * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={selectedLayer.opacity * 100}
                                        onChange={e =>
                                            updateSelectedLayer({ opacity: parseFloat(e.target.value) / 100 })
                                        }
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右侧：图层面板 */}
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark p-6 shadow-sm">
                        <div className="flex flex-col gap-4 min-h-[680px]">
                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">图层</h3>

                            {layers.length === 0 ? (
                                <div className="flex-1 flex items-center justify-center text-center text-gray-500 dark:text-gray-400 text-sm">
                                    <div className="space-y-2">
                                        <span className="material-symbols-outlined text-4xl">layers</span>
                                        <p>暂无图层</p>
                                        <p className="text-xs">点击上方按钮添加图片或文本</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-2">
                                    {[...layers]
                                        .sort((a, b) => b.zIndex - a.zIndex)
                                        .map(layer => (
                                            <div
                                                key={layer.id}
                                                className={`p-3 rounded-lg border transition-all cursor-pointer ${
                                                    selectedLayerId === layer.id
                                                        ? 'border-primary bg-primary/10'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                                onClick={() => setSelectedLayerId(layer.id)}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            toggleLayerVisibility(layer.id);
                                                        }}
                                                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                    >
                                                        <span className="material-symbols-outlined text-base">
                                                            {layer.visible ? 'visibility' : 'visibility_off'}
                                                        </span>
                                                    </button>
                                                    <span className="material-symbols-outlined text-base text-gray-600 dark:text-gray-400">
                                                        {layer.type === 'image' ? 'image' : 'text_fields'}
                                                    </span>
                                                    <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                                                        {layer.name}
                                                    </span>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            deleteLayer(layer.id);
                                                        }}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <span className="material-symbols-outlined text-base">
                                                            delete
                                                        </span>
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            moveLayer(layer.id, 'up');
                                                        }}
                                                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            arrow_upward
                                                        </span>
                                                    </button>
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            moveLayer(layer.id, 'down');
                                                        }}
                                                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">
                                                            arrow_downward
                                                        </span>
                                                    </button>
                                                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                                                        {Math.round(layer.opacity * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    const canvas = canvasRef.current;
                                    if (!canvas) return;

                                    canvas.toBlob(blob => {
                                        if (!blob) return;
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `comparison-${Date.now()}.png`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                    });
                                }}
                                disabled={layers.length === 0}
                                style={{ backgroundColor: '#607AFB' }}
                                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-base">download</span>
                                导出画布
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageComparisonTool;
