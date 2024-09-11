import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import CustomErr from "../utils/CustomErr.js";
import isCharacterMiddleware from "../middlewares/isCharacter.middleware.js";
const router = express.Router();

// 캐릭터 추가

router.post("/character", authMiddleware, async (req, res, next) => {
  const {
    body: { characterName },
    user: { userNo },
  } = req;

  try {
    const isCharacter = await prisma.characters.findFirst({
      where: { characterName },
    });
    if (isCharacter) throw new CustomErr("이미 있는 캐릭터명입니다.", 409);

    const character = await prisma.characters.create({
      data: {
        characterName,
        userNo,
        inventory: {
          create: { items: JSON.stringify({}) },
        },
        equip: { create: { items: JSON.stringify({}) } },
      },
    });

    return res.status(201).json({
      data: { characterNo: character.characterNo },
    });
  } catch (err) {
    next(err);
  }
});

// 캐릭터 삭제

router.delete(
  "/character/delete/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const { character } = req;

    try {
      const deleteCharacter = await prisma.characters.delete({
        where: { characterNo: character.characterNo },
      });

      return res.status(200).json({ data: { deleteCharacter } });
    } catch (err) {
      next(err);
    }
  }
);

// 캐릭터 조회

router.get(
  "/character/info/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      user: { userNo },
    } = req;

    try {
      const character = await prisma.characters.findFirst({
        where: { characterNo: +characterNo },
      });
      if (!character) throw new CustomErr("조회하려는 계정이 없습니다. ", 404);

      const returnData = {
        characterName: character.characterName,
        health: character.health,
        power: character.power,
      };
      if (character.userNo === userNo) returnData.money = character.money;

      return res.status(200).json({
        data: returnData,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
