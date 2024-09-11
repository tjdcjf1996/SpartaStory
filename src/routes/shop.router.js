import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/shop/buy/:characterNo", authMiddleware, async (req, res) => {
  const { characterNo } = req.params;
  const { userNo } = req.user;
  const shoppingCart = req.body;

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
      return res.status(400).json({ errorMessage: "금액 부족." });

    // 인벤토리 및 캐릭터 업데이트
    const updatedInventory = { ...inventoryItems };
    for (const { itemNo, count } of shoppingCart) {
      updatedInventory[itemNo] = (updatedInventory[itemNo] || 0) + count;
    }

    await Promise.all([
      prisma.characters.update({
        where: { characterNo: +characterNo },
        data: { money: character.money - price },
      }),
      prisma.inventories.update({
        where: { inventoryNo: +characterNo },
        data: { items: JSON.stringify(updatedInventory) },
      }),
    ]);

    res.status(200).json({
      data: {
        changedMoney: character.money - price,
        changedInventory: updatedInventory,
      },
    });
  } catch (err) {
    res.status(500).json({ errorMessage: "서버 오류" });
  }
});

export default router;
