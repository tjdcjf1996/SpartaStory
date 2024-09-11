import express from "express";
import { prisma } from "../utils/prisma/index.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

// item 등록

router.post("/item", async (req, res, next) => {
  const { itemNo, itemName, itemStat, itemPrice } = req.body;
  try {
    const isItem = await prisma.items.findFirst({
      where: { itemNo },
    });
    if (isItem) throw new CustomErr("이미 있는 아이템 넘버입니다.", 409);

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
    next(err);
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

    if (!Item) throw new CustomErr("없는 아이템입니다.", 404);

    const updateItem = await prisma.items.update({
      where: { itemNo: +itemNo },
      data: {
        itemName,
        itemStat,
      },
    });

    return res.status(200).json({ data: updateItem });
  } catch (err) {
    next(err);
  }
});

// item 목록 조회
router.get("/item", async (req, res, next) => {
  const items = await prisma.items.findMany();
  try {
    if (!items) throw new CustomErr("등록된 아이템이 없습니다.", 404);
    return res.status(200).json({ data: items });
  } catch (err) {
    next(err);
  }
});

// item 목록 상세조회

router.get("/item/:itemNo", async (req, res, next) => {
  const { itemNo } = req.params;
  try {
    const items = await prisma.items.findFirst({
      where: { itemNo: +itemNo },
    });
    if (!items) throw new CustomErr("등록된 아이템이 없습니다.", 404);
    return res.status(200).json({ data: items });
  } catch (err) {
    next(err);
  }
});

export default router;
