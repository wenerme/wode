import React from 'react';
import { AssistantHeader } from './AssistantHeader';

interface AssistantLayoutProps {
    sidebar: React.ReactNode;
    content: React.ReactNode;
}

export const AssistantLayout: React.FC<AssistantLayoutProps> = ({ sidebar, content }) => {
    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-base-100 text-base-content">
            <AssistantHeader />
            <div className="flex flex-1 overflow-hidden relative">
                <aside className="flex-none h-full">
                    {sidebar}
                </aside>
                <main className="flex-1 overflow-hidden relative bg-base-100">
                    {content}
                </main>
            </div>
        </div>
    );
};
