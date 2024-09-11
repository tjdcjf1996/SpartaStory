import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRET_CODE } from "../config.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

router.post("/sign-up", async (req, res, next) => {
  const {
    body: { userId, userPw, confirmPw, userName },
  } = req;
  const validUserId = /^[a-z0-9]+$/;

  try {
    const isUser = await prisma.users.findFirst({
      where: { userId },
    });

    if (isUser) throw new CustomErr("이미 존재하는 아이디 입니다.", 409);
    if (!validUserId.test(userId))
      throw new CustomErr("아이디는 소문자 + 숫자 형식만 가능합니다.", 400);
    if (userPw.length < 6)
      throw new CustomErr("비밀번호는 최소 6자리 이상만 가능합니다.", 400);
    if (userPw !== confirmPw)
      throw new CustomErr("비밀번호와 확인이 일치하지 않습니다.", 401);

    const hashedPw = await bcrypt.hash(userPw, 10);
    const user = await prisma.users.create({
      data: { userId, userPw: hashedPw, userName },
    });

    return res.status(201).json({
      data: {
        userNo: user.userNo,
        userId: user.userId,
        userName: user.userName,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/sign-in", async (req, res, next) => {
  const {
    body: { userId, userPw },
  } = req;
  try {
    const isUser = await prisma.users.findFirst({
      where: { userId },
    });
    if (!isUser) throw new CustomErr("없는 아이디 입니다.", 400);
    if (!(await bcrypt.compare(userPw, isUser.userPw)))
      throw new CustomErr("틀린 비밀번호 입니다.", 401);
    const token = jwt.sign({ userId: userId }, SECRET_CODE);
    res.setHeader("Authorization", `Bearer ${token}`);
    return res
      .status(200)
      .json({ message: "로그인 성공, 헤더에 토큰값이 반환되었습니다." });
  } catch (err) {
    next(err);
  }
});

export default router;
