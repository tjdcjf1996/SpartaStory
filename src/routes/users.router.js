import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { SECRET_CODE } from "../config.js";
import CustomErr from "../utils/CustomErr.js";
import { Prisma } from "@prisma/client";

const router = express.Router();

// 회원가입 라우터
router.post("/sign-up", async (req, res, next) => {
  const {
    body: { userId, userPw, confirmPw, userName }, // body에서 필요한 데이터 추출
  } = req;
  const validUserId = /^[a-z0-9]+$/; // 유효한 아이디 형식 (소문자 + 숫자)

  try {
    // 데이터베이스에서 userId에 해당하는 사용자가 있는지 확인
    const isUser = await prisma.users.findFirst({
      where: { userId },
    });

    if (isUser) throw new CustomErr("이미 존재하는 아이디 입니다.", 409); // 중복 아이디 에러
    if (!validUserId.test(userId))
      throw new CustomErr("아이디는 소문자 + 숫자 형식만 가능합니다.", 400); // 유효하지 않은 아이디 형식 에러
    if (userPw.length < 6)
      throw new CustomErr("비밀번호는 최소 6자리 이상만 가능합니다.", 400); // 비밀번호 길이 에러
    if (userPw !== confirmPw)
      throw new CustomErr("비밀번호와 확인이 일치하지 않습니다.", 401); // 비밀번호 불일치 에러

    const hashedPw = await bcrypt.hash(userPw, 10); // 비밀번호 해시화

    // Database 변경 부분 트랜잭션
    const user = await prisma.$transaction(
      async (tx) => {
        const user = await tx.users.create({
          data: { userId, userPw: hashedPw, userName }, // 새로운 사용자 생성
        });
        return user;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      }
    );

    return res.status(201).json({
      data: {
        userNo: user.userNo, // 생성된 사용자 번호 반환
        userId: user.userId, // 생성된 사용자 아이디 반환
        userName: user.userName, // 생성된 사용자 이름 반환
      },
    });
  } catch (err) {
    next(err); // 에러 발생 시 다음 미들웨어로 전달
  }
});

// 로그인 라우터
router.post("/sign-in", async (req, res, next) => {
  const {
    body: { userId, userPw }, // Body에서 userId와 userPw 추출
  } = req;
  try {
    // 데이터베이스에서 userId에 해당하는 사용자가 있는지 확인
    const isUser = await prisma.users.findFirst({
      where: { userId },
    });
    if (!isUser) throw new CustomErr("없는 아이디 입니다.", 400); // 사용자가 없으면 에러 발생
    if (!(await bcrypt.compare(userPw, isUser.userPw)))
      throw new CustomErr("틀린 비밀번호 입니다.", 401); // 비밀번호가 틀리면 에러 발생
    const token = jwt.sign({ userId: userId }, SECRET_CODE); // JWT 토큰 생성
    res.setHeader("Authorization", `Bearer ${token}`); // 응답 헤더에 토큰 설정
    return res
      .status(200)
      .json({ message: "로그인 성공, 헤더에 토큰값이 반환되었습니다." }); // 성공 메시지 반환
  } catch (err) {
    next(err); // 에러 발생 시 다음 미들웨어로 전달
  }
});

export default router;
