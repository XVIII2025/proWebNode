import express from "express"
import { router as user } from "./api/user";
import { router as vote } from "./api/vote";
import { router as upload } from "./api/upload";
import bodyParser from "body-parser";
import cors from "cors";

export const app = express();

app.use(
  cors({
      origin: ["https://projectweb2-2.web.app", "http://localhost:4200"],
      // origin: "*", //เรียกได้ทุกเว็บ
  })
);

app.use(bodyParser.text());
app.use(bodyParser.json());

app.use("/user", user);
app.use("/vote", vote);
app.use("/upload", upload);

// app.use("/", (req, res) => {
//   res.send("Test!!!");
// });
