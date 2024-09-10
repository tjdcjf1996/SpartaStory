import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/shop/buy/:characterNo", async (req, res, next) => {
  const { characterNo } = req.params;
  const shoppingCart = req.body;

  const character = await prisma.characters.findFirst({
    where: { characterNo },
  });
  const inventory = await prisma.inventories.findFirst({
    where: { inventoryNo: characterNo },
  });

  for (const item of shoppingCart) {
    const { itemNo, count } = item;
    const itemInfo = await prisma.items.findFirst({
      where: itemNo,
    });
  }
});
