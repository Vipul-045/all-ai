import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { getSocketByUserId } from "./socket_handler";
require("dotenv").config();

const API_KEY = process.env.TOGETHER_API_KEY;

const config = {
  method: "post",
  url: "https://api.together.xyz/v1/chat/completions",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  },
  data: {
    model: "deepseek-ai/DeepSeek-V3",
    stream: true,
    messages: [{ role: "user", content: "how are you" }],
    context_length_exceeded_behavior: "truncate",
  },
  responseType: "stream" as const,
};

const ImageConfig ={
  method: "post",
  url: "https://api.together.xyz/v1/images/generations",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: {"Content-Type": "application/json"},
  },
  data: {
    model: "black-forest-labs/FLUX.1-kontext-pro",
    prompt: 'Cats eating popcorn',
    steps: 10,
    n: 4,
  },

}

function handleStreamResponse(response: AxiosResponse, socket: any) {

  let currenttext = "";
  let halftext = "";
  response.data.on("data", (chunk: any) => {
    let data = chunk.toString();

    try {
      data.split("\n").forEach((line: string) => {
        if (line != "") {
          currenttext = line;
          if (halftext != "") {
            currenttext = halftext + currenttext;
            halftext = "";
          }
          let text = JSON.parse(currenttext.split("data: ")[1]).choices[0].text;
          socket.emit("live-data", { message: text });
        }
      });
    } catch (error) {
      halftext = currenttext;
    }
  });

  response.data.on("end", () => {
    return "Stream Completed";
  });

  response.data.on("error", (error: any) => {
    console.error("Error in stream:", error);
  });
}

export const getAIResponse = (SocketId:any,Message:any) => {
  config.data.messages[0].content = Message;
  axios(config)
    .then((response) => {
      let steamresponse;
        steamresponse = handleStreamResponse(response, getSocketByUserId(SocketId));
      return steamresponse;
    })
    .catch((error) => {
      console.error("Error in getAIResponse:", error);
      throw new Error("Failed to fetch AI response from Together API");
    });
};
