import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// 캐릭터 추가

router.post("/character", authMiddleware, async (req, res, next) => {
  const { characterName } = req.body;
  const { userNo } = req.user;
  console.log(userNo);
  const isCharacter = await prisma.characters.findFirst({
    where: { characterName },
  });
  if (isCharacter)
    return res.status(409).json({ message: "이미 있는 캐릭터명입니다. " });

  const character = await prisma.characters.create({
    data: {
      characterName,
      userNo,
      inventory: {
        create: {
          items: JSON.stringify([]),
        },
      },
      equip: {
        create: {
          items: JSON.stringify([]),
        },
      },
    },
  });

  const characterNo = character.characterNo;
  return res.status(201).json({
    data: { characterNo },
  });
});

// 캐릭터 삭제

router.delete(
  "/character/delete/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const { characterNo } = req.params;
    const { userNo } = req.user;
    const character = await prisma.characters.findFirst({
      where: { characterNo: +characterNo },
    });
    if (!character)
      return res.status(404).json({ message: "삭제하려는 계정이 없습니다. " });

    if (character.userNo !== userNo)
      return res.status(401).json({ message: "계정 주인이 아닙니다." });

    const deleteCharacter = await prisma.characters.delete({
      where: { characterNo: +characterNo },
    });

    return res.status(200).json({ data: { deleteCharacter } });
  }
);

// 캐릭터 조회

router.get(
  "/character/info/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const { characterNo } = req.params;
    const { userNo } = req.user;
    const character = await prisma.characters.findFirst({
      where: { characterNo: +characterNo },
    });
    if (!character)
      return res.status(404).json({ message: "삭제하려는 계정이 없습니다. " });

    if (character.userNo === userNo) {
      return res.status(200).json({
        data: {
          characterName: character.characterName,
          money: character.money,
          health: character.health,
          power: character.power,
        },
      });
    } else {
      return res.status(200).json({
        data: {
          characterName: character.characterName,
          health: character.health,
          power: character.power,
        },
      });
    }
  }
);

export default router;
