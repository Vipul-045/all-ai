import { useEffect, useState } from "react";
import { SendInputText } from "../services/InputData_Controller";
import socket from "../services/socket";
import "./home.css"
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
        <div className="chat-container">
            <div className="chat-output">
                <div style={{overflow:"scroll"}} >{parse(outputValue)}</div>
            </div>

            <div className="chat-input-wrapper">
                <div className="chat-input-row">
                    <input
                        className="chat-input"
                        value={inputvalue}
                        placeholder="What do you want to know..."
                        onChange={(e) => setInputvalue(e.target.value)}
                    />
                    <button className="chat-button" onClick={() => SendInputText(inputvalue)}>
                        Let's Go
                    </button>
                </div>
            </div>
        </div>
    </>
}

export default HomeData;