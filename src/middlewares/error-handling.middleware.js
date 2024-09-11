// src/middlewares/error-handling.middleware.js

export default function (err, req, res, next) {
  // statusCode 가 전달되지 않은 경우 지정 외 에러이므로 500 할당
  const statusCode = err.statusCode || 500;
  // 서버 에러 출력
  console.error(err);

  if (statusCode === 500)
    res.status(500).json({ errorMessage: "서버 내부 에러가 발생했습니다." });

  // 클라이언트에게 에러 메시지를 전달
  res.status(statusCode).json({
    errorMessage: err.message,
    statusCode: statusCode,
  });
}
