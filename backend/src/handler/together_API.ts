import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import { getSocketByUserId } from "./socket_handler";

import * as zlib from "zlib";
import { embeidingtranform, run, searchText, storeText } from "../vector-db/pinecone_vector";
import { pushMessage } from "../utilis/message_buffer";
import { maybeSummarize } from "../utilis/summerizer";
import { composePrompt } from "../utilis/prompt-composer";
require("dotenv").config();

const API_KEY = process.env.TOGETHER_API_KEY;
const GAPI_KEY = process.env.GEMINI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

let ResposeText = "";

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
    messages: [{ role: "user", content: "how are you" },{ role: "user", content: "how are you" }],
    context_length_exceeded_behavior: "truncate",
  },
  responseType: "stream" as const,
};

const configdeepseekWithoutStream = {
  method: "post",
  url: "https://api.together.xyz/v1/chat/completions",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  },
  data: {
    model: "deepseek-ai/DeepSeek-V3",
    stream: false,
    messages: [{ role: "system", content: "You are a summarizer bot." },{ role: "user", content: "how are you" }],
    context_length_exceeded_behavior: "truncate",
  },
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
  let Ttext = "";
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
          Ttext += text;
          ResposeText += text;
          socket.emit("live-data", { message: text });
        }
      });
          console.log("Live-data",Ttext);
    } catch (error) {
      halftext = currenttext;
    }
  });

  response.data.on("end", async () => {
    const sid = socket.request.sessionID;
    await pushMessage(sid, { role: "assistant", content: ResposeText, ts: Date.now()/1000|0 });
    console.log("Stream Completed");
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

export const getAIResponse_Original = (SocketId: any, AIdata: any) => {
  let ai = AIdata.model;
  let config: any = "";

  embeidingtranform().then(()=>{
run().then(()=>{
  searchText(AIdata.message,5).then((founddata)=>{
   storeText(AIdata.message).then(()=>{

    
    // let userquary = `${data[0].metadata.text}\n\n User's question: ${data.message}`;
    
    if (ai == "deepseek") {
    const configmessage = founddata.map((data:any)=>(
        {role:"system",content:data.metadata.text}
    ))
    let userquary = AIdata.message
    configmessage.push({role:"user",content:userquary});
    configdeepseek.data.messages = configmessage;
    config = configdeepseek;
  } else if (ai == "gemini") {
   let configparts =  founddata.map((data:any)=>({text:data.metadata.text}));
   console.log("configparts",configparts);
    configemini.data.contents[0].parts = configparts;
    config = configemini;
  }
  console.log("config_after",config);
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
   }).catch((err)=>{
    console.log("error while searching",err);
   })
   }).catch((err)=>{
        console.log("error while inserting value in vector database",err);
   })
}).catch(err=>{
  console.error("Error:", err);
})
}).catch(err => {
  console.error('Error:', err);
});

  
};

export const getAIResponse = async (Socket: any, AIdata: any) => {
  const SocketId = Socket.id;
  const Sessionid = Socket.request.sessionID;
  console.log("SessionId",Sessionid);
  let ai = AIdata.model;
  console.log("ai",AIdata.model);
  let config: any = "";
  const sid = Sessionid;
//   embeidingtranform().then(()=>{
// run().then(()=>{
//   searchText(AIdata.message,5).then((founddata)=>{
//    storeText(AIdata.message).then(()=>{
    // let userquary = `${data[0].metadata.text}\n\n User's question: ${data.message}`;
    const founddata:any = [];
    if (ai == "deepseek") {
      const configmessage = [];
    // const configmessage = founddata.map((data:any)=>(
    //     {role:"system",content:data.metadata.text}
    // ))
    let userquary = AIdata.message
    configmessage.push({role:"user",content:userquary});
    configdeepseek.data.messages = configmessage;
    await pushMessage(sid, { role: "user", content: userquary, ts: Date.now()/1000|0 });
    await maybeSummarize(sid, 4);
    const prompt = await composePrompt(sid, { tokenLimit: 6000 });
      /// call this after answes.. toadd
    // await pushMessage(sid, { role: "assistant", content: answer, ts: Date.now()/1000|0 });
    console.log(prompt);
    configdeepseek.data.messages = prompt;
    config = configdeepseek;
  } else if (ai == "gemini") {
   let configparts =  founddata.map((data:any)=>({text:data.metadata.text}));
   console.log("configparts",configparts);
    configemini.data.contents[0].parts = configparts;
    config = configemini;
  }else {
    handlestreamResponseLocal(getSocketByUserId(SocketId));
  }
  console.log("config_after",config);
  if(config != ''){
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
  
};}

function handlestreamResponseLocal(socket: any) {
  const text =
            `### **1. Dictionary Attack (Fastest)**
        \`\`\`bash
        john --format=raw-md5 --wordlist=/path/to/wordlist.txt hash.txt
        \`\`\`
        - **Example (using \`rockyou.txt\`):**
          \`\`\`bash
          john --format=raw-md5 --wordlist=rockyou.txt hash.txt
          \`\`\`

        ---

        ### **2. Brute-Force Attack (Slow but Thorough)**
        \`\`\`bash
        john --format=raw-md5 --incremental hash.txt
        \`\`\`
        - **Limit length** (e.g., 4–8 characters):
          \`\`\`bash
          john --format=raw-md5 --incremental=Alnum --min-length=4 --max-length=8 hash.txt
          \`\`\`

        ---

        ### **3. Rule-Based Attack (Common Password Variations)**
        \`\`\`bash
        john --format=raw-md5 --wordlist=rockyou.txt --rules hash.txt
        \`\`\`
        - Applies rules (e.g., \`password → p@ssw0rd\`) to the wordlist.

        ---

        ### **4. Show Cracked Results**
        \`\`\`bash
        john --show hash.txt
        \`\`\`
        - Outputs cracked hashes in \`hash.txt\` (e.g., \`c3fcd3d76192e4007dfb496cca67e13b:plaintext\`).

        ---

        ### **5. Custom Mask Attack (If You Know the Format)**
        \`\`\`bash
        john --format=raw-md5 --mask='?l?l?l?l?d?d?d' hash.txt
        \`\`\`
        - Cracks hashes with patterns (e.g., \`abcd123\` = 4 letters + 3 digits).
          - \`?l\` = lowercase letter
          - \`?d\` = digit
          - \`?s\` = special character

        ---

        ### **Key Flags**
        | Flag               | Description                          |
        |--------------------|--------------------------------------|
        | \`--format=raw-md5\` | Specifies MD5 hashes.                |
        | \`--wordlist=FILE\`  | Uses a wordlist file.                |
        | \`--incremental\`    | Brute-force mode.                    |
        | \`--rules\`          | Enables word mangling rules.         |
        | \`--mask=STRING\`    | Defines a custom brute-force pattern.|

        ---

        ### **Example Workflow**
        1. Save the hash to \`hash.txt\`:
          \`\`\`bash
          echo "c3fcd3d76192e4007dfb496cca67e13b" > hash.txt
          \`\`\`
        2. Run a dictionary attack:
          \`\`\`bash
          john --format=raw-md5 --wordlist=rockyou.txt hash.txt
          \`\`\`
        3. Check results:
          \`\`\`bash
          john --show hash.txt
          \`\`\`

        ---

        ### **Notes**
        - **Wordlists:** Use \`rockyou.txt\`, \`SecLists\`, or generate custom lists.
        - **Performance:** Use \`--fork=4\` (4 CPU threads) for faster cracking.
        - **GPU Acceleration:** For faster results, switch to **Hashcat** (I can provide syntax).

        Let me know if you need help refining the attack!`;

        // ### **Key Flags**
        // | Flag               | Description                          |
        // |--------------------|--------------------------------------|
        // | \`--format=raw-md5\` | Specifies MD5 hashes.                |
        // | \`--wordlist=FILE\`  | Uses a wordlist file.                |
        // | \`--incremental\`    | Brute-force mode.                    |
        // | \`--rules\`          | Enables word mangling rules.         |
        // | \`--mask=STRING\`    | Defines a custom brute-force pattern.|

        // ---
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

export function callLLMForSummary(SummaryText:string): Promise<string>{
     //configdeepseekWithoutStream
     console.log("SummyText in callllmformsummary",SummaryText);
     configdeepseekWithoutStream.data.messages[1].content = SummaryText;
   return axios(configdeepseekWithoutStream)
    .then((response) => {
      let steamresponse;
      console.log("response",response.data.choices[0].message.content);
      console.log("total_token",response.data.usage.total_tokens);
      // response.data.on("data", (chunk: any) => {

      //   console.log("response",chunk);
      //   return "";
      // });
      return response.data.choices[0].message.content;
    })
    .catch((error) => {
      console.error("Error in getAIResponse:", error);
      
      throw new Error("Failed to fetch AI response from Together API");
    });
     
}

