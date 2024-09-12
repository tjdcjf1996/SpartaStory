import jwt from "jsonwebtoken";
import { prisma } from "../utils/prisma/index.js";
import { SECRET_CODE } from "../config.js";
import CustomErr from "../utils/CustomErr.js";

export default async function (req, res, next) {
  try {
    const { authorization } = req.headers; // 헤더에서 토큰 정보 추출

    if (!authorization)
      // 토큰이 없을 시 에러
      throw new CustomErr("요청한 사용자의 토큰이 없습니다.", 404);

    const [tokenType, token] = authorization.split(" "); // 토큰 형식과 데이터 분리
    if (tokenType !== "Bearer")
      // 베어러 타입이 아닐경우 에러
      throw new CustomErr("토큰 타입이 Bearer 형식이 아닙니다.", 400);

    const decodedToken = jwt.verify(token, SECRET_CODE); // 토큰 디코딩
    const userId = decodedToken.userId; // 디코딩한 토큰의 페이로드 내 유저ID 삽입

    const user = await prisma.users.findFirst({
      where: { userId: userId },
    });
    // 해당하는 유저가 없을 시 에러
    if (!user) throw new CustomErr("토큰 사용자가 존재하지 않습니다.", 404);

    req.user = user; // request에 user 객체 설정
    next(); // 다음 미들웨어로 전달
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
