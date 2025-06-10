import { Request, Response } from "express";
import { getAIResponse } from "../handler/together_API";
const multer = require('multer');

const mymulter = multer();
const express = require("express");

const GPTRouter = express.Router();



GPTRouter.post("",mymulter.none(), async (req: Request, res: Response) => {
  //   getAIResponse()
  //     .then((output: any) => {
  //       console.log("Output from OpenAI:", output);
  //       return res.status(200).json({
  //         message: "Welcome to the GPT API",
  //         status: "success",
  //         output: output,
  //       });
  //     })
  //     .catch((error: Error) => {
  //       console.error("Error in GPTRouter:", error);
  //       return res.status(500).json({
  //         message: "An error occurred while processing your request",
  //         status: "error",
  //         error: error.message,
  //       });
  //     });
  const bodydata = req.body;
  try {
    const resultresponse = await getAIResponse(bodydata);
    console.log("Output from Together API:", resultresponse);
    return res.status(200).json({
      message: "Welcome to the GPT API",
      status: "success",
      output: resultresponse,
    });
  } catch (error) {
    console.error("Error in GPTRouter:", error);
  }
});

export default GPTRouter;
