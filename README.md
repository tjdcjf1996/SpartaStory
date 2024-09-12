# SpartaStory

스파르타코딩클럽 CH3 개인과제

## 폴더 구조
```
├─prisma
│  ├─migrations
│  │  ├─20240910082845_inven_equip
│  │  │  └─migration.sql
│  │  └─migration_lock.toml
│  └─schema.prisma
│
└─src
    ├─middlewares
    │  ├─auth.middleware.js
    │  ├─error-handling.middleware.js
    │  ├─isCharacter.middleware.js
    │  └─log.middleware.js
    │
    ├─routes
    │  ├─actions.router.js
    │  ├─characters.router.js
    │  ├─items.router.js
    │  ├─shop.router.js
    │  └─users.router.js
    │
    ├─utils
    │  ├─CustomErr.js
    │  └─prisma
    │      └─index.js
    │
    ├─app.js
    └─config.js

```
## 미들웨어 구현 리스트

- 토큰 인증 미들웨어
- 에러핸들링 미들웨어
- 에러로그 미들웨어 ( /utils/CustomErr 포함 )
- 캐릭터 소유권 검증 미들웨어

## API 기능 구현 리스트

- 회원가입 API
- 로그인 API
- 캐릭터 생성 API
- 캐릭터 삭제 API
- 캐릭터 상세조회 API
- 아이템 생성 API
- 아이템 수정 API
- 아이템 목록조회 API
- 아이템 상세조회 API
- 아이템 구입 API (JWT)
- 아이템 판매 API (JWT)
- 본인 캐릭터 인벤토리 조회 API (JWT)
- 캐릭터 장비창 조회 API
- 아이템 장착 API (JWT)
- 아이템 탈착 API (JWT)
- 돈벌기 API (JWT)

## API 명세서

### 1. 회원가입 API

#### 요구조건

1. 아이디, 비밀번호, 비밀번호 확인, 이름 데이터로 회원가입 요청
2. 보안을 위하여 비밀번호는 해싱처리
3. 아이디는 중복되지 않으며, 오로지 영어 소문자 + 숫자 조합으로 구성
4. 비밀번호는 최소 6자 이상이며, 비밀번호 확인과 일치
5. 실패 시 Status Code 및 메시지 반환
6. 성공 시 비밀번호를 제외한 사용자 정보 반환
7. 성공 시 Authorization Header에 토큰값 반환

#### 도메인

http://ddori.site/api/sign-up

#### 요청

```json
{
  "userId": "sparta",
  "userPw": "456123",
  "confirmPw": "456123",
  "userName": "스파르타"
}
```

#### 응답

- 성공 (201)

```json
{
  "data": {
    "userNo": "1",
    "userId": "sparta",
    "userName": "스파르타"
  },
  "Authorization": "Bearer <token>"
}
```

- 실패 (400)

```json
{
  "errorMessage": "아이디는 소문자+숫자 형식만 가능합니다.",
  "statusCode": 400
}
```

```json
{
  "errorMessage": "비밀번호는 최소 6자리 이상만 가능합니다.",
  "statusCode": 400
}
```

- 실패 (401)

```json
{
  "errorMessage": "비밀번호와 확인이 일치하지 않습니다.",
  "statusCode": 401
}
```

- 실패 (409)

```json
{
  "errorMessage": "이미 존재하는 아이디 입니다.",
  "statusCode": 409
}
```

### 2. 로그인 API

#### 요구조건

- 아이디, 비밀번호로 로그인 요청
- 계정정보 불일치 시 Status Code 및 메시지 반환(아이디 존재하지 않는 경우, 비밀번호 틀린 경우)
- 로그인 성공 시 액세스 토큰 반환( 페이로드에 계정 ID 삽입 )

#### 도메인

http://ddori.site/api/sign-in

#### 요청

```json
{
  "userId": "sparta",
  "userPw": "456123"
}
```

#### 응답

- 성공 (200)

```json
{
  "message": "로그인 성공, 헤더에 토큰값이 반환되었습니다."
}
```

- 실패 (400)

```json
{
  "errorMessage": "없는 아이디 입니다.",
  "statusCode": 400
}
```

- 실패 (401)

```json
{
  "errorMessage": "틀린 비밀번호 입니다.",
  "statusCode": 401
}
```

### 3. 캐릭터 생성 API (JWT 인증)

#### 요구조건

