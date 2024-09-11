import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import isCharacterMiddleware from "../middlewares/isCharacter.middleware.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

router.get(
  "/inventory/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
    } = req;

    try {
      const inventory = prisma.inventories.findFirst({
        where: { inventoryNo: +characterNo },
      });
      return res.status(200).json({
        data: JSON.parse(inventory.items),
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/equip/:characterNo", async (req, res, next) => {
  const { characterNo } = req.params;

  try {
    const equip = await prisma.equips.findFirst({
      where: { equipNo: +characterNo },
    });
    if (!equip) throw new CustomErr("조회하려는 장비창이 없습니다.", 404);

    if (Object.keys(equip.items).length === 0)
      return res.status(200).json({ data: [] });

    return res.status(200).json({
      data: JSON.parse(equip.items),
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/equipItem/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      body: { doEquipItem },
      character,
    } = req;

    try {
      const [inventory, equip, item] = await Promise.all([
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
        prisma.equips.findFirst({ where: { equipNo: +characterNo } }),
        prisma.items.findFirst({ where: { itemNo: +doEquipItem } }),
      ]);

      const inventoryItems = JSON.parse(inventory.items);
      const equipItems = JSON.parse(equip.items);

      if (equipItems[doEquipItem])
        throw new CustomErr("이미 장착하신 아이템입니다.", 409);
      if (!inventoryItems[doEquipItem])
        throw new CustomErr("보유하지 않은 아이템입니다.", 404);
      // 장착할 아이템 인벤토리 제거
      if (inventoryItems[doEquipItem] === 1) delete inventoryItems[doEquipItem];
      else inventoryItems[doEquipItem] -= 1;

      // 장착한 아이템 장비창에 등록
      equipItems[doEquipItem] = 1;

      // 캐릭터 스탯 조정
      for (const [key, value] of Object.entries(item.itemStat)) {
        character[key] += value;
      }

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
      next(err);
    }
  }
);

router.post(
  "/unEquipItem/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      body: { unEquipItem },
      character,
    } = req;

    try {
      const [inventory, equip, item] = await Promise.all([
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
        prisma.equips.findFirst({ where: { equipNo: +characterNo } }),
        prisma.items.findFirst({ where: { itemNo: +unEquipItem } }),
      ]);

      const inventoryItems = JSON.parse(inventory.items);
      const equipItems = JSON.parse(equip.items);

      if (!equipItems[unEquipItem])
        throw new CustomErr("장착하지 않은 아이템입니다.", 404);

      // 장착한 아이템 장비창에서 제거
      delete equipItems[unEquipItem];

      // 탈착한 아이템 인벤토리 추가
      if (!inventoryItems[unEquipItem]) inventoryItems[unEquipItem] = 1;
      else inventoryItems[unEquipItem] += 1;

      // 캐릭터 스탯 조정
      for (const [key, value] of Object.entries(item.itemStat)) {
        character[key] -= value;
      }

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
      next(err);
    }
  }
);

router.get(
  "/showMeTheMoney/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      character,
    } = req;

    try {
      character.money += 100;
      const changedCharacter = await prisma.characters.update({
        where: { characterNo: +characterNo },
        data: { money: character.money },
      });

      return res.status(200).json({
        message: `100원이 추가되어 잔액이 ${changedCharacter.money} 원이 되었습니다.`,
      });
    } catch (err) {
      next(err);
    }
  }
);
export default router;
