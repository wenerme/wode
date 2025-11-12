import React from 'react';
import { FiSettings, FiInfo } from 'react-icons/fi';
import { AssistantToolItem } from './AssistantToolItem';
import { useAssistantStore, useAssistantActions } from '../context/AssistantStore';

export const AssistantSidebar: React.FC = () => {
    const tools = useAssistantStore(s => s.tools);
    const activeToolId = useAssistantStore(s => s.activeToolId);
    const searchQuery = useAssistantStore(s => s.searchQuery);
    const sidecar = useAssistantStore(s => s.sidecar);
    const version = useAssistantStore(s => s.version);
    const { setActiveToolId } = useAssistantActions();

    const filteredTools = tools.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSettings = () => {
        sidecar.openSettings();
    };

    return (
        <div className="flex h-full flex-col bg-base-200/50 border-r border-base-300 w-64">
            {/* Tool List */}
            <div className="flex-1 overflow-y-auto py-2">
                {filteredTools.length === 0 ? (
                    <div className="p-4 text-center text-sm opacity-60">No tools found</div>
                ) : (
                    filteredTools.map((tool) => (
                        <AssistantToolItem
                            key={tool.id}
                            tool={tool}
                            isActive={tool.id === activeToolId}
                            onClick={() => setActiveToolId(tool.id)}
                        />
                    ))
                )}
            </div>

            {/* Footer Menu */}
            <div className="mt-auto border-t border-base-300 p-2">
                <div className="menu menu-horizontal w-full justify-between">
                    <button className="btn btn-ghost btn-sm btn-square tooltip" data-tip={`Version ${version}`}>
                        <FiInfo />
                    </button>
                    <button className="btn btn-ghost btn-sm btn-square" onClick={handleSettings}>
                        <FiSettings />
                    </button>
                </div>
            </div>
        </div>
    );
};
