import winston from "winston";

// winston 설정에서 로그 레벨을 error로 설정
const logger = winston.createLogger({
  level: "error", // error 로그만 출력
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      level: "error",
    }),
  ],
});

export default function (req, res, next) {
  const start = new Date().getTime();

  res.on("finish", () => {
    const duration = new Date().getTime() - start;
    if (res.statusCode >= 400) {
      // 오류 상태 코드일 경우 error 레벨로 로그
      logger.error(
        `Method: ${req.method}, URL: ${req.url}, Status: ${res.statusCode}, Duration: ${duration}ms`
      );
    }
  });
  next();
}
