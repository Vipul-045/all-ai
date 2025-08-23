import { Request, Response, Router } from "express";
import { createUser, loginuser } from "../handler/routes_handler/user_handler";
import { CreateSubscription, GetSubscription, GetSubscriptionById, UpdateSubscriptionById } from "../handler/routes_handler/Sub_handler";
const multer = require("multer");
import jwt from "jsonwebtoken";
require("dotenv").config();

const mymulter = multer();

const Urouter = Router();
const secratKey = process.env.SecratKey || "";

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

Urouter.get("", mymulter.none(), async (req: Request, res: Response) => {
  const token = req.cookies.app_token;
  console.log("found token",token);
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secratKey);
    if (typeof decoded === "object" && decoded !== null) {
      res.status(200).send({ userId: decoded.sub, email: decoded.email, name: decoded.name, picture: decoded.picture });
    } else {
      res.status(403).json({ error: "Invalid token payload" });
    }
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
});

Urouter.post('/logout',mymulter.none(), async (req:Request, res:Response)=>{
  try{
    console.log("in logtout");
    console.log("const token = req.cookies.app_token;"+req.cookies.app_token);
    res.clearCookie("app_token", {
        httpOnly: true,
        secure:true,
        sameSite: "none"
        // maxAge: 0 or expires: new Date(0) is implicitly handled by clearCookie().
    });
    res.status(200).json({ message: "Logged out" });
  }catch(err){
    const errorMessage = typeof err === "object" && err !== null && "message" in err ? (err as { message: string }).message : "Unknown error";
    res.status(500).json({ message: errorMessage });
  }
})

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

Urouter.post("/subscribe", mymulter.none(), async (Req: Request, Res: Response) => {
try{
    const SubBody = Req.body;
    const response = await CreateSubscription(SubBody);
    Res.status(200).send({"message":response});
}catch(e){
    Res.status(500).send({"message":"Error whil Subsription"});
}
});

Urouter.get("/subscribe/:id", mymulter.none(), async (Req: Request, Res: Response) => {
try{
    const Id = Req.params.id;
    const response = await GetSubscriptionById(Id);
    Res.status(200).send({"message":response});
}catch(e){
    Res.status(500).send({"message":"Error whil Subsription"});
}
});

Urouter.get("/subscribe", mymulter.none(), async (Req: Request, Res: Response) => {
try{
    const Id = Req.params.id;
    const response = await GetSubscription();
    Res.status(200).send({"message":response});
}catch(e){
    Res.status(500).send({"message":"Error whil Subsription"});
}
});


Urouter.put("/subscribe/:id", mymulter.none(), async (Req: Request, Res: Response) => {
try{
    const body = Req.body;
    const Id = Req.params.id;
    const response = await UpdateSubscriptionById(Id,body);
    Res.status(200).send({"message":response});
}catch(e){
    Res.status(500).send({"message":"Error whil Subsription"});
}
});


export default Urouter;
