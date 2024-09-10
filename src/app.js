import express from "express";
import userRouter from "./routes/users.router.js";
import characterRouter from "./routes/characters.router.js";
import itemRouter from "./routes/items.router.js";
import { PORT } from "./config.js";

const app = express();

app.use(express.json());
app.use("/api", [userRouter, characterRouter, itemRouter]);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
