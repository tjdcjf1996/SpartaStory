import express from "express";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import isCharacterMiddleware from "../middlewares/isCharacter.middleware.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

// 아이템 구매 라우터
router.post(
  "/shop/buy/:characterNo",
  authMiddleware, // 인증 미들웨어
  isCharacterMiddleware, // 캐릭터 확인 미들웨어
  async (req, res, next) => {
    const {
      params: { characterNo }, // URL에서 characterNo 추출
      body: shoppingCart, // Body에서 쇼핑카트 추출
      character, // 미들웨어에서 생성한 캐릭터 추출
    } = req;

    try {
      // 데이터베이스에서 characterNo에 해당하는 인벤토리를 찾음
      const inventory = await prisma.inventories.findFirst({
        where: { inventoryNo: +characterNo },
      });

      const inventoryItems = JSON.parse(inventory.items); // 인벤토리 아이템을 JSON으로 파싱
      let price = 0;

      // 쇼핑카트 가격 계산
      for (const { itemNo, count } of shoppingCart) {
        const item = await prisma.items.findFirst({ where: { itemNo } });
        if (!item) throw new CustomErr("선택하신 아이템이 없습니다.", 404); // 아이템이 없으면 에러 발생
        price += item.itemPrice * count; // 총 가격 계산
      }

      // 결제 처리
      if (character.money < price)
        throw new CustomErr(`금액 부족. ${character.money} 원 보유중`, 400); // 금액 부족 시 에러 발생

      // 인벤토리 및 캐릭터 업데이트
      for (const { itemNo, count } of shoppingCart) {
        inventoryItems[itemNo] = (inventoryItems[itemNo] || 0) + count; // 인벤토리 아이템 수량 업데이트
      }

      const [updatedCharacter, updatedInventory] = await Promise.all([
        prisma.characters.update({
          where: { characterNo: +characterNo },
          data: { money: character.money - price }, // 캐릭터 돈 업데이트
        }),
        prisma.inventories.update({
          where: { inventoryNo: +characterNo },
          data: { items: JSON.stringify(inventoryItems) }, // 인벤토리 아이템 업데이트
        }),
      ]);

      res.status(200).json({
        data: {
          changedMoney: updatedCharacter.money, // 업데이트된 돈 반환
          changedInventory: JSON.parse(updatedInventory.items), // 업데이트된 인벤토리 반환
        },
      });
    } catch (err) {
      next(err); // 에러 발생 시 다음 미들웨어로 전달
    }
  }
);

// 아이템을 판매 라우터
router.post(
  "/shop/sell/:characterNo",
  authMiddleware, // 인증 미들웨어
  isCharacterMiddleware, // 캐릭터 확인 미들웨어
  async (req, res, next) => {
    const {
      params: { characterNo }, // URL에서 characterNo 추출
      body: sellingCart, // BOdy에서 판매카트 추출
      character, // 요청 객체에서 캐릭터 정보 추출
    } = req;

    try {
      // 데이터베이스에서 characterNo에 해당하는 인벤토리를 찾음
      const inventory = await prisma.inventories.findFirst({
        where: { inventoryNo: +characterNo },
      });

      const inventoryItems = JSON.parse(inventory.items); // 인벤토리 아이템을 JSON으로 파싱
      let price = 0;

      // 판매카트 가격 계산
      for (const { itemNo, count } of sellingCart) {
        const item = await prisma.items.findFirst({ where: { itemNo } });
        if (!item) throw new CustomErr("선택하신 아이템이 없습니다.", 404); // 아이템이 없으면 에러 발생
        if (!inventoryItems[itemNo] || inventoryItems[itemNo] < count)
          throw new CustomErr(
            "판매할 아이템보다 보유한 아이템이 적습니다.",
            400
          ); // 보유한 아이템이 부족하면 에러 발생
        price += Math.ceil(item.itemPrice * count * 0.6); // 총 판매 가격 계산 (60%의 금액만 환불)
      }

      // 인벤토리 업데이트
      for (const { itemNo, count } of sellingCart) {
        if (inventoryItems[itemNo] - count === 0) {
          delete inventoryItems[itemNo]; // 아이템 수량이 0이면 삭제
        } else {
          inventoryItems[itemNo] -= count; // 아이템 수량 감소
        }
      }

      const [updatedCharacter, updatedInventory] = await Promise.all([
        prisma.characters.update({
          where: { characterNo: +characterNo },
          data: { money: character.money + price }, // 캐릭터 돈 업데이트
        }),
        prisma.inventories.update({
          where: { inventoryNo: +characterNo },
          data: { items: JSON.stringify(inventoryItems) }, // 인벤토리 아이템 업데이트
        }),
      ]);

      res.status(200).json({
        data: {
          changedMoney: updatedCharacter.money, // 업데이트된 돈 반환
          changedInventory: JSON.parse(updatedInventory.items), // 업데이트된 인벤토리 반환
        },
      });
    } catch (err) {
      next(err); // 에러 발생 시 다음 미들웨어로 전달
    }
  }
);

export default router;
