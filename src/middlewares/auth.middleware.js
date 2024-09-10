import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { SECRET_CODE } from "../config.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.headers;

    if (!authorization) throw new Error("요청한 사용자의 토큰이 없습니다.");

    const [tokenType, token] = authorization.split(" ");
    if (tokenType !== "Bearer")
      throw new Error("토큰 타입이 Bearer 형식이 아닙니다.");

    const decodedToken = jwt.verify(token, SECRET_CODE);
    const userId = decodedToken.userId;

    const user = await prisma.users.findFirst({
      where: { userId: userId },
    });
    if (!user) throw new Error("토큰 사용자가 존재하지 않습니다.");
    req.user = user;
    next();
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}
