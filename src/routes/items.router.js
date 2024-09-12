import express from "express";
import { prisma } from "../utils/prisma/index.js";
import CustomErr from "../utils/CustomErr.js";

const router = express.Router();

// item 등록

router.post("/item", async (req, res, next) => {
  // body에서 등록할 아이템 정보를 추출합니다.
  const { itemNo, itemName, itemStat, itemPrice } = req.body;
  try {
    // 데이터베이스에서 해당 아이템 번호가 이미 존재하는지 확인합니다.
    const isItem = await prisma.items.findFirst({
      where: { itemNo },
    });
    if (isItem) throw new CustomErr("이미 있는 아이템 넘버입니다.", 409); // 이미 존재하는 아이템 번호일 경우 에러를 발생시킵니다.

    // 새로운 아이템을 데이터베이스에 생성합니다.
    const item = await prisma.items.create({
      data: {
        itemNo,
        itemName,
        itemPrice,
        itemStat,
      },
    });

    // 생성된 아이템 정보를 반환합니다.
    return res.status(201).json({ data: item });
  } catch (err) {
    next(err); // 에러가 발생하면 다음 미들웨어로 전달합니다.
  }
});

// item 수정

router.patch("/updateItem/:itemNo", async (req, res, next) => {
  // URL에서 itemNo를 추출하고, body에서 itemName과 itemStat을 추출합니다.
  const {
    params: { itemNo },
    body: { itemName, itemStat },
  } = req;

  try {
    // 데이터베이스에서 해당 아이템 번호가 존재하는지 확인합니다.
    const Item = await prisma.items.findFirst({
      where: { itemNo: +itemNo },
    });

    if (!Item) throw new CustomErr("없는 아이템입니다.", 404); // 아이템이 없을 경우 에러를 발생시킵니다.

    // 아이템 정보를 업데이트합니다.
    const updateItem = await prisma.items.update({
      where: { itemNo: +itemNo },
      data: {
        itemName,
        itemStat,
      },
    });

    // 업데이트된 아이템 정보를 반환합니다.
    return res.status(200).json({ data: updateItem });
  } catch (err) {
    next(err); // 에러가 발생하면 다음 미들웨어로 전달합니다.
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
  // URL에서 itemNo를 추출
  const { itemNo } = req.params;
  try {
    // 데이터베이스에서 itemNo에 해당하는 아이템을 찾습니다.
    const items = await prisma.items.findFirst({
      where: { itemNo: +itemNo },
    });
    // 아이템이 없으면 커스텀 에러를 발생시킵니다.
    if (!items) throw new CustomErr("등록된 아이템이 없습니다.", 404);

    // 아이템 데이터를 반환합니다.
    return res.status(200).json({ data: items });
  } catch (err) {
    // 에러가 발생하면 다음 미들웨어로 에러를 전달합니다.
    next(err);
  }
});

export default router;
