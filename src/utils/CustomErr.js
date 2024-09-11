export default class CustomErr extends Error {
  constructor(message, statusCode) {
    super(message); // Error 클래스의 message 속성 설정
    this.statusCode = statusCode; // 추가적인 statusCode 속성 설정
  }
}
