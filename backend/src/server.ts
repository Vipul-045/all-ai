import express, { Request, Response } from "express";
import http from "http";
import { Server } from "socket.io";
import { getAIResponse } from "./handler/together_API";
import { addUserSocket, removeUserSocket } from "./handler/socket_handler";
import Urouter from "./routers/user_router";
import { dbconnection } from "./db/db_connection";
import { Pinecone } from "@pinecone-database/pinecone";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";


import {
  embeidingtranform,
  run,
  searchText,
  storeText,
} from "./vector-db/pinecone_vector";
import {
  createUser,
  findUserById,
} from "./handler/routes_handler/user_handler";

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// GoogleOAuth
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
// GoogleOAuth

require("dotenv").config();
const app = express();
const server = http.createServer(app);
const cors = require("cors");
const port = process.env.PORT || 3000;

app.use(session({ secret: "secret", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(cookieParser());

const YOUR_GOOGLE_CLIENT_ID = process.env.YOUR_GOOGLE_CLIENT_ID;
const YOUR_GOOGLE_CLIENT_SECRET = process.env.YOUR_GOOGLE_CLIENT_SECRET;
const Frontend_URl = process.env.FRONTEND_URL;
const secratKey = process.env.SecratKey;

passport.use(
  new GoogleStrategy(
    {
      clientID: YOUR_GOOGLE_CLIENT_ID,
      clientSecret: YOUR_GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google",
    },
    (accessToken: any, refreshToken: any, profile: any, done: any) => {
      console.log("in  passport user.. ");
      return done(null, profile);
    }
  )
);

passport.serializeUser((user: any, done: any) => done(null, user));
passport.deserializeUser((obj: any, done: any) => done(null, obj));

const pc = new Pinecone({
  apiKey:
    process.env.pinecone_db_key ||
    "pcsk_41NUFz_KZrAgWgFhkdczp1Yh7QDXFbPKSj49Stu5aLoRGGCFsnFffMvzZNEMqRhc7DkCzY",
});
const index = pc.index("all-ai");

console.log("index", index);

app.use(cors({
  origin: "http://localhost:5173", // explicitly allow frontend
  credentials: true,
  
}));
app.use(express.json());

app.use("/user", Urouter);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
  async (req: Request, res: Response) => {
    try {
      console.log("in /auth/google", req.user);
      let jwttoken;
      const userFound = await findUserById(req.user._json.sub);
      if (userFound == null) {
        const userData = {
          id: req.user._json.sub,
          name: req.user._json.name,
          given_name: req.user._json.given_name,
          picture: req.user._json.picture,
          email: req.user._json.email,
          email_verified: req.user._json.email_verified,
        };
        const createduser = await createUser(userData);
        console.log("createdUser", createduser);
        
       jwttoken =  jwt.sign({
          sub:createduser.id,
          name:createduser.name,
          email:createduser.email,
          picture:createduser.picture
        },secratKey || "",{ expiresIn: "1h" });

      } else {
         jwttoken =  jwt.sign({
          sub:userFound.id,
          name:userFound.name,
          email:userFound.email,
          picture:userFound.picture
        },secratKey || "",{ expiresIn: "1h" });
      }

      res.cookie("app_token", jwttoken, {
      httpOnly: true,
      secure:true,
      sameSite: "none",
      maxAge: 3600000,
      });

      res.redirect(Frontend_URl || "http://localhost:5173/");

    } catch (err) {
      console.log("error while creating user", err);
      res.redirect(Frontend_URl + "/error" || "http://localhost:5173/error");
    }
  }
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    console.log("in callback current uesr loginein", req);

    res.redirect(Frontend_URl || "http://localhost:5173/"); // or wherever in frontend
  }
);

const io = new Server(server, {
  cors: { origin: "*" },
});

let userId: any;

dbconnection()
  .then((data) => {
    console.log("MongoDB connected successfully");
  })
  .catch((err) => {
    console.log("err", err);
    console.log("erro while connecting db");
  });

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  userId = socket.id;

  socket.setMaxListeners(100); // max hundrad lisner

  addUserSocket(socket.id, socket);

  socket.on("input", (data) => {
    getAIResponse(socket.id, data);
  });

  socket.on("test", (data) => {
    // console.log("test input");
    console.log("data", data);
  });

  socket.on("disconnect", () => {
    if (userId) removeUserSocket(userId);
    console.log(`User ${userId} disconnected`);
    console.log("Client disconnected:", socket.id);
  });
});

app.get("", (req, res) => {
  res.status(200).send({ message: "get request is working" });
});

// embeidingtranform().then(()=>{
// run().then(()=>{
//   //  storeText("4","i am graduated from asmita college");
//    searchText("where i studied");
// }).catch(err=>{
//   console.error("Error:", err);
// })
// }).catch(err => {
//   console.error('Error:', err);
// });

server.listen(3000, "0.0.0.0", () => {
  console.log("Socket server running on http://localhost:3000");
});
