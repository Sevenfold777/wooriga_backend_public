import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { httpReqLogger } from './logger.middleware';
import * as firebaseAdmin from 'firebase-admin';
import * as serviceAccount from '../wooriga-firebase-adminsdk.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // global Logger: show HTTP request
  app.use(httpReqLogger);

  // validation pipe for class validators
  // options: whitelist, forbidNonWhitelisted --> prod 전에 고려
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(
      <firebaseAdmin.ServiceAccount>serviceAccount,
    ),
  });

  await app.listen(process.env.PORT);
}
bootstrap();
