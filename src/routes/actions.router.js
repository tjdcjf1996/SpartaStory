import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import isCharacterMiddleware from "../middlewares/isCharacter.middleware.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

// 인벤토리 조회 라우터
router.get(
  "/inventory/:characterNo", // URL 경로에 characterNo 파라미터 포함
  authMiddleware, // 인증 미들웨어
  isCharacterMiddleware, // 캐릭터 확인 미들웨어
  async (req, res, next) => {
    // 비동기 함수로 요청 처리
    const {
      params: { characterNo }, // URL 파라미터에서 characterNo 추출
    } = req;

    try {
      // 데이터베이스에서 characterNo에 해당하는 인벤토리 검색
      const inventory = await prisma.inventories.findFirst({
        where: { inventoryNo: +characterNo }, // characterNo를 숫자로 변환하여 검색 조건 설정
      });
      // 검색된 인벤토리의 items를 JSON으로 파싱하여 응답
      return res.status(200).json({
        data: JSON.parse(inventory.items), // items 필드를 JSON 객체로 변환하여 응답 데이터 설정
      });
    } catch (err) {
      // 에러 발생 시 다음 미들웨어로 에러 전달
      next(err);
    }
  }
);

// 장비창 조회 라우터
router.get("/equip/:characterNo", async (req, res, next) => {
  const { characterNo } = req.params; // URL 파라미터에서 characterNo 추출

  try {
    // 데이터베이스에서 characterNo에 해당하는 장비창 검색
    const equip = await prisma.equips.findFirst({
      where: { equipNo: +characterNo }, // characterNo를 숫자로 변환하여 검색 조건 설정
    });
    // 장비창이 없을 경우 에러 발생
    if (!equip) throw new CustomErr("조회하려는 장비창이 없습니다.", 404);

    // 장비창이 비어 있을 경우 빈 배열 반환
    if (Object.keys(equip.items).length === 0)
      return res.status(200).json({ data: [] });

    // 검색된 장비창의 items를 JSON으로 파싱하여 응답
    return res.status(200).json({
      data: JSON.parse(equip.items), // items 필드를 JSON 객체로 변환하여 응답 데이터 설정
    });
  } catch (err) {
    // 에러 발생 시 다음 미들웨어로 에러 전달
    next(err);
  }
});

// 장비 착용 라우트
router.post(
  "/equipItem/:characterNo", // URL 경로에 characterNo 파라미터 포함
  authMiddleware, // 인증 미들웨어
  isCharacterMiddleware, // 캐릭터 확인 미들웨어
  async (req, res, next) => {
    const {
      params: { characterNo }, // URL 파라미터에서 characterNo 추출
      body: { doEquipItem }, // body에서 doEquipItem 추출
      character, // 미들웨어에서 설정된 character 객체
    } = req;

    try {
      // 데이터베이스에서 characterNo에 해당하는 인벤토리, 장비창, 아이템 검색
      const [inventory, equip, item] = await Promise.all([
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
        prisma.equips.findFirst({ where: { equipNo: +characterNo } }),
        prisma.items.findFirst({ where: { itemNo: +doEquipItem } }),
      ]);

      const inventoryItems = JSON.parse(inventory.items); // 인벤토리 아이템 JSON 파싱
      const equipItems = JSON.parse(equip.items); // 장비창 아이템 JSON 파싱

      // 이미 장착된 아이템인지 확인
      if (equipItems[doEquipItem])
        throw new CustomErr("이미 장착하신 아이템입니다.", 409);
      // 인벤토리에 아이템이 있는지 확인
      if (!inventoryItems[doEquipItem])
        throw new CustomErr("보유하지 않은 아이템입니다.", 404);

      // 장착할 아이템 인벤토리에서 제거
      if (inventoryItems[doEquipItem] === 1) delete inventoryItems[doEquipItem];
      else inventoryItems[doEquipItem] -= 1;

      // 장착한 아이템 장비창에 등록
      equipItems[doEquipItem] = 1;

      // 캐릭터 스탯 조정
      for (const [key, value] of Object.entries(item.itemStat)) {
        character[key] += value;
      }

      // 데이터베이스 업데이트
      const [updatedCharacter, updatedInventory, updatedEquip] =
        await Promise.all([
          prisma.characters.update({
            where: { characterNo: +characterNo },
            data: { health: character.health, power: character.power },
          }),
          prisma.inventories.update({
            where: { inventoryNo: +characterNo },
            data: { items: JSON.stringify(inventoryItems) },
          }),
          prisma.equips.update({
            where: { equipNo: +characterNo },
            data: { items: JSON.stringify(equipItems) },
          }),
        ]);

      return res.status(200).json({
        data: {
          character_health: updatedCharacter.health,
          character_power: updatedCharacter.power,
          updatedInventory: JSON.parse(updatedInventory.items),
          updatedEquip: JSON.parse(updatedEquip.items),
        },
      });
    } catch (err) {
      // 에러 발생 시 다음 미들웨어로 에러 전달
      next(err);
    }
  }
);

