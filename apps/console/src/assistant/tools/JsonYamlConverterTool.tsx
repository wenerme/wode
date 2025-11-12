import React, { useState } from 'react';
import YAML from 'yaml';

export const JsonYamlConverterTool: React.FC = () => {
    const [input, setInput] = useState('');
    const [output, setOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'json2yaml' | 'yaml2json'>('json2yaml');

    const convert = (currentInput: string, currentMode: 'json2yaml' | 'yaml2json') => {
        setError(null);
        if (!currentInput.trim()) {
            setOutput('');
            return;
        }

        try {
            if (currentMode === 'json2yaml') {
                const obj = JSON.parse(currentInput);
                const y = YAML.stringify(obj);
                setOutput(y);
            } else {
                const obj = YAML.parse(currentInput);
                const j = JSON.stringify(obj, null, 2);
                setOutput(j);
            }
        } catch (e: any) {
            setError(e.message || 'Conversion failed');
        }
    };

    const handleInputChange = (val: string) => {
        setInput(val);
        convert(val, mode);
    };

    const toggleMode = () => {
        const newMode = mode === 'json2yaml' ? 'yaml2json' : 'json2yaml';
        setMode(newMode);
        if (!error && output) {
            setInput(output);
            convert(output, newMode);
        } else {
            convert(input, newMode);
        }
    };

    return (
        <div className="flex flex-col h-full p-6 gap-4">
            <div className="flex items-center justify-between">
                <div className="prose">
                    <h2>JSON &lt;&gt; YAML</h2>
                </div>
                <button className="btn btn-primary btn-sm" onClick={toggleMode}>
                    Switch to {mode === 'json2yaml' ? 'YAML -> JSON' : 'JSON -> YAML'}
                </button>
            </div>

            <div className="flex flex-1 gap-4 min-h-0">
                <div className="flex-1 flex flex-col gap-2">
                    <label className="label font-bold">
                        {mode === 'json2yaml' ? 'JSON Input' : 'YAML Input'}
                    </label>
                    <textarea
                        className="textarea textarea-bordered flex-1 font-mono text-sm resize-none"
                        placeholder={mode === 'json2yaml' ? 'Paste JSON here...' : 'Paste YAML here...'}
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value)}
                    />
                </div>

                <div className="flex-1 flex flex-col gap-2">
                    <label className="label font-bold">
                        {mode === 'json2yaml' ? 'YAML Output' : 'JSON Output'}
                    </label>
                    <div className="relative flex-1">
                        <textarea
                            className={`textarea textarea-bordered w-full h-full font-mono text-sm resize-none ${error ? 'textarea-error' : ''}`}
                            readOnly
                            value={output}
                            placeholder="Output will appear here..."
                        />
                        {error && (
                            <div className="absolute bottom-4 left-4 right-4 alert alert-error text-sm shadow-lg">
                                <span>{error}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
