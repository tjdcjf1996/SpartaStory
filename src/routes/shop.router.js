import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/shop/buy/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      user: { userNo },
      body: shoppingCart,
    } = req;

    try {
      const [character, inventory] = await Promise.all([
        prisma.characters.findFirst({ where: { characterNo: +characterNo } }),
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
      ]);

      if (!character)
        return res
          .status(404)
          .json({ errorMessage: "존재하지 않는 캐릭터입니다." });
      if (character.userNo !== userNo)
        return res
          .status(401)
          .json({ errorMessage: "본인 캐릭터만 구매 가능합니다." });

      const inventoryItems = JSON.parse(inventory.items);
      let price = 0;

      // 쇼핑카트 가격 계산
      for (const { itemNo, count } of shoppingCart) {
        const item = await prisma.items.findFirst({ where: { itemNo } });
        if (!item)
          return res.status(404).json({ errorMessage: "아이템이 없습니다." });
        price += item.itemPrice * count;
      }

      // 결제 처리
      if (character.money < price)
        return res
          .status(400)
          .json({ errorMessage: `금액 부족. ${character.money} 원 보유중` });

      // 인벤토리 및 캐릭터 업데이트

      for (const { itemNo, count } of shoppingCart) {
        inventoryItems[itemNo] = (inventoryItems[itemNo] || 0) + count;
      }

      const [updatedCharacter, updatedInventory] = await Promise.all([
        prisma.characters.update({
          where: { characterNo: +characterNo },
          data: { money: character.money - price },
        }),
        prisma.inventories.update({
          where: { inventoryNo: +characterNo },
          data: { items: JSON.stringify(inventoryItems) },
        }),
      ]);

      res.status(200).json({
        data: {
          changedMoney: updatedCharacter.money,
          changedInventory: JSON.parse(updatedInventory.items),
        },
      });
    } catch (err) {
      res.status(500).json({ errorMessage: "서버 오류" });
    }
  }
);

router.post(
  "/shop/sell/:characterNo",
  authMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      user: { userNo },
      body: sellingCart,
    } = req;

    try {
      const [character, inventory] = await Promise.all([
        prisma.characters.findFirst({ where: { characterNo: +characterNo } }),
        prisma.inventories.findFirst({ where: { inventoryNo: +characterNo } }),
      ]);

      if (!character)
        return res
          .status(404)
          .json({ errorMessage: "존재하지 않는 캐릭터입니다." });
      if (character.userNo !== userNo)
        return res
          .status(401)
          .json({ errorMessage: "본인 캐릭터만 판매 가능합니다." });

      const inventoryItems = JSON.parse(inventory.items);
      let price = 0;

      // 판매카트 가격 계산
      for (const { itemNo, count } of sellingCart) {
        const item = await prisma.items.findFirst({ where: { itemNo } });
        if (!item)
          return res.status(404).json({ errorMessage: "아이템이 없습니다." });
        if (!inventoryItems[itemNo] || inventoryItems[itemNo] < count)
          return res.status(404).json({
            errorMessage: "판매할 아이템보다 보유한 아이템이 적습니다.",
          });
        price += Math.ceil(item.itemPrice * count * 0.6);
      }

      // 인벤토리 업데이트

      for (const { itemNo, count } of sellingCart) {
        if (inventoryItems[itemNo] - count === 0) {
          delete inventoryItems[itemNo];
        } else {
          inventoryItems[itemNo] -= count;
        }
      }

      const [updatedCharacter, updatedInventory] = await Promise.all([
        prisma.characters.update({
          where: { characterNo: +characterNo },
          data: { money: character.money + price },
        }),
        prisma.inventories.update({
          where: { inventoryNo: +characterNo },
          data: { items: JSON.stringify(inventoryItems) },
        }),
      ]);

      res.status(200).json({
        data: {
          changedMoney: updatedCharacter.money,
          changedInventory: JSON.parse(updatedInventory.items),
        },
      });
    } catch (err) {
      res.status(500).json({ errorMessage: "서버 오류" });
    }
  }
);

export default router;
