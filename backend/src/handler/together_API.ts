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
        // steamresponse =  handlestreamResponseLocal(getSocketByUserId(SocketId));
      return steamresponse;
    })
    .catch((error) => {
      console.error("Error in getAIResponse:", error);
      throw new Error("Failed to fetch AI response from Together API");
    });
};

function handlestreamResponseLocal(socket:any){
     const text = "**Gravity** is a fundamental force of nature that attracts objects with mass toward each other.It is responsible for phenomena like keeping planets in orbit around stars, causing objects to fall to the ground, and governing the large-scale structure of the universe. ### **Key Concepts of Gravity:** 1. **Newton's Law of Universal Gravitation (1687):** - Proposed by **Isaac Newton**, it states that every mass attracts every other mass with a force proportional to the product of their masses and inversely proportional to the square of the distance between them. - Formula: \\[ F = G \\frac{m_1 m_2}{r^2} \\] - \\(F\\) = gravitational force - \\(G\\) = gravitational constant (\\(6.674 \\times 10^{-11} \\, \\text{N} \\cdot \\text{m}^2/\\text{kg}^2\\)) - \\(m_1, m_2\\) = masses of the two objects - \\(r\\) = distance between their centers 2. **Einstein's General Theory of Relativity (1915):** - **Albert Einstein** redefined gravity not as a force but as the curvature of **spacetime** caused by mass and energy. - Massive objects (like stars and planets) warp spacetime, and other objects move along these curved paths (geodesics). - Explains phenomena like **gravitational lensing**, **black holes**, and **time dilation** near massive objects. 3. **Gravitational Acceleration (g):** - On Earth, gravity causes objects to accelerate downward at **~9.81 m/s²** (varies slightly with altitude and location). - Formula for weight: \(W = m \cdot g\) (where \(W\) = weight, \(m\) = mass). 4. **Gravity in the Universe:** - Governs the motion of planets, stars, and galaxies. - Weakest of the four fundamental forces (compared to electromagnetism, strong & weak nuclear forces). - Acts over infinite range but decreases with distance. ### **Interesting Facts:** - The Moon’s gravity is about **1/6th of Earth’s** (why astronauts 'bounce' there). - Black holes have gravity so strong that not even light can escape. - Without gravity, stars and planets wouldn’t form, and the universe would be a diffuse gas cloud. Would you like details on a specific aspect (e.g., quantum gravity, artificial gravity, or how gravity affects time)?";
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
