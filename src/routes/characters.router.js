import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import authMiddleware from "../middlewares/auth.middleware.js";
import { SECRET_CODE } from "../config.js";

const router = express.Router();

router.post("/character", authMiddleware, async (req, res, next) => {
  const { characterName } = req.body;
  const { userNo } = req.user;
  console.log(userNo);
  const isCharacter = await prisma.characters.findFirst({
    where: { characterName },
  });
  if (isCharacter)
    return res.status(400).json({ message: "이미 있는 캐릭터명입니다. " });

  const character = await prisma.characters.create({
    data: {
      characterName,
      userNo: userNo,
    },
  });
  return res.status(200).json({
    data: { character },
  });
});

export default router;
