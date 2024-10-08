import express from "express";
import userRouter from "./routes/users.router.js";
import characterRouter from "./routes/characters.router.js";
import itemRouter from "./routes/items.router.js";
import shopRouter from "./routes/shop.router.js";
import actionRouter from "./routes/actions.router.js";
import { PORT } from "./config.js";
import errorHandlingMiddleware from "./middlewares/error-handling.middleware.js";
import LogMiddleware from "./middlewares/log.middleware.js";

const app = express();

app.use(LogMiddleware);
app.use(express.json());
app.use("/api", [
  userRouter,
  characterRouter,
  itemRouter,
  shopRouter,
  actionRouter,
]);

app.use(errorHandlingMiddleware);

app.listen(PORT, () => {
  console.log(PORT, "포트로 서버가 열렸어요!");
});
