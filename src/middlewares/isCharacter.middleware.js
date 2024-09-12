import { prisma } from "../utils/prisma/index.js";
import CustomErr from "../utils/CustomErr.js";

export default async function (req, _, next) {
  try {
    // 인증 미들웨어에서 생성한 user와 URL 매개변수에서 추출
    const {
      user: { userNo },
      params: { characterNo },
    } = req;

    const character = await prisma.characters.findFirst({
      where: { characterNo: +characterNo }, // characterNo 와 일치한 데이터 요청
    });
    if (!character)
      throw new CustomErr("캐릭터가 정보가 존재하지 않습니다.", 404); // 캐릭터 객체가 없을 시 에러
    if (character.userNo !== userNo)
      throw new CustomErr("캐릭터 접근 권한이 없습니다.", 401); // 캐릭터 소유권자와 토큰 인증자가 다를 시 에러
    req.character = character; // request에 캐릭터 객체 설정
    next();
  } catch (err) {
    next(err); // 에러 발생 시 다음 미들웨어로 전달
  }
}
