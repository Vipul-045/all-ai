import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { getSocketByUserId } from "./socket_handler";

import * as zlib from "zlib";
require("dotenv").config();

const API_KEY = process.env.TOGETHER_API_KEY;
const GAPI_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

const configdeepseek = {
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

const deepseekconfig = {
  method: "post",
  url: "https://api.deepseek.com/chat/completions",
  headers: {
    Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  },
  data: {
    messages: [
      {
        content: "You are a helpful assistant",
        role: "system",
      },
      {
        content: "Hi",
        role: "user",
      },
    ],
    model: "deepseek-chat",
    frequency_penalty: 0,
    max_tokens: 2048,
    presence_penalty: 0,
    response_format: {
      type: "text",
    },
    stop: null,
    stream: false,
    stream_options: null,
    temperature: 1,
    top_p: 1,
    tools: null,
    tool_choice: "none",
    logprobs: false,
    top_logprobs: null,
  },
};

const configemini = {
  method: "post",
  url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${GAPI_KEY}`,
  headers: {
    Accept: "text/event-stream",
    "Content-Type": "application/json",
    "X-Goog-Api-Key": GAPI_KEY,
    "Accept-Encoding": "gzip",
  },
  data: {
    contents: [
      {
        parts: [
          {
            text: "Explain how AI works in a few words",
          },
        ],
      },
    ],
  },
  responseType: "stream" as const,
};

const ImageConfig = {
  method: "post",
  url: "https://api.together.xyz/v1/images/generations",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: { "Content-Type": "application/json" },
  },
  data: {
    model: "black-forest-labs/FLUX.1-kontext-pro",
    prompt: "Cats eating popcorn",
    steps: 10,
    n: 4,
  },
};

function handleStreamResponseDeepseek(response: AxiosResponse, socket: any) {
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
    return "Error in stream" + error;
  });
}

function handleStreamResponseGemini(response: AxiosResponse, socket: any) {
  let stream;
  stream = response.data; // plain stream
  let result = "";
  stream.on("data", (chunk: any) => {
    result += chunk.toString();
  });

  stream.on("end", () => {
    const resultparsed = JSON.parse(result);
    resultparsed.forEach((e: any) => {
      const parts = e.candidates[0]?.content?.parts || [];
      parts.forEach((part: any) => {
        socket.emit("live-data", {
          message: part.text,
        });
      });
    });

    return "Stream Completed";
  });

  stream.on("error", (error: any) => {
    console.error("Error in stream:", error);
  });
}

// export const getAIResponse = (SocketId:any,Message:any) => {
//   configemini.data.contents[0].parts[0].text = Message;
//   axios(configemini)
//     .then((response) => {
//       let steamresponse;
//       //  steamresponse = handleStreamResponse(response, getSocketByUserId(SocketId));
//         // steamresponse =  handlestreamResponseLocal(getSocketByUserId(SocketId));
//         console.log("steamresponse",response);
//       return steamresponse;
//     })
//     .catch((error) => {
//       console.error("Error in getAIResponse:", error);
//       throw new Error("Failed to fetch AI response from Together API");
//     });
// };

export const getAIResponse = (SocketId: any, data: any) => {
  let ai = data.model;
  let config: any = "";
  if (ai == "deepseek") {
    configdeepseek.data.messages[0].content = data.message;
    config = configdeepseek;
  } else if (ai == "gemini") {
    configemini.data.contents[0].parts[0].text = data.message;
    config = configemini;
  }
  axios(config)
    .then((response) => {
      let steamresponse;
      if (ai == "deepseek") {
        steamresponse = handleStreamResponseDeepseek(
          response,
          getSocketByUserId(SocketId)
        );
      } else if (ai == "gemini") {
        steamresponse = handleStreamResponseGemini(
          response,
          getSocketByUserId(SocketId)
        );
      } else {
        steamresponse = handlestreamResponseLocal(getSocketByUserId(SocketId));
      }
      return steamresponse;
    })
    .catch((error) => {
      console.error("Error in getAIResponse:", error);
      throw new Error("Failed to fetch AI response from Together API");
    });
};

function handlestreamResponseLocal(socket: any) {
  const text =
    "**Gravity** is a fundamental force of nature that attracts objects with mass toward each other.It is responsible for phenomena like keeping planets in orbit around stars, causing objects to fall to the ground, and governing the large-scale structure of the universe. ### **Key Concepts of Gravity:** 1. **Newton's Law of Universal Gravitation (1687):** - Proposed by **Isaac Newton**, it states that every mass attracts every other mass with a force proportional to the product of their masses and inversely proportional to the square of the distance between them. - Formula: \\[ F = G \\frac{m_1 m_2}{r^2} \\] - \\(F\\) = gravitational force - \\(G\\) = gravitational constant (\\(6.674 \\times 10^{-11} \\, \\text{N} \\cdot \\text{m}^2/\\text{kg}^2\\)) - \\(m_1, m_2\\) = masses of the two objects - \\(r\\) = distance between their centers 2. **Einstein's General Theory of Relativity (1915):** - **Albert Einstein** redefined gravity not as a force but as the curvature of **spacetime** caused by mass and energy. - Massive objects (like stars and planets) warp spacetime, and other objects move along these curved paths (geodesics). - Explains phenomena like **gravitational lensing**, **black holes**, and **time dilation** near massive objects. 3. **Gravitational Acceleration (g):** - On Earth, gravity causes objects to accelerate downward at **~9.81 m/s²** (varies slightly with altitude and location). - Formula for weight: (W = m cdot g) (where (W) = weight, (m) = mass). 4. **Gravity in the Universe:** - Governs the motion of planets, stars, and galaxies. - Weakest of the four fundamental forces (compared to electromagnetism, strong & weak nuclear forces). - Acts over infinite range but decreases with distance. ### **Interesting Facts:** - The Moon’s gravity is about **1/6th of Earth’s** (why astronauts 'bounce' there). - Black holes have gravity so strong that not even light can escape. - Without gravity, stars and planets wouldn’t form, and the universe would be a diffuse gas cloud. Would you like details on a specific aspect (e.g., quantum gravity, artificial gravity, or how gravity affects time)?";
  let index = 0;
  const interval = 100; // 2 chunks per second

  const socketInterval = setInterval(() => {
    if (index >= text.length) {
      clearInterval(socketInterval);
      console.log("All chunks sent.");
      return;
    }

    // Generate random chunk size between 2 and 6
    const chunkSize = Math.floor(Math.random() * 5) + 2; // 2 to 6
    const chunk = text.slice(index, index + chunkSize);

    console.log("Emitting chunk:", chunk); // Simulated socket.emit()
    socket.emit("live-data", { message: chunk });
    index += chunkSize;
  }, interval);
}
