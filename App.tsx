import React, { useState } from 'react';
import TranslateTool from './components/TranslateTool';
import ImageConverterTool from './components/ImageConverterTool';
import CodeHighlightTool from './components/CodeHighlightTool';
import TextFormatterTool from './components/TextFormatterTool';

type ToolType = 'translate' | 'image-converter' | 'code-highlight' | 'text-formatter';

interface Tool {
    id: ToolType;
    name: string;
    icon: string;
    component: React.FC;
}

const TOOLS: Tool[] = [
    {
        id: 'translate',
        name: '在线翻译',
        icon: 'translate',
        component: TranslateTool,
    },
    {
        id: 'code-highlight',
        name: '代码高亮',
        icon: 'code',
        component: CodeHighlightTool,
    },
    {
        id: 'text-formatter',
        name: '文本格式化',
        icon: 'description',
        component: TextFormatterTool,
    },
    {
        id: 'image-converter',
        name: '图片格式转换',
        icon: 'image',
        component: ImageConverterTool,
    },
];

const App: React.FC = () => {
    const [activeTool, setActiveTool] = useState<ToolType>('translate');

    const ActiveComponent = TOOLS.find(tool => tool.id === activeTool)?.component || TranslateTool;

    return (
        <div className="relative flex min-h-screen w-full">
            <aside className="sticky top-0 h-screen w-64 flex-shrink-0 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark p-4 hidden md:flex flex-col">
                <div className="flex h-full flex-col">
                    <div className="flex items-center gap-3 px-2 pb-4">
                        <img
                            src="/logo.png"
                            alt="FreeTool Logo"
                            className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="flex flex-col">
                            <h1 className="text-text-light dark:text-text-dark text-base font-medium leading-normal">FreeTool 工具箱</h1>
                            <p className="text-subtle-light dark:text-subtle-dark text-sm font-normal leading-normal">在线小工具</p>
                        </div>
                    </div>
                    <nav className="flex flex-col gap-2">
                        {TOOLS.map(tool => (
                            <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                    activeTool === tool.id
                                        ? 'bg-primary/10 text-primary'
                                        : 'text-text-light dark:text-text-dark hover:bg-primary/10'
                                }`}
                            >
                                <span
                                    className="material-symbols-outlined text-xl"
                                    style={activeTool === tool.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                                >
                                    {tool.icon}
                                </span>
                                <p className="text-sm font-medium leading-normal">{tool.name}</p>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* 移动端工具选择器 */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark z-10 p-4">
                <select
                    value={activeTool}
                    onChange={(e) => setActiveTool(e.target.value as ToolType)}
                    className="w-full appearance-none rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-4 py-2.5 text-text-light dark:text-text-dark focus:border-primary focus:ring-primary/20 focus:ring-2"
                >
                    {TOOLS.map(tool => (
                        <option key={tool.id} value={tool.id}>{tool.name}</option>
                    ))}
                </select>
            </div>

            <main className="flex-1 p-6 sm:p-8 md:p-10 mt-20 md:mt-0">
                <ActiveComponent />
            </main>
        </div>
    );
};

export default App;
