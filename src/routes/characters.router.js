import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import CustomErr from "../utils/CustomErr.js";
import isCharacterMiddleware from "../middlewares/isCharacter.middleware.js";
import { Prisma } from "@prisma/client";
const router = express.Router();

// 캐릭터 추가

router.post("/character", authMiddleware, async (req, res, next) => {
  const {
    body: { characterName }, // body에서 characterName 추출
    user: { userNo }, // 미들웨어에서 설정한 user에서 userNo 추출
  } = req;

  try {
    // 데이터베이스에서 해당 캐릭터 이름이 이미 존재하는지 확인합니다.
    const isCharacter = await prisma.characters.findFirst({
      where: { characterName },
    });
    if (isCharacter) throw new CustomErr("이미 있는 캐릭터명입니다.", 409); // 이미 존재하는 캐릭터 이름일 경우 에러를 발생시킵니다.

    // 새로운 캐릭터를 데이터베이스에 생성합니다. (트랜잭션)
    const character = await prisma.$transaction(
      async (tx) => {
        const character = await tx.characters.create({
          data: {
            characterName,
            userNo,
            inventory: {
              create: { items: JSON.stringify({}) }, // 인벤토리 초기화
            },
            equip: { create: { items: JSON.stringify({}) } }, // 장비창 초기화
          },
        });

        return character;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    // 생성된 캐릭터의 번호를 응답으로 반환합니다.
    return res.status(201).json({
      data: { characterNo: character.characterNo },
    });
  } catch (err) {
    next(err); // 에러가 발생하면 다음 미들웨어로 전달합니다.
  }
});

// 캐릭터 삭제

router.delete(
  "/character/delete/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const { character } = req; // 미들웨어에서  설정한 character 객체를 추출합니다.

    try {
      // 데이터베이스에서 해당 캐릭터를 삭제합니다. (트랜잭션)
      const deleteCharacter = await prisma.$transaction(
        async (tx) => {
          const deleteCharacter = await tx.characters.delete({
            where: { characterNo: character.characterNo },
          });
          return deleteCharacter;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }
      );

      // 삭제된 캐릭터 정보를 응답으로 반환합니다.
      return res.status(200).json({ data: { deleteCharacter } });
    } catch (err) {
      next(err); // 에러가 발생하면 다음 미들웨어로 전달합니다.
    }
  }
);

// 캐릭터 조회

router.get(
  "/character/info/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    // 매개변수에서 characterNo와 userNo를 추출합니다.
    const {
      params: { characterNo },
      user: { userNo },
    } = req;

    try {
      // 데이터베이스에서 해당 캐릭터를 조회합니다.
      const character = await prisma.characters.findFirst({
        where: { characterNo: +characterNo },
      });
      if (!character) throw new CustomErr("조회하려는 계정이 없습니다. ", 404); // 캐릭터가 없을 경우 에러를 발생시킵니다.

      // 반환할 데이터를 구성합니다.
      const returnData = {
        characterName: character.characterName,
        health: character.health,
        power: character.power,
      };
      if (character.userNo === userNo) returnData.money = character.money; // 사용자 번호가 일치하면 돈 정보를 추가합니다.

      // 캐릭터 정보를 응답으로 반환합니다.
      return res.status(200).json({
        data: returnData,
      });
    } catch (err) {
      next(err); // 에러가 발생하면 다음 미들웨어로 전달합니다.
    }
  }
);

export default router;
