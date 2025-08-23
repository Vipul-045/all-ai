import { useEffect, useState } from "react";
import { SendInputText } from "../services/InputData_Controller";
import socket from "../services/socket";
import Header from "./header";
import { formatOutput } from "../services/OutPutformater";
import parse from 'html-react-parser';
import "./home.css";

const HomeData = () => {

    const [inputvalue, setInputvalue] = useState("");
    const [outputValue, setOutPutValue] = useState("");
    const [selectedModel, setSelectedModel] = useState("deepseek");
    const [messages, setMessages] = useState<{ type: 'user' | 'system'; content: string }[]>([]);
    const [rawSystemText, setRawSystemText] = useState(""); // hold raw unformatted stream

    const listener = async (msg: { message: string }) => {
        const incoming = msg.message; // incoming chunk, e.g., "Hello"

        // 1. Append incoming chunk to raw system text
        setRawSystemText(prevRaw => prevRaw + incoming);

        // 2. Format just this chunk and append it to the last message
        const formatted = await formatOutput(incoming); // format only current chunk

        setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];

            if (last?.type === 'system') {
                updated[updated.length - 1] = {
                    ...last,
                    content: last.content + formatted // append the chunk
                };
            }

            return updated;
        });
    };

    useEffect(() => {
        setOutPutValue("");
        console.log(rawSystemText);
        socket.on("live-data", listener);

        return () => {
            socket.off("live-data", listener);
        };
    }, []);

    function handleSend() {


        if (inputvalue.trim() === '') return;

        setMessages(prev => [...prev, { type: 'user', content: inputvalue }]);
        setInputvalue('');
        SendInputText(inputvalue, selectedModel);
        setTimeout(() => {
            setMessages(prev => [...prev, { type: 'system', content: outputValue }]);
        });

        setRawSystemText("");
    }


    return <>
        <div className="h-screen w-screen flex flex-col bg-[#F4F6F8]">
            <Header />
            <div className="flex flex-1">
            <div className="w-64 flex flex-col justify-between bg-white border-r p-4">
          {/* Sidebar content */}
          <div className="space-y-3 overflow-y-auto flex-grow">
            <h3 className="p-2 rounded hover:bg-gray-100 cursor-pointer">Some Value</h3>
            <h3 className="p-2 rounded hover:bg-gray-100 cursor-pointer">Some Value</h3>
            <h3 className="p-2 rounded hover:bg-gray-100 cursor-pointer">Some Value</h3>
            <h3 className="p-2 rounded hover:bg-gray-100 cursor-pointer">Some Value</h3>
          </div>

          {/* Settings */}
          <div className="flex items-center gap-2 text-gray-600 cursor-pointer hover:text-black mt-4">
            
            <span>Settings</span>
          </div>
        </div>
            {/* Chat area */}
            <div className="flex flex-col justify-between w-full max-w-4xl px-4 py-6" style={{flexGrow: 1, overflowY: 'scroll', scrollBehavior: 'smooth', scrollbarWidth: 'none', maxWidth: "80%" }}>

                {/* Messages */}
                <div className="flex flex-col gap-4 overflow-y-auto flex-1 px-2" style={{maxHeight:'70vh'}}>
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`px-4 py-3 rounded-2xl max-w-[70%] text-sm
          ${msg?.type === 'user' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}
                            >
                                {parse(String(msg?.content || ""))}
                            </div>
                        </div>
                    ))}

                    {!messages.length && (
                        <div className="flex justify-center text-blue-400 text-xl font-semibold mt-8">
                            Hello! How can I help you today?
                        </div>
                    )}
                </div>


                {/* Input area */}
                <div className="mt-4 flex items-center justify-between border-t pt-4 gap-4">
                    {/* Select model */}
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="border border-gray-300 px-3 py-2 rounded-md text-sm"
                    >
                        <option value="deepseek">DeepSeek</option>
                        <option value="gemini">Gemini</option>
                    </select>

                    {/* Input box */}
                    <input
                        value={inputvalue}
                        onChange={(e) => setInputvalue(e.target.value)}
                        placeholder="What do you want to know..."
                        className="flex-1 border border-gray-300 rounded-md px-4 py-2 text-sm focus:outline-none"
                    />

                    {/* Button */}
                    <button
                        onClick={handleSend}
                        className="bg-black hover:bg-gray-900 text-black px-5 py-2 rounded-md text-sm font-semibold"
                    >
                        Let's go!
                    </button>
                </div>
            </div>
        </div>
</div>
    </>
}

export default HomeData;