import { Request, Response, Router } from "express";
import { createUser, loginuser } from "../handler/routes_handler/user_handler";
import { CreateSubscription, GetSubscription, GetSubscriptionById, UpdateSubscriptionById } from "../handler/routes_handler/Sub_handler";
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
