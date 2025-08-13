import { useState } from "react";
import { SendInputText } from "../services/InputData_Controller";
import React from "react";
import { Square, Send }  from "lucide-react";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
}

interface Model {
    id: string;
    name: string;
    icon: React.ReactNode;
    description: string;
}

const models: Model[] = [
    {
        id: 'gpt-4',
        name: 'GPT-4',
        icon: <div className="w-4 h-4" />,
        description: 'Most capable model, best for complex tasks'
    },
    {
        id: 'claude-3',
        name: 'Claude 3 Sonnet',
        icon: <div className="w-4 h-4" />,
        description: 'Balanced model for everyday use'
    },
    {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        icon: <div className="w-4 h-4" />,
        description: 'Google\'s most advanced model'
    }
];

function InputArea() {

    const [inputvalue, setInputvalue] = useState('');
    const [selectedModel, setSelectedModel] = useState(models[0]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModelDropdown, setShowModelDropdown] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputvalue.trim() || isGenerating) return;
    }

    const stopGeneration = () => {
            setIsGenerating(false);
        };

      const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      SendInputText(inputvalue);
      setInputvalue("");
    }
  };

        return (
            <div> 
                 {/* Input Area */}
                {/* <div className="bg-black/80 backdrop-blur-sm border-t border-gray-200 p-4 sticky bottom-0"> */}
                    <div className="max-w-4xl mx-auto min-w-3xl">
                        {/* Model Selector */}
                        <div className="mb-3 relative">
                            <button
                                onClick={() => setShowModelDropdown(!showModelDropdown)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {selectedModel.icon}
                                <span>{selectedModel.name}</span>
                                {/* <Settings className="w-3 h-3" /> */}
                            </button>

                            {showModelDropdown && (
                                <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-lg border border-gray-200 py-2 min-w-64 z-20">
                                    {models.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => {
                                                setSelectedModel(model);
                                                setShowModelDropdown(false);
                                            }}
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start space-x-3 transition-colors ${selectedModel.id === model.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                                                }`}
                                        >
                                            <div className="mt-0.5">{model.icon}</div>
                                            <div>
                                                <div className="font-medium text-gray-800">{model.name}</div>
                                                <div className="text-xs text-gray-500">{model.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Input Form */}
                        <form className="relative" onSubmit={handleSubmit}>
                            <div className="relative font-semibold bg-black rounded-2xl shadow-sm border border-gray-200 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all">
                                <textarea
                                    // ref={textareaRef}
                                    value={inputvalue}
                                    onChange={(e) => setInputvalue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Ask me anything..."
                                    disabled={isGenerating}
                                    maxLength={500}
                                    className="w-full px-4 py-4 pr-24 rounded-2xl resize-none focus:outline-none placeholder-gray-500 disabled:opacity-50 min-h-[60px]"
                                    rows={1}
                                />

                                {/* Character Counter */}
                                <div className="absolute bottom-2 left-4 text-xs text-black/50">
                                    {inputvalue.length}/{500}
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                                    {isGenerating ? (
                                        <button
                                            type="button"
                                            onClick={stopGeneration}
                                            className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
                                        >
                                            <Square className="w-5 h-5" />
                                        </button>
                                    ) : (   
                                        <button
                                            type="submit"
                                            disabled={!inputvalue.trim()}
                                            className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
                                            onClick={() => {
                                                SendInputText(inputvalue);
                                                setInputvalue("");
                                            }}
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
        )
    }

export default InputArea;