import React, { useState, useRef, useCallback, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

type ImageFormat = 'png' | 'jpeg';
type ImageQuality = 'low' | 'medium' | 'high';

const PdfToImageTool: React.FC = () => {
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    const [convertProgress, setConvertProgress] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [imageFormat, setImageFormat] = useState<ImageFormat>('png');
    const [imageQuality, setImageQuality] = useState<ImageQuality>('high');
    const [pageGap, setPageGap] = useState<number>(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // 配置 PDF.js worker
    useEffect(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }, []);

    // 质量对应的缩放比例
    const qualityScaleMap: Record<ImageQuality, number> = {
        low: 1.0,
        medium: 1.5,
        high: 2.0,
    };

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            setErrorMessage('请选择PDF文件');
            return;
        }

        setPdfFile(file);
        setErrorMessage('');
        setConvertProgress(0);
        setCurrentPage(0);
        setTotalPages(0);
        setPreviewUrl('');
    }, []);

    const handleConvert = useCallback(async () => {
        if (!pdfFile) return;

        setIsConverting(true);
        setErrorMessage('');
        setConvertProgress(0);
        setCurrentPage(0);
        setPreviewUrl('');

        try {
            // 读取PDF文件
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const numPages = pdf.numPages;
            setTotalPages(numPages);

            const scale = qualityScaleMap[imageQuality];
            const pageCanvases: HTMLCanvasElement[] = [];
            let totalWidth = 0;
            let totalHeight = 0;

            // 第一步：渲染每一页到单独的 canvas
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                setCurrentPage(pageNum);

                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) {
                    throw new Error('无法创建canvas上下文');
                }

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await page.render({
                    canvasContext: context,
                    viewport: viewport,
                }).promise;

                pageCanvases.push(canvas);

                // 更新尺寸
                totalWidth = Math.max(totalWidth, viewport.width);
                totalHeight += viewport.height;

                // 更新进度 (前50%用于渲染)
                const progress = Math.round((pageNum / numPages) * 50);
                setConvertProgress(progress);
            }

            // 加上页面间距
            totalHeight += pageGap * (numPages - 1);

            // 第二步：拼接成长图
            setConvertProgress(55);
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = totalWidth;
            finalCanvas.height = totalHeight;

            const finalContext = finalCanvas.getContext('2d');
            if (!finalContext) {
                throw new Error('无法创建最终canvas上下文');
            }

            // 设置白色背景
            finalContext.fillStyle = '#ffffff';
            finalContext.fillRect(0, 0, totalWidth, totalHeight);

            // 拼接每一页
            let currentY = 0;
            for (let i = 0; i < pageCanvases.length; i++) {
                const pageCanvas = pageCanvases[i];
                // 居中绘制（如果页面宽度不一致）
                const offsetX = (totalWidth - pageCanvas.width) / 2;
                finalContext.drawImage(pageCanvas, offsetX, currentY);
                currentY += pageCanvas.height + pageGap;

                // 更新进度 (后45%用于拼接)
                const progress = 55 + Math.round(((i + 1) / pageCanvases.length) * 40);
                setConvertProgress(progress);
            }

            // 第三步：导出图片
            setConvertProgress(95);
            const mimeType = imageFormat === 'png' ? 'image/png' : 'image/jpeg';
            const quality = imageFormat === 'jpeg' ? 0.92 : undefined;

            finalCanvas.toBlob((blob) => {
                if (!blob) {
                    setErrorMessage('图片生成失败');
                    setIsConverting(false);
                    return;
                }

                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setConvertProgress(100);
                setIsConverting(false);
            }, mimeType, quality);

        } catch (error) {
            console.error('转换失败:', error);
            setErrorMessage(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
            setIsConverting(false);
        }
    }, [pdfFile, imageFormat, imageQuality, pageGap]);

    const handleDownload = useCallback(() => {
        if (!previewUrl || !pdfFile) return;

        const a = document.createElement('a');
        a.href = previewUrl;
        const fileName = pdfFile.name.replace('.pdf', `_长图.${imageFormat}`);
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }, [previewUrl, pdfFile, imageFormat]);

    const handleClearFile = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPdfFile(null);
        setErrorMessage('');
        setConvertProgress(0);
        setCurrentPage(0);
        setTotalPages(0);
        setPreviewUrl('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [previewUrl]);

    return (
        <div className="flex w-full flex-col items-center px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex w-full max-w-4xl flex-col items-center gap-2 text-center mb-8">
                <p className="text-3xl font-black leading-tight tracking-tighter text-gray-900 dark:text-white sm:text-4xl">
                    PDF 转长图
                </p>
                <p className="text-base font-normal text-gray-500 dark:text-gray-400">
                    将PDF文件的所有页面拼接成一张长图
                </p>
            </div>

            <div className="w-full max-w-4xl flex flex-col gap-6">
                {/* 上传区域 */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/20 shadow-sm p-6">
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                选择PDF文件
                            </label>
                            <div className="flex gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,application/pdf"
                                    onChange={handleFileSelect}
                                    className="flex-1 text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:opacity-90"
                                />
                                {pdfFile && !isConverting && (
                                    <button
                                        onClick={handleClearFile}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                        清除
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 文件信息 */}
                        {pdfFile && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-3xl">
                                        picture_as_pdf
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {pdfFile.name}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                                            {totalPages > 0 && ` · ${totalPages} 页`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 转换选项 */}
                        {pdfFile && !previewUrl && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* 图片格式 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        图片格式
                                    </label>
                                    <div className="flex gap-2">
                                        {(['png', 'jpeg'] as ImageFormat[]).map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => setImageFormat(format)}
                                                disabled={isConverting}
                                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    imageFormat === format
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                } disabled:opacity-50`}
                                            >
                                                {format.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 图片质量 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        图片质量
                                    </label>
                                    <div className="flex gap-2">
                                        {([
                                            { value: 'low', label: '低' },
                                            { value: 'medium', label: '中' },
                                            { value: 'high', label: '高' },
                                        ] as { value: ImageQuality; label: string }[]).map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => setImageQuality(option.value)}
                                                disabled={isConverting}
                                                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    imageQuality === option.value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                } disabled:opacity-50`}
                                            >
                                                {option.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 页面间距 */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        页面间距: {pageGap}px
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="50"
                                        step="5"
                                        value={pageGap}
                                        onChange={(e) => setPageGap(parseInt(e.target.value))}
                                        disabled={isConverting}
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
                                    />
                                </div>
                            </div>
                        )}

                        {/* 错误提示 */}
                        {errorMessage && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-600 dark:text-red-400">
                                        error
                                    </span>
                                    <p className="text-sm text-red-600 dark:text-red-400">
                                        {errorMessage}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 转换按钮 */}
                        {pdfFile && !isConverting && !previewUrl && (
                            <button
                                onClick={handleConvert}
                                disabled={isConverting}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white border border-gray-300 dark:border-gray-600 rounded-lg font-semibold shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                <span className="material-symbols-outlined text-xl">transform</span>
                                <span>开始转换</span>
                            </button>
                        )}

                        {/* 转换进度 */}
                        {isConverting && (
                            <>
                                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                                    <span>
                                        {convertProgress < 50
                                            ? `正在渲染第 ${currentPage} / ${totalPages} 页...`
                                            : convertProgress < 95
                                            ? '正在拼接图片...'
                                            : '正在生成图片...'
                                        }
                                    </span>
                                    <span>{convertProgress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${convertProgress}%` }}
                                    />
                                </div>
                            </>
                        )}

                        {/* 预览和下载 */}
                        {previewUrl && (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                        <span className="material-symbols-outlined">check_circle</span>
                                        <span className="text-sm font-medium">转换完成！</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleClearFile}
                                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                                        >
                                            重新选择
                                        </button>
                                        <button
                                            onClick={handleDownload}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:opacity-90"
                                        >
                                            <span className="material-symbols-outlined text-lg">download</span>
                                            <span>下载长图</span>
                                        </button>
                                    </div>
                                </div>

                                {/* 图片预览 */}
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-[500px] overflow-y-auto bg-gray-100 dark:bg-gray-900">
                                    <img
                                        src={previewUrl}
                                        alt="PDF长图预览"
                                        className="w-full h-auto"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 功能说明 */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/20 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        功能说明
                    </h3>
                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>纯前端转换，无需上传到服务器，数据安全</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>将PDF所有页面垂直拼接成一张长图</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>支持选择 PNG（无损）或 JPEG（压缩）格式</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-primary mt-0.5">check_circle</span>
                            <p>可自定义图片质量和页面间距</p>
                        </div>
                        <div className="flex items-start gap-2">
                            <span className="material-symbols-outlined text-yellow-500 mt-0.5">info</span>
                            <p className="text-yellow-600 dark:text-yellow-500">
                                <strong>提示：</strong>页数较多或高质量设置可能需要较长处理时间
                            </p>
                        </div>
                    </div>
                </div>

                {/* 使用提示 */}
                {!pdfFile && (
                    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-8">
                        <div className="flex flex-col items-center text-center gap-4">
                            <span className="material-symbols-outlined text-6xl text-gray-400 dark:text-gray-500">
                                upload_file
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                    上传您的PDF文件开始转换
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    支持任意大小的PDF文件，转换在浏览器本地完成
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfToImageTool;
