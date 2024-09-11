import { prisma } from "../utils/prisma/index.js";

export default async function (req, res, next) {
  try {
    const {
      user: { userNo },
      params: { characterNo },
    } = req;

    const character = await prisma.characters.findFirst({
      where: { characterNo: +characterNo },
    });
    if (!character)
      return res
        .status(404)
        .json({ errorMessage: "캐릭터가 정보가 존재하지 않습니다." });

    if (character.userNo !== userNo)
      return res.status(401).json({ errorMessage: "캐릭터 권한이 없습니다." });

    req.character = character;
    next();
  } catch (error) {
    return res.status(500).json({ message: "인증 간 서버 오류" });
  }
}
