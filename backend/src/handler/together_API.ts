import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { connectedSockets } from "../server";
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

function handleStreamResponse(response: AxiosResponse, socket: any) {

  console.log(
    "Streaming response started",
    response.status,
    response.statusText
  );
  let currenttext = "";
  let halftext = "";
  response.data.on("data", (chunk: any) => {
    // console.log(typeof chunk);
    // console.log("chunk", chunk);
    let data = chunk.toString();

    try {
      data.split("\n").forEach((line: string) => {
        if (line != "") {
          // console.log('Received line:', line);
          currenttext = line;
          // console.log("halftext",halftext);
          if (halftext != "") {
            currenttext = halftext + currenttext;
            // console.log("murged text", currenttext);
            halftext = "";
          }
          let text = JSON.parse(currenttext.split("data: ")[1]).choices[0].text;
          console.log(text);
          socket.emit("live-data", { message: text });
        }
      });
    } catch (error) {
      halftext = currenttext;
      // console.error('Error parsing chunk:', error);
    }
  });

  response.data.on("end", () => {
    return "Stream Completed";
  });

  response.data.on("error", (error: any) => {
    console.error("Error in stream:", error);
  });
}

export const getAIResponse = (bodydata:any) => {
  config.data.messages[0].content = bodydata.content;
  axios(config)
    .then((response) => {
      let steamresponse;
      for (const socket of connectedSockets.values()) {
        steamresponse = handleStreamResponse(response, socket);
      }
      return steamresponse;
    })
    .catch((error) => {
      console.error("Error in getAIResponse:", error);
      throw new Error("Failed to fetch AI response from Together API");
    });
};
