import express from "express";
import { prisma } from "../utils/prisma/index.js";

const router = express.Router();

// item 등록

router.post("/item", async (req, res, next) => {
  const { itemNo, itemName, itemStat, itemPrice } = req.body;
  try {
    const isItem = await prisma.items.findFirst({
      where: { itemNo },
    });
    if (isItem)
      return res.status(409).json({ message: "이미 있는 아이템 넘버입니다." });

    const item = await prisma.items.create({
      data: {
        itemNo,
        itemName,
        itemPrice,
        itemStat,
      },
    });

    return res.status(201).json({ data: item });
  } catch (err) {
    res.status(500).json({ errorMessage: "서버 오류" });
  }
});

// item 수정

router.patch("/updateItem/:itemNo", async (req, res, next) => {
  const {
    params: { itemNo },
    body: { itemName, itemStat },
  } = req;

  try {
    const Item = await prisma.items.findFirst({
      where: { itemNo: +itemNo },
    });

    if (!Item) return res.status(404).json({ message: "없는 아이템입니다." });

    const updateItem = await prisma.items.update({
      where: { itemNo: +itemNo },
      data: {
        itemName,
        itemStat,
      },
    });

    return res.status(200).json({ data: updateItem });
  } catch (err) {
    res.status(500).json({ errorMessage: "서버 오류" });
  }
});

// item 목록 조회
router.get("/item", async (req, res, next) => {
  const items = await prisma.items.findMany();
  try {
    if (!items)
      return res.status(404).json({ message: "등록된 아이템이 없습니다." });
    return res.status(200).json({ data: items });
  } catch (err) {
    res.status(500).json({ errorMessage: "서버 오류" });
  }
});

// item 목록 상세조회

router.get("/item/:itemNo", async (req, res, next) => {
  const { itemNo } = req.params;
  try {
    const items = await prisma.items.findFirst({
      where: { itemNo: +itemNo },
    });
    if (!items)
      return res.status(404).json({ message: "등록된 아이템이 없습니다." });

    return res.status(200).json({ data: items });
  } catch (err) {
    res.status(500).json({ errorMessage: "서버 오류" });
  }
});

export default router;
