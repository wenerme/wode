import React from 'react';
import type { AssistantTool } from '../types';
import clsx from 'clsx';

interface AssistantToolItemProps {
    tool: AssistantTool;
    isActive: boolean;
    onClick: () => void;
}

export const AssistantToolItem: React.FC<AssistantToolItemProps> = ({ tool, isActive, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={clsx(
                'flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-base-300',
                isActive ? 'bg-base-300' : 'bg-transparent'
            )}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-base-100 text-xl shadow-sm">
                {tool.icon}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{tool.name}</span>
                    {/* Optional timestamp or badge could go here */}
                </div>
                {tool.description && (
                    <span className="text-xs text-base-content/60 truncate">{tool.description}</span>
                )}
            </div>
        </div>
    );
};
