import { prisma } from "../utils/prisma/index.js";
import CustomErr from "../utils/CustomErr.js";

export default async function (req, _, next) {
  try {
    const {
      user: { userNo },
      params: { characterNo },
    } = req;

    const character = await prisma.characters.findFirst({
      where: { characterNo: +characterNo },
    });
    if (!character)
      throw new CustomErr("캐릭터가 정보가 존재하지 않습니다.", 404);
    if (character.userNo !== userNo)
      throw new CustomErr("캐릭터 접근 권한이 없습니다.", 401);
    req.character = character;
    next();
  } catch (err) {
    next(err);
  }
}