// 장비 탈착 라우트
router.post(
  "/unEquipItem/:characterNo", // URL 경로에 characterNo 파라미터 포함
  authMiddleware, // 인증 미들웨어
  isCharacterMiddleware, // 캐릭터 확인 미들웨어
  async (req, res, next) => {
    const {
      params: { characterNo }, // URL 파라미터에서 characterNo 추출
      body: { unEquipItem, requestId }, // body에서 unEquipItem 및 requestId 추출
      character, // 미들웨어에서 설정된 character 객체
    } = req;

    try {
      // 데이터베이스에서 characterNo에 해당하는 인벤토리, 장비창, 아이템 검색
      const [inventory, equip, item] = await Promise.all([
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
        prisma.equips.findFirst({ where: { equipNo: +characterNo } }),
        prisma.items.findFirst({ where: { itemNo: +unEquipItem } }),
      ]);

      const inventoryItems = JSON.parse(inventory.items); // 인벤토리 아이템 JSON 파싱
      const equipItems = JSON.parse(equip.items); // 장비창 아이템 JSON 파싱

      // 장착하지 않은 아이템인지 확인
      if (!equipItems[unEquipItem])
        throw new CustomErr("장착하지 않은 아이템입니다.", 404);

      // 장착한 아이템 장비창에서 제거
      delete equipItems[unEquipItem];

      // 탈착한 아이템 인벤토리에 추가
      if (!inventoryItems[unEquipItem]) inventoryItems[unEquipItem] = 1;
      else inventoryItems[unEquipItem] += 1;

      // 캐릭터 스탯 조정
      for (const [key, value] of Object.entries(item.itemStat)) {
        character[key] -= value;
      }

      // 데이터베이스 업데이트
      const [updatedCharacter, updatedInventory, updatedEquip] =
        await Promise.all([
          prisma.characters.update({
            where: { characterNo: +characterNo },
            data: { health: character.health, power: character.power },
          }),
          prisma.inventories.update({
            where: { inventoryNo: +characterNo },
            data: { items: JSON.stringify(inventoryItems) },
          }),
          prisma.equips.update({
            where: { equipNo: +characterNo },
            data: { items: JSON.stringify(equipItems) },
          }),
        ]);

      return res.status(200).json({
        data: {
          character_health: updatedCharacter.health,
          character_power: updatedCharacter.power,
          updatedInventory: JSON.parse(updatedInventory.items),
          updatedEquip: JSON.parse(updatedEquip.items),
        },
      });
    } catch (err) {
      // 에러 발생 시 다음 미들웨어로 에러 전달
      next(err);
    }
  }
);

// 머니 증가 라우트
router.get(
  "/showMeTheMoney/:characterNo", // URL 경로에 characterNo 파라미터 포함
  authMiddleware, // 인증 미들웨어
  isCharacterMiddleware, // 캐릭터 확인 미들웨어
  async (req, res, next) => {
    // 비동기 함수로 요청 처리
    const {
      params: { characterNo }, // URL 파라미터에서 characterNo 추출
      character, // 미들웨어에서 설정된 character 객체
    } = req;

    try {
      // 캐릭터의 돈을 100원 증가
      character.money += 100;
      // 데이터베이스에서 캐릭터의 돈 업데이트
      const changedCharacter = await prisma.characters.update({
        where: { characterNo: +characterNo },
        data: { money: character.money },
      });

      return res.status(200).json({
        message: `100원이 추가되어 잔액이 ${changedCharacter.money} 원이 되었습니다.`,
      });
    } catch (err) {
      // 에러 발생 시 다음 미들웨어로 에러 전달
      next(err);
    }
  }
);

export default router;
