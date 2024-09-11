import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get(
  "/inventory/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      user: { userNo },
    } = req;

    try {
      const [inventory, character] = await Promise.all([
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
        prisma.characters.findFirst({ where: { characterNo: +characterNo } }),
      ]);
      if (!inventory || !character)
        return res
          .status(404)
          .json({ errorMessage: "조회하려는 캐릭터가 없습니다." });
      if (userNo !== character.userNo)
        return res
          .status(401)
          .json({ errorMessage: "본인의 캐릭터만 조회 가능합니다." });

      return res.status(200).json({
        data: JSON.parse(inventory.items),
      });
    } catch (err) {
      res.status(500).json({ errorMessage: "서버오류" });
    }
  }
);

router.get("/equip/:characterNo", async (req, res, next) => {
  const { characterNo } = req.params;

  try {
    const equip = await prisma.equips.findFirst({
      where: { equipNo: +characterNo },
    });
    if (!equip)
      return res
        .status(404)
        .json({ errorMessage: "조회하려는 장비창이 없습니다." });
    if (Object.keys(equip.items).length === 0)
      return res.status(200).json({ data: [] });

    return res.status(200).json({
      data: JSON.parse(equip.items),
    });
  } catch (err) {
    res.status(500).json({ errorMessage: "서버오류" });
  }
});

router.post(
  "/equipItem/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      body: { doEquipItem },
      user: { userNo },
    } = req;

    try {
      const [character, inventory, equip, item] = await Promise.all([
        prisma.characters.findFirst({ where: { characterNo: +characterNo } }),
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
        prisma.equips.findFirst({ where: { equipNo: +characterNo } }),
        prisma.items.findFirst({ where: { itemNo: +doEquipItem } }),
      ]);

      if (!character)
        return res.status(404).json({
          errorMessage: " 장비를 착용할 캐릭터가 존재하지 않습니다. ",
        });
      if (character.userNo !== userNo)
        return res
          .status(401)
          .json({ errorMessage: " 장비 착용 권한이 없습니다. " });

      const inventoryItems = JSON.parse(inventory.items);
      const equipItems = JSON.parse(equip.items);

      if (equipItems[doEquipItem])
        return res
          .status(409)
          .json({ errorMessage: "이미 장착하신 아이템입니다." });

      if (!inventoryItems[doEquipItem])
        return res
          .status(404)
          .json({ errorMessage: "보유하지 않은 아이템입니다." });

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
          updatedCharacter,
          updatedInventory,
          updatedEquip,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ errorMessage: "서버 오류" });
    }
  }
);

router.post("/unEquipItem", authMiddleware, async (req, res, next) => {});
export default router;
