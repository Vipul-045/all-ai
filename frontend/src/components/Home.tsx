import { useEffect, useState } from "react";
import { SendInputText } from "../services/InputData_Controller";
import socket from "../services/socket";
import Header from "./header";
import { formatOutput } from "../services/OutPutformater";
import parse from 'html-react-parser';


const HomeData = () => {

    const [inputvalue, setInputvalue] = useState("");
    const [outputValue, setOutPutValue] = useState("");

    const listener = async (msg: { message: string }) => {
        console.log("chunks :-", msg);
        
        const formated_data = await formatOutput(msg.message);
        console.log("formated_data",formated_data);
        setOutPutValue(prev => prev + formated_data);
    };


    useEffect(() => {
        // console.log("converted",myConvertLatex("6.674 \\times 10^{-11} \\, \\text{N} \\cdot \\text{m}^2/\\text{kg}^2"));
        console.log("output on line data");
        socket.on("live-data", listener);

        return () => {
            socket.off("live-data", listener);
        };
    }, []);


    return <>
        <div className="h-screen min-w-screen flex flex-col items-center bg-#F4F6F8">
            <Header />
            <div className="flex flex-col items-center justify-center h-screen w-full">
                <div className={outputValue ? "max-w-4/6 h-full flex justify-center px-4 py-3 space-y-4" : "max-w-4/6 flex justify-center px-4 py-3 space-y-4"}>
                    <p className="flex overflow-y-auto flex-col items-center justify-center">
                        <span className="pb-10 font-semibold text-left">
                            {parse(outputValue)}
                        </span>
                        <span className="pb-10 h-full text-2xl font-semibold text-center text-blue-300">
                            {!outputValue ? "Hello! How can I help you today?" : ""}
                        </span>
                    </p>
                </div>
                <div className="border-black border-1 min-w-2/4 flex justify-between">
                    <div className="items-center space-x-2 flex">
                        <input
                            className="bg-#FFFFFF w-3xl hover:bg-gray-900 text-#1F2937 px-4 py-4 text-md"
                            value={inputvalue}
                            placeholder="What do you want to know..."
                            onChange={(e) => setInputvalue(e.target.value)}
                        />
                    </div>
                    <button
                        className="bg-#1F2937 hover:bg-gray-900 text-white font-bold py-2 px-4"
                        onClick={() => {
                            if (inputvalue.trim() === "") {
                                alert("Please enter a valid input.");
                                return;
                            }
                            SendInputText(inputvalue);
                            setInputvalue("");
                        }}
                    >
                        Let's go!
                    </button>
                </div>
            </div>
        </div>
    </>
}

export default HomeData;