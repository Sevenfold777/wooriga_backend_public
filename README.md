# 🏠 우리가 Backend (Nest JS)

가족과 함께 하는 솔직한 이야기, 우리가의 백엔드 서버입니다. 서비스 업데이트가 많이 되어 deprecated features도 코드에 다수 포함되어 있습니다. 사용되지 않는 Entity 등은 아래 Entity 내용을 참고해주세요.

## 사용기술

- Typescript
- Nest JS
- Mysql
- TypeORM
- AWS
- Docker
- Firebase Admin SDK
- JWT Refresh Token Rotation
- 소셜로그인: Naver, Kakao, Apple

<br/>

## Architecture

![architecture](https://github.com/Sevenfold777/wooriga_backend_public/assets/88102203/98195faa-75b6-40f6-a1a5-a221185cd2a2)

<br/><br/>

## ERD

- 하단의 Relation이 별로 없는 Table은 어드민, 배너, 통계 등의 사유
- 사용하지 않는 Table은 제외함 (버전 업데이트로 사용하지 않는 테이블)

![wooriga erd](https://github.com/Sevenfold777/wooriga_backend_public/assets/88102203/3105bfdc-b327-400e-81d3-ba1198ad671c)

<br/><br/>

## Domains

- 처음 기획에서 변화 많았기에 deprecated된 기능 많음 (domain 내 세부 entity에 더 존재)

```
──src
   │
   │────admin
   │
   │────balance(deprecated)
   │
   │────boards(deprecated)
   │
   │────community-report
   │
   │────emotions
   │
   │────family
   │
   │────family-pedia
   │
   │────letter
   │
   │────messages
   │
   │────notification
   │
   │────photos
   │
   │────user-inquiry
   │
   └────users


```

## ENV

```
TZ
PORT
DB_HOST
DB_PORT
DB_USERNAME
DB_PASSWORD
DB_NAME
JWT_SECRET_KEY
CRYPTO_SALT
CRYPTO_KEY
CRYPTO_IV
AWS_ACCESS_KEY
AWS_SECRET_KEY
S3_BUCKET_NAME
DATAGOKR_KEY
```

<br /><br/>

## 인증

### 가입 회원 인증 정책

- react-native-seoul library 사용
- kakao access token을 앱에서 서버로 직접 전송 (https 적용, request body에 담아 전송)

![auth_1](https://github.com/Sevenfold777/wooriga_backend_public/assets/88102203/b900f6e5-43ae-4cee-8f91-8c042f143aa5)

<br /><br />

### 미가입자 인증 정책

- 가입 회원과 1~7 단계 동일, 소셜로그인을 통해 받은 사용자 정보가 DB에 존재하지 않으면 가입 절차 진행
- Response Body로 가입 필요(signUpRequired = true) 응답
- 회원가입 화면에서 이름 수정, 생일 확인, 약관 동의 후 가입 요청 (\*email 수정 불가)

![auth_2](https://github.com/Sevenfold777/wooriga_backend_public/assets/88102203/cc7934af-cdd6-4230-ae12-4720bf2590da)

<br/><br/>

### 토큰 재발급 정책

- 앱 단에서 access token expire 판단, refresh token을 body에 담아 재발급 요청
- 성공 시 token 발급, refresh token rotate (user_info db 저장)
- 실패 시 UNAUTHORIZED 401 응답, 앱에 토큰 삭제 요청

![auth_3](https://github.com/Sevenfold777/wooriga_backend_public/assets/88102203/8739bee3-5235-4a0a-924e-28fe89a0be84)
