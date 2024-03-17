import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './users/entities/user.entity';
import { UsersModule } from './users/users.module';
import { FamilyModule } from './family/family.module';
import { Family } from './family/entities/familiy.entity';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { Message } from './messages/entities/message.entity';
import { MessageFamily } from './messages/entities/message-family.entity';
import { MessageComment } from './messages/entities/message-comment.entity';
import { PhotosModule } from './photos/photos.module';
import { Photo } from './photos/entities/photo.entity';
import { PhotoComment } from './photos/entities/photo-comment.entity';
import { Theme } from './photos/entities/theme.entity';
import { MessageFamilyComment } from './messages/entities/message-family-comment.entity';
import { UploadsModule } from './uploads/uploads.module';
import { BoardsModule } from './boards/boards.module';
import { Board } from './boards/entities/board.entity';
import { PhotoFile } from './photos/entities/photoFile.entity';
import { EmotionsModule } from './emotions/emotions.module';
import { DailyEmotion } from './emotions/entities/emotion.entity';
import { MessageFamilyCommentLike } from './messages/entities/message-family-comment-like.entity';
import { MessageCommentLike } from './messages/entities/message-comment-like.entity';
import { PhotoCommentLike } from './photos/entities/photo-comment-like.entity';
import { MessageMetoo } from './messages/entities/message-metoo.entity';
import { MessageFamilyMetoo } from './messages/entities/message-family-metoo.entity';
import { PhotoLike } from './photos/entities/photo-like.entity';
import { MessageFamilyKeep } from './messages/entities/message-family-keep.entity';
import { FamilyPediaModule } from './family-pedia/family-pedia.module';
import { FamilyPedia } from './family-pedia/entities/family-pedia.entity';
import { FamilyPediaRow } from './family-pedia/entities/family-pedia-row.entity';
import { BalanceGameModule } from './balance-game/balance-game.module';
import { BalanceChoice } from './balance-game/entities/balance-choice.entity';
import { BalanceGame } from './balance-game/entities/balance-game.entity';
import { MessageKeep } from './messages/entities/message-keep.entity';
import { BalanceGameComment } from './balance-game/entities/balance-game-comment.entity';
import { BannersModule } from './banners/banners.module';
import { Banner } from './banners/entities/banner.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationModule } from './notification/notification.module';
import { Notification } from './notification/entities/notification.entity';
import { CommunityReportModule } from './community-report/community-report.module';
import { CommunityReport } from './community-report/entities/community-report.entity';
import { UserInquiryModule } from './user-inquiry/user-inquiry.module';
import { UserInquiry } from './user-inquiry/entities/user-inquiry.entity';
import { BalanceGameFamilyComment } from './balance-game/entities/balance-game-family-comment.entity';
import { UserAuth } from './users/entities/user-auth.entity';
import { BannerPayloadPlacement } from './banners/entities/banner-payload-placement.entity';
import { LetterModule } from './letter/letter.module';
import { Letter } from './letter/entities/letter.entity';
import { LetterTheme } from './letter/entities/letter-theme.entity';
import { LetterExample } from './letter/entities/letter-example.entity';
import { LetterHashtag } from './letter/entities/letter-hashtag.entity';
import { LetterKeep } from './letter/entities/letter-keep.entity';
import { AdminModule } from './admin/admin.module';
import { Admin } from './admin/entities/admin.entity';
import { DAU } from './admin/entities/dau.entity';
import { MAU } from './admin/entities/mau.entity';
import { LetterGuide } from './letter/entities/letter-guide.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        User,
        Family,
        Message,
        MessageFamily,
        MessageComment,
        MessageFamilyComment,
        Photo,
        PhotoFile,
        PhotoComment,
        Theme,
        Banner,
        BannerPayloadPlacement,
        Board,
        DailyEmotion,
        MessageCommentLike,
        MessageFamilyCommentLike,
        PhotoCommentLike,
        PhotoLike,
        MessageMetoo,
        MessageFamilyMetoo,
        MessageFamilyKeep,
        MessageKeep,
        FamilyPedia,
        FamilyPediaRow,
        BalanceGame,
        BalanceChoice,
        BalanceGameComment,
        BalanceGameFamilyComment,
        Notification,
        CommunityReport,
        UserInquiry,
        UserAuth,
        Letter,
        LetterTheme,
        LetterExample,
        LetterHashtag,
        LetterKeep,
        Admin,
        DAU,
        MAU,
        LetterGuide,
      ],
      synchronize: false,
      // synchronize: true,
      logging: false,
      timezone: '+09:00',
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    FamilyModule,
    AuthModule,
    MessagesModule,
    PhotosModule,
    UploadsModule,
    BoardsModule,
    EmotionsModule,
    FamilyPediaModule,
    BalanceGameModule,
    BannersModule,
    NotificationModule,
    CommunityReportModule,
    UserInquiryModule,
    LetterModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
