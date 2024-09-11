import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import isCharacterMiddleware from "../middlewares/isCharacter.middleware.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

router.post(
  "/shop/buy/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      body: shoppingCart,
      character,
    } = req;

    try {
      const inventory = await prisma.inventories.findFirst({
        where: { inventoryNo: +characterNo },
      });

      const inventoryItems = JSON.parse(inventory.items);
      let price = 0;

      // 쇼핑카트 가격 계산
      for (const { itemNo, count } of shoppingCart) {
        const item = await prisma.items.findFirst({ where: { itemNo } });
        if (!item) throw new CustomErr("선택하신 아이템이 없습니다.", 404);
        price += item.itemPrice * count;
      }

      // 결제 처리
      if (character.money < price)
        throw new CustomErr(`금액 부족. ${character.money} 원 보유중`, 400);

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
      next(err);
    }
  }
);

router.post(
  "/shop/sell/:characterNo",
  authMiddleware,
  isCharacterMiddleware,
  async (req, res, next) => {
    const {
      params: { characterNo },
      body: sellingCart,
      character,
    } = req;

    try {
      const inventory = await prisma.inventories.findFirst({
        where: { inventoryNo: +characterNo },
      });

      const inventoryItems = JSON.parse(inventory.items);
      let price = 0;

      // 판매카트 가격 계산
      for (const { itemNo, count } of sellingCart) {
        const item = await prisma.items.findFirst({ where: { itemNo } });
        if (!item) throw new CustomErr("선택하신 아이템이 없습니다.", 404);
        if (!inventoryItems[itemNo] || inventoryItems[itemNo] < count)
          throw new CustomErr(
            "판매할 아이템보다 보유한 아이템이 적습니다.",
            400
          );
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
      next(err);
    }
  }
);

export default router;
