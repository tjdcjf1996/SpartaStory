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

export default router;