- 캐릭터 명 request 전달, 캐릭터 ID response 반환
- 캐릭터 스탯 ( health:500, power:100, money:10000 )

#### 도메인

http://ddori.site/api/character

#### 요청

```
Authorization: Bearer <your_token>
```

```json
{
  "characterName": "스빠아르타"
}
```

#### 응답

- 성공 (201)

```json
{
  "characterNo": "1"
}
```

- 실패 (409)

```json
{
  "errorMessage": "이미 있는 캐릭터명입니다.",
  "statusCode": 409
}
```

### 4. 캐릭터 삭제 API (JWT 인증)

#### 요구조건

- 삭제할 캐릭터 ID params로 전달
- 내 계정의 캐릭터가 아니면 삭제 불가

#### 도메인

http://ddori.site/api/character/delete/:characterNo

#### 요청

```
GET /characters/delete/:characterId
Authorization: Bearer <your_token>
```

#### 응답

- 성공 (200)

```json
{
  "data": {
    "deleteCharacter": {
      "characterNo": 1,
      "userNo": 1,
      "characterName": "스빠아르타",
      "health": 500,
      "power": 100,
      "money": 10000
    }
  }
}
```

- 실패 (401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패 (404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 404
}
```

### 5. 캐릭터 상세 조회 API

#### 요구조건

- 조회할 캐릭터 ID params로 전달
- 캐릭터 이름, HP, 힘 스탯 전달
- 내 캐릭터 조회시 게임머니까지 조회
- 다른 유저가 내 캐릭을 조회할 때와 내가 보유한 캐릭을 조회할 때가 달라야한다는 점.

#### 도메인

http://ddori.site/api/character/info/:characterNo

#### 요청

```
GET /characters/info/:characterId
Authorization: Bearer <your_token>
```

#### 응답

- 성공 (200)
  - 본인의 캐릭터일 때

```json
{
  "data": {
    "characterName": "스빠아르타",
    "money": "10000",
    "health": "500",
    "power": "100"
  }
}
```

- 본인의 캐릭터가 아닐 때

```json
{
  "data": {
    "characterName": "스빠아르타",
    "health": "500",
    "power": "100"
  }
}
```

- 실패 (404)

```json
{
  "errorMessage": "조회하려는 계정이 없습니다.",
  "statusCode": 404
}
```

### 6. 아이템 생성 API

#### 요구조건

- 아이템 코드, 아이템 명, 아이템 능력, 아이템 가격 request.body 전달
- 아이템 능력 JSON 포맷 전달

#### 도메인

http://ddori.site/api/item

#### 요청

```json
{
  "itemNo": 1,
  "itemName": "성공한 왕의검",
  "itemStat": {
    "power": 60,
    "health": 400
  },
  "itemPrice": 5000
}
```

#### 응답

- 성공 (201)

```json
{
  "data": {
    "itemNo": 1,
    "itemName": "성공한 왕의검",
    "itemStat": {
      "power": 60,
      "health": 400
    },
    "itemPrice": 5000
  }
}
```

- 실패 (409)

```json
{
  "errorMessage": "이미 있는 아이템 넘버입니다.",
  "statusCode": 409
}
```

### 7. 아이템 수정 API

#### 요구조건

- 아이템 코드 params 전달
- 아이템 명, 아이템 능력 request 전달

#### 도메인

http://ddori.site/api/updateItem/:itemNo

#### 요청

```
PATCH /updateItem/:itemNo
```

```json
{
  "itemName": "또리검",
  "itemStat": {
    "power": 500,
    "health": 500
  }
}
```

#### 응답

- 성공 (200)

```json
{
  "data": {
    "itemNo": 1,
    "itemName": "또리검",
    "itemStat": {
      "power": 500,
      "health": 500
    },
    "itemPrice": 5000
  }
}
```

- 실패 (404)

```json
{
  "errorMessage": "없는 아이템입니다.",
  "statusCode": 404
}
```

### 8. 아이템 목록 API

#### 요구조건

- 아이템 코드, 아이템 명, 아이템 가격 내용만 조회
- 아이템 생성 API를 통해 생성된 모든 아이템들이 목록으로 조회

#### 도메인

http://ddori.site/api/item

#### 요청

NULL

#### 응답

- 성공 (200)

```json
{
  "data": [
    {
      "itemNo": 1,
      "itemName": "또리검",
      "itemStat": {
        "power": 500,
        "health": 500
      },
      "itemPrice": 5000
    },
    {
      "itemNo": 2,
      "itemName": "성공한 왕의검",
      "itemStat": {
        "power": 6,
        "health": 40
      },
      "itemPrice": 1500
    },
    {
      "itemNo": 3,
      "itemName": "투구",
      "itemStat": {
        "health": 50
      },
      "itemPrice": 1500
    }
  ]
}
```

- 실패 (404)

```json
{
  "errorMessage": "등록된 아이템이 없습니다.",
  "statusCode": 404
}
```

### 9. 아이템 상세 조회 API

#### 요구조건

- 아이템 코드를 params 로 전달받아 아이템 코드, 아이템 명, 아이템 능력, 아이템 가격 조회

#### 도메인

http://ddori.site/api/item/:itemNo

#### 요청

```
GET /items/:itemNo
```

#### 응답

- 성공 (200)

```json
{
  "data": {
    "itemNo": 1,
    "itemName": "또리검",
    "itemStat": {
      "power": 500,
      "health": 500
    },
    "itemPrice": 5000
  }
}
```

- 실패 (404)

```json
{
  "errorMessage": "등록된 아이템이 없습니다.",
  "statusCode": 404
}
```

### 9. 아이템 구입 API (JWT)

#### 요구조건

1. 보유한 게임머니 한에서 구매 가능
2. 구입 후 보유머니 결제
3. 캐릭터 ID params 전달, 구입하고 싶은 아이템 코드 및 수량 request.body로 전달
4. 존재하지 않는 아이템은 살 수 없습니다.
5. 전체 가격이 내가 보유한 금액보다 작으면 구매할 수 없습니다.
6. 구입 성공 시 변경된 잔액을 반환합니다.
7. 구입된 아이템은 인벤토리에 기록되어야 합니다.

#### 도메인

http://ddori.site/api/shop/buy/:characterNo

#### 요청

```
POST /shop/buy/:characterId
Authorization: Bearer <your_token>
```

```json
[
  {
    "itemNo": 1,
    "count": 2
  },
  {
    "itemNo": 2,
    "count": 1
  }
]
```

#### 응답

- 성공(200)

```json
{
  "data": {
    "changedMoney": 1100,
    "changedInventory": {
      "1": 2,
      "2": 3
    }
  }
}
```

- 실패(400)

```json
{
  "errorMessage": "금액 부족. {character.money} 원 보유중",
  "statusCode": 400
}
```

- 실패(401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패(404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 404
}
```

```json
{
  "errorMessage": "아이템이 없습니다.",
  "statusCode": 404
}
```

- 실패(500)

```json
{
  "errorMessage": "서버 오류",
  "statusCode": 500
}
```

### 10. 아이템 판매 API (JWT)

#### 요구조건

1. 캐릭터 ID params 전달, 판매하고 싶은 아이템 코드 및 수량 request.body로 전달
2. 유저가 판매하고 싶은 아이템을 처분할 경우 구매가의 60%를 돌려받습니다.
3. 성공 시 변경된 잔액을 반환합니다.
4. 인벤토리에 있는 아이템만 팔 수 있습니다.
5. 장착중인 아이템은 판매할 수 없습니다.

#### 도메인

http://ddori.site/api/shop/sell/:characterNo

#### 요청

```
POST /shop/sell/:characterNo
Authorization: Bearer <your_token>
```

```json
[
  {
    "itemNo": 1,
    "count": 2
  }
]
```

#### 응답

- 성공(200)

```json
{
  "data": {
    "changedMoney": 2300,
    "changedInventory": {
      "2": 3
    }
  }
}
```

- 실패(400)

```json
{
  "errorMessage": "판매할 아이템보다 보유한 아이템이 적습니다.",
  "statusCode": 400
}
```

- 실패(401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패(404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 404
}
```

```json
{
  "errorMessage": "선택하신 아이템이 없습니다.",
  "statusCode": 404
}
```

- 실패(500)

```json
{
  "errorMessage": "서버 오류",
  "statusCode": 500
}
```

### 11. 본인 캐릭터 인벤토리 조회 API (JWT)

#### 요구조건

1. 인벤토리 목록을 조회할 내 캐릭터 ID params로 전달받음
2. 내 캐릭터만 조회 가능

#### 도메인

http://ddori.site/api/inventory/:characterNo

#### 요청

```
GET /inventory/:characterNo
Authorization: Bearer <your_token>
```

#### 응답

- 성공(200)

```json
{
  "data": {
    "1": 4,
    "2": 2
  }
}
```

- 실패(401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패(404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 404
}
```

- 실패(500)

```json
{
  "errorMessage": "서버 오류",
  "statusCode": 500
}
```

### 12. 캐릭터 장비창 조회 API

#### 요구조건

1. 장착된 아이템이 없으면 빈 배열로 반환됩니다.
2. 다른 유저도 볼 수 있기 때문에 인증은 거치지 않습니다.

#### 도메인

http://ddori.site/api/equip/:characterNo

#### 요청

```
GET /equip/:characterNo
```

#### 응답

- 성공(200)

```json
{
  "data": {
    "2": 1
  }
}
```

- 실패(404)

```json
{
  "errorMessage": "조회하려는 장비창이 없습니다.",
  "statusCode": 404
}
```

- 실패(500)

```json
{
  "errorMessage": "서버 오류",
  "statusCode": 500
}
```

### 13. 아이템 장착 API (JWT)

#### 요구조건

1. 아이템 장착할 내 캐릭터의 ID를 params로 전달받음
2. 장착할 아이템 코드를 request에서 전달 받음
3. 인벤토리에 존재하지 않는 아이템이라면 없는 아이템이라고 거부
4. 이미 장착한 아이템을 또 장착하려고 하면 이미 장착된 아이템이라고 거부
5. 아이템 장착 시 스탯을 변경
6. 캐릭터 조회 API 사용 시 변경된 스탯 확인
7. 장착된 아이템 정보는 인벤토리에서 삭제

#### 도메인

http://ddori.site/api/equipItem/:characterNo

#### 요청

```
POST /equipItem/:characterNo
Authorization: Bearer <your_token>
```

```
{
	"doEquipItem" : 1
}
```

#### 응답

- 성공(200)

```json
{
  "data": {
    "character_health": 560,
    "character_power": 109,
    "updatedInventory": {
      "1": 3,
      "2": 1
    },
    "updatedEquip": {
      "1": 1,
      "2": 1
    }
  }
}
```

- 실패(401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패(404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 404
}
```

```json
{
  "errorMessage": "보유하지 않은 아이템입니다.",
  "statusCode": 404
}
```

- 실패(409)

```json
{
  "errorMessage": "이미 장착하신 아이템입니다.",
  "statusCode": 409
}
```

- 실패(500)

```json
{
  "errorMessage": "서버 오류",
  "statusCode": 500
}
```

### 14. 아이템 탈착 API (JWT)

#### 요구조건

1. 아이템을 탈착할 내 캐릭터의 ID를 params로 전달 받음
2. 탈착할 아이템 코드 request로 전달 받기
3. 장착하지 않은 아이템 탈착 시도 시 거부
4. 아이템 탈착 성공 시 스탯 변경
5. 인벤토리에 탈착한 아이템 추가

#### 도메인

http://ddori.site/api/unequipItem/:characterNo

#### 요청

```
POST /unEquipItem/:characterNo
Authorization: Bearer <your_token>
```

```json
{
  "unEquipItem": 1
}
```

#### 응답

- 성공(200)

```json
{
  "data": {
    "character_health": 500,
    "character_power": 100,
    "updatedInventory": {
      "1": 4,
      "2": 1
    },
    "updatedEquip": {
      "2": 1
    }
  }
}
```

- 실패(401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패(404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 404
}
```

```json
{
  "errorMessage": "장착하지 않은 아이템입니다.",
  "statusCode": 404
}
```

- 실패(500)

```json
{
  "errorMessage": "서버 오류",
  "statusCode": 500
}
```

### 15. 돈벌기 API (JWT)

#### 요구조건

1. 캐릭터 ID를 params로 전달 받음
2. 캐릭터 잔액 100원씩 증가

#### 도메인

http://ddori.site/api/showMeTheMoney/:characterNo

#### 요청

```
GET /showMeTheMoney/:characterNo
Authorization: Bearer <your_token>
```

#### 응답

- 성공(200)

```json
{
  "message": "100원이 추가되어 잔액이 6200 원이 되었습니다."
}
```

- 실패(401)

```json
{
  "errorMessage": "캐릭터 접근 권한이 없습니다.",
  "statusCode": 401
}
```

- 실패(404)

```json
{
  "errorMessage": "캐릭터가 정보가 존재하지 않습니다.",
  "statusCode": 401
}
```
