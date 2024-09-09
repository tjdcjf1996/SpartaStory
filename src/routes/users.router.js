import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
// import jwt from "jsonwebtoken";
// import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/sign-up", async (req, res, next) => {
  const { userId, userPw, confirmPw, userName } = req.body;

  const validUserId = /^[a-z0-9]+$/;

  const isUser = await prisma.users.findFirst({
    where: { userId },
  });
  if (isUser)
    return res.status(400).json({
      errorMessage: "이미 존재하는 아이디 입니다.",
    });
  if (!validUserId.test(userId))
    return res.status(400).json({
      errorMessage: "아이디는 소문자 + 숫자 형식만 가능합니다.",
    });
  if (userPw.length < 6)
    return res.status(400).json({
      errorMessage: "비밀번호는 최소 6자리 이상만 가능합니다.",
    });
  if (userPw !== confirmPw)
    return res.status(400).json({
      errorMessage: "비밀번호와 확인이 일치하지 않습니다.",
    });

  const hashedPw = await bcrypt.hash(userPw, 7);
  const user = await prisma.users.create({
    data: { userId, userPw: hashedPw, userName },
  });

  return res.status(200).json({
    data: {
      userId,
      userName,
    },
  });
});

router.post("/sign-in", async (req, res, next) => {
  const { userId, userPw } = req.body;
  const isUser = await prisma.users.findFirst({
    where: { userId },
  });
  if (!isUser)
    return res.status(400).json({
      errorMessage: "없는 아이디 입니다.",
    });
  if (!(await bcrypt.compare(userPw, isUser.userPw)))
    return res.status(400).json({
      errorMessage: "틀린 비밀번호 입니다.",
    });
  const token = jwt.sign({ userId: isUser.userId }, "sparta");
  res.setHeader("Authorization", `Bearer ${token}`);
  return res.status(200).json({ message: "로그인 성공" });
});

export default router;
