import { Request, Response, Router } from "express";
import { createUser, loginuser } from "../handler/routes_handler/user_handler";
const multer = require("multer");

const mymulter = multer();

const Urouter = Router();

Urouter.post("", mymulter.none(), async (req: Request, res: Response) => {
  try {
    const userbodydata = req.body;

    const response = await createUser(userbodydata);

    res.status(200).send(response);
  } catch (err) {
    console.log("Router: Error While creating user", err);
    res.status(500).send({ error: "Error while creating user" });
  }
});

Urouter.post("/login", mymulter.none(), async (req: Request, res: Response) => {
  try {
    const userbodydata = req.body;

    const response = await loginuser(userbodydata);

    res.status(200).send(response);
  } catch (err) {
    console.log("Router: Error While creating user", err);
    res.status(500).send({ error: "Error while creating user" });
  }
});

export default Urouter;
