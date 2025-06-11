import { useEffect, useState } from "react";
import { SendInputText } from "../services/InputData_Controller";
import socket from "../services/socket";
import "./home.css"



const HomeData = () => {

    const [inputvalue, setInputvalue] = useState("");
    const [outputValue, setOutPutValue] = useState("");

    const listener = (msg: { message: string }) => {
        console.log("msg", msg);
        setOutPutValue(prev => prev + msg.message);
    };


    useEffect(() => {
        console.log("output on line data");
        socket.on("live-data", listener);

        return () => {
            socket.off("live-data", listener);
        };
    }, []);


    return <>
        <div className="chat-container">
            <div className="chat-output">
                <p>{outputValue}</p>
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