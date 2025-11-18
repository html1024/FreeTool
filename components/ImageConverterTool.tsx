import React, { useState, useCallback, useEffect } from 'react';
import { decompressFrames, parseGIF } from 'gifuct-js';

// Declare GIF global
declare global {
    interface Window {
        GIF: any;
    }
}

type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp';

const ImageConverterTool: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [targetFormat, setTargetFormat] = useState<ImageFormat>('jpeg');
    const [convertedUrl, setConvertedUrl] = useState<string>('');
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [quality, setQuality] = useState<number>(0.8);
    const [convertedSize, setConvertedSize] = useState<number>(0);
    const [originalSize, setOriginalSize] = useState<number>(0);
    const [gifQuality, setGifQuality] = useState<'low' | 'medium' | 'high'>('high'); // GIF 质量档位

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('请选择图片文件');
            return;
        }

        setSelectedFile(file);
        setOriginalSize(file.size);
        setError(null);
        setConvertedUrl('');
        setConvertedSize(0);

        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPreviewUrl(dataUrl);
            // 自动触发转换
            performConversion(dataUrl, targetFormat, quality, gifQuality);
        };
        reader.readAsDataURL(file);
    }, [targetFormat, quality, gifQuality]);

    const performConversion = useCallback(async (imageDataUrl: string, format: ImageFormat, qualityValue: number, gifQualityLevel: 'low' | 'medium' | 'high' = 'high') => {
        setIsConverting(true);
        setError(null);

        // GIF 质量档位对应的颜色数量
        const gifColorsMap = {
            'low': 64,      // 低质量 - 64 色，文件最小
            'medium': 128,  // 中等质量 - 128 色，平衡
            'high': 256     // 高质量 - 256 色，质量最好
        };
        const colors = gifColorsMap[gifQualityLevel];

        // 如果目标格式是 GIF，需要检查源文件是否是 GIF
        if (format === 'gif' && selectedFile && selectedFile.type === 'image/gif') {
            // 处理 GIF 到 GIF 的压缩（动态 GIF）
            try {
                if (!window.GIF) {
                    setError('GIF 库未加载,请刷新页面重试');
                    setIsConverting(false);
                    return;
                }

                const arrayBuffer = await selectedFile.arrayBuffer();
                const gifData = parseGIF(arrayBuffer);
                const frames = decompressFrames(gifData, true);

                const gif = new window.GIF({
                    workers: 2,
                    quality: 10,
                    workerScript: '/gif.worker.js',
                    width: frames[0].dims.width,
                    height: frames[0].dims.height,
                    transparent: 'rgba(0,0,0,0)',
                    dither: false,
                    colors: colors
                });

                // 为每一帧创建 canvas 并添加到 GIF
                for (const frame of frames) {
                    const canvas = document.createElement('canvas');
                    canvas.width = frame.dims.width;
                    canvas.height = frame.dims.height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) continue;

                    const imageData = new ImageData(
                        new Uint8ClampedArray(frame.patch),
                        frame.dims.width,
                        frame.dims.height
                    );
                    ctx.putImageData(imageData, 0, 0);

                    gif.addFrame(ctx, {
                        copy: true,
                        delay: frame.delay || 100
                    });
                }

                gif.on('finished', (blob: Blob) => {
                    setConvertedSize(blob.size);
                    const url = URL.createObjectURL(blob);
                    setConvertedUrl(url);
                    setIsConverting(false);
                });

                gif.render();
                return;
            } catch (err) {
                console.error('GIF compression error:', err);
                setError('GIF 压缩失败: ' + (err instanceof Error ? err.message : '未知错误'));
                setIsConverting(false);
                return;
            }
        }

        // 其他格式转换（包括静态图片转 GIF）
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                setError('Canvas 上下文创建失败');
                setIsConverting(false);
                return;
            }

            ctx.drawImage(img, 0, 0);

            // GIF 格式特殊处理
            if (format === 'gif') {
                if (!window.GIF) {
                    setError('GIF 库未加载,请刷新页面重试');
                    setIsConverting(false);
                    return;
                }

                try {
                    const gif = new window.GIF({
                        workers: 2,
                        quality: 10,
                        workerScript: '/gif.worker.js',  // 使用本地 worker 文件
                        width: img.width,
                        height: img.height,
                        transparent: 'rgba(0,0,0,0)',
                        background: '#fff',
                        dither: false,
                        colors: colors  // 使用颜色数量参数进行压缩
                    });

                    gif.addFrame(ctx, { copy: true, delay: 0 });

                    gif.on('finished', (blob: Blob) => {
                        setConvertedSize(blob.size);
                        const url = URL.createObjectURL(blob);
                        setConvertedUrl(url);
                        setIsConverting(false);
                    });

                    gif.render();
                } catch (err) {
                    console.error('GIF conversion error:', err);
                    setError('GIF 转换失败');
                    setIsConverting(false);
                }
                return;
            }

            // 其他格式使用 Canvas toBlob
            const mimeType = `image/${format === 'jpeg' ? 'jpeg' : format}`;
            // 为支持压缩的格式设置质量参数
            const useQuality = format === 'jpeg' || format === 'webp';

            canvas.toBlob((blob) => {
                if (!blob) {
                    setError('图片转换失败');
                    setIsConverting(false);
                    return;
                }

                setConvertedSize(blob.size);
                const url = URL.createObjectURL(blob);
                setConvertedUrl(url);
                setIsConverting(false);
            }, mimeType, useQuality ? qualityValue : undefined);
        };

        img.onerror = () => {
            setError('图片加载失败');
            setIsConverting(false);
        };

        img.src = imageDataUrl;
    }, [selectedFile]);

    // 当格式或质量改变时,自动重新转换
    useEffect(() => {
        if (previewUrl) {
            performConversion(previewUrl, targetFormat, quality, gifQuality);
        }
    }, [targetFormat, quality, gifQuality, previewUrl, performConversion]);

    const handleConvert = useCallback(async () => {
        if (!selectedFile || !previewUrl) {
            setError('请先选择图片');
            return;
        }

        performConversion(previewUrl, targetFormat, quality, gifQuality);
    }, [selectedFile, previewUrl, targetFormat, quality, gifQuality, performConversion]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    const handleDownload = useCallback(() => {
        if (!convertedUrl || !selectedFile) return;

        const a = document.createElement('a');
        a.href = convertedUrl;
        const originalName = selectedFile.name.replace(/\.[^/.]+$/, '');
        a.download = `${originalName}.${targetFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [convertedUrl, selectedFile, targetFormat]);

    return (
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-3 text-center">
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 dark:text-white sm:text-5xl">在线图片格式转换</h1>
                    <p className="text-base font-normal text-gray-600 dark:text-gray-400">快速将您的图片转换为 JPG, PNG, WEBP 等多种格式。免费、安全。</p>
                </div>

                {error && (
                    <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <p className="text-red-800 dark:text-red-300 text-sm">{error}</p>
                    </div>
                )}

                <div className="w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark shadow-sm overflow-hidden">
                    {!previewUrl ? (
                        <label className="flex flex-col items-center gap-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 sm:p-14 text-center cursor-pointer hover:border-primary dark:hover:border-primary transition-colors m-6">
                            <span className="material-symbols-outlined text-5xl text-gray-400 dark:text-gray-500">upload_file</span>
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                    {selectedFile ? selectedFile.name : '拖拽图片至此'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">支持 JPG, PNG, BMP, GIF 等格式</p>
                            </div>
                            <span className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-white/10 px-4 text-sm font-bold text-gray-800 dark:text-white transition-colors hover:bg-gray-200 dark:hover:bg-white/20">
                                点击选择文件
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            {/* 左侧：图片预览 */}
                            <div className="relative flex flex-col p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-gray-900 dark:text-white text-base font-semibold leading-normal flex items-center gap-2">
                                        <span className="material-symbols-outlined text-xl">image</span>
                                        原始图片
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setSelectedFile(null);
                                            setPreviewUrl('');
                                            setConvertedUrl('');
                                            setConvertedSize(0);
                                            setOriginalSize(0);
                                        }}
                                        className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                                    >
                                        更换图片
                                    </button>
                                </div>
                                <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 min-h-[300px]">
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        className="max-w-full max-h-[400px] object-contain"
                                    />
                                </div>
                                {selectedFile && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                        {selectedFile.name}
                                    </p>
                                )}
                            </div>

                            {/* 右侧：转换选项 */}
                            <div className="relative flex flex-col p-6 bg-gray-50/50 dark:bg-gray-800/30 gap-6">
                                <div className="space-y-4">
                                    <h3 className="px-1 text-lg font-bold text-gray-900 dark:text-white">转换为：</h3>
                                    <div className="flex h-12 flex-1 items-center justify-center rounded-lg bg-gray-100 dark:bg-white/5 p-1.5">
                                        {(['jpeg', 'png', 'webp', 'gif'] as ImageFormat[]).map((format) => (
                                            <label
                                                key={format}
                                                className="flex h-full flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-md px-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors has-[:checked]:bg-white has-[:checked]:text-gray-900 has-[:checked]:shadow-sm dark:has-[:checked]:bg-gray-700 dark:has-[:checked]:text-white"
                                            >
                                                <span className="truncate uppercase">{format}</span>
                                                <input
                                                    className="sr-only"
                                                    name="format-select"
                                                    type="radio"
                                                    value={format}
                                                    checked={targetFormat === format}
                                                    onChange={(e) => setTargetFormat(e.target.value as ImageFormat)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {(targetFormat === 'jpeg' || targetFormat === 'webp') && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">图片质量</h3>
                                            <span className="text-sm font-medium text-primary">{Math.round(quality * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1"
                                            step="0.05"
                                            value={quality}
                                            onChange={(e) => setQuality(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <p className="text-xs text-gray-500 dark:text-gray-400">💡 降低质量可以减小文件大小,建议值: 70-85%</p>
                                    </div>
                                )}

                                {targetFormat === 'png' && (
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <p className="text-xs text-blue-600 dark:text-blue-400">
                                            💡 PNG 是无损格式,不支持质量压缩。如需减小文件大小,建议转换为 JPEG 或 WebP 格式。
                                        </p>
                                    </div>
                                )}

                                {targetFormat === 'gif' && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between px-1">
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">压缩质量</h3>
                                            <span className="text-sm font-medium text-primary">
                                                {gifQuality === 'high' && '高质量'}
                                                {gifQuality === 'medium' && '中等'}
                                                {gifQuality === 'low' && '高压缩'}
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="2"
                                            step="1"
                                            value={gifQuality === 'low' ? 0 : gifQuality === 'medium' ? 1 : 2}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setGifQuality(val === 0 ? 'low' : val === 1 ? 'medium' : 'high');
                                            }}
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                                            <span>高压缩</span>
                                            <span>中等</span>
                                            <span>高质量</span>
                                        </div>
                                    </div>
                                )}

                                {(originalSize > 0 || convertedSize > 0) && (
                                    <div className="flex flex-col gap-2 px-1 text-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-gray-600 dark:text-gray-400">原始大小: </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">{formatFileSize(originalSize)}</span>
                                            </div>
                                            {convertedSize > 0 && (
                                                <div>
                                                    <span className="text-gray-600 dark:text-gray-400">转换后: </span>
                                                    <span className={`font-semibold ${convertedSize < originalSize ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                        {formatFileSize(convertedSize)}
                                                    </span>
                                                    <span className={`ml-1 text-xs ${convertedSize < originalSize ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                        ({convertedSize < originalSize ? '-' : '+'}{Math.abs(Math.round((convertedSize - originalSize) / originalSize * 100))}%)
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {convertedSize > originalSize && targetFormat === 'png' && (
                                            <p className="text-xs text-orange-600 dark:text-orange-400">
                                                ⚠️ 文件变大是因为 Canvas 导出的 PNG 未经过优化压缩。原始文件可能已经过高度压缩。
                                            </p>
                                        )}
                                    </div>
                                )}

                                <button
                                    onClick={handleDownload}
                                    disabled={!convertedUrl || isConverting}
                                    className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-6 text-base font-bold text-white shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 mt-auto"
                                >
                                    {isConverting ? (
                                        <>
                                            <div className="spinner"></div>
                                            <span className="truncate">转换中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">download</span>
                                            <span className="truncate">下载转换后的图片</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageConverterTool;
