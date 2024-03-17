import { BaseEntity } from 'src/common/entities/base.entity';
import { DailyEmotion } from 'src/emotions/entities/emotion.entity';
import { Family } from 'src/family/entities/familiy.entity';
import { MessageCommentLike } from 'src/messages/entities/message-comment-like.entity';
import { MessageFamilyMetoo } from 'src/messages/entities/message-family-metoo.entity';
import { MessageComment } from 'src/messages/entities/message-comment.entity';
import { MessageFamilyCommentLike } from 'src/messages/entities/message-family-comment-like.entity';
import { MessageFamilyComment } from 'src/messages/entities/message-family-comment.entity';
import { MessageMetoo } from 'src/messages/entities/message-metoo.entity';
import { PhotoCommentLike } from 'src/photos/entities/photo-comment-like.entity';
import { PhotoComment } from 'src/photos/entities/photo-comment.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { PhotoLike } from 'src/photos/entities/photo-like.entity';
import { Message } from 'src/messages/entities/message.entity';
import { MessageFamilyKeep } from 'src/messages/entities/message-family-keep.entity';
import { FamilyPedia } from 'src/family-pedia/entities/family-pedia.entity';
import { BalanceChoice } from 'src/balance-game/entities/balance-choice.entity';
import { MessageKeep } from 'src/messages/entities/message-keep.entity';
import { Notification } from 'src/notification/entities/notification.entity';
import { CommunityReport } from 'src/community-report/entities/community-report.entity';
import { UserInquiry } from 'src/user-inquiry/entities/user-inquiry.entity';
import { UserAuth } from './user-auth.entity';
import { Status } from 'src/common/entities/comment.entity';
import { BalanceGameFamilyComment } from 'src/balance-game/entities/balance-game-family-comment.entity';
import { BalanceGameComment } from 'src/balance-game/entities/balance-game-comment.entity';
import { MessageFamily } from 'src/messages/entities/message-family.entity';
import { Letter } from 'src/letter/entities/letter.entity';
import { LetterKeep } from 'src/letter/entities/letter-keep.entity';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  provider: AuthProvider;

  @Column()
  fcmToken: string;

  @Column()
  userName: string;

  @Column()
  position: FamilyPosition;

  @OneToOne(() => UserAuth, (auth) => auth.user)
  userAuth: UserAuth;

  // @Column({
  //   default:
  //     'https://k.kakaocdn.net/dn/dpk9l1/btqmGhA2lKL/Oz0wDuJn1YV2DIn92f6DVK/img_110x110.jpg',
  // }) // 추후 nullable --> default profile image link
  // profileImage: string;

  @Column({ default: Status.ACTIVE })
  status: Status;

  @Column({ nullable: true })
  birthday: Date;

  @Column({ default: false })
  isBirthLunar: boolean;

  @Column()
  mktPushAgreed: boolean;

  @ManyToOne(() => Family, (family) => family.users)
  family: Family;

  @OneToMany(() => Message, (message) => message.author)
  messagesSent: Message[];

  @OneToMany(() => MessageFamily, (message) => message.sender)
  messageFamSent: MessageFamily[];

  @OneToMany(() => Photo, (photo) => photo.author)
  photos: Photo[];

  @OneToMany(() => PhotoComment, (comment) => comment.author)
  photoComments: PhotoComment[];

  @OneToMany(() => MessageComment, (comment) => comment.author)
  messageComments: MessageComment[];

  @OneToMany(() => MessageFamilyComment, (comment) => comment.author)
  messageFamComments: MessageFamilyComment[];

  @OneToMany(() => DailyEmotion, (emotion) => emotion.user)
  dailyEmotions: DailyEmotion[];

  @OneToMany(() => MessageFamilyCommentLike, (like) => like.user)
  likeMessageFamComments: MessageFamilyCommentLike[];

  @OneToMany(() => MessageCommentLike, (like) => like.user)
  likeMessageComments: MessageCommentLike[];

  @OneToMany(() => PhotoCommentLike, (like) => like.user)
  likePhotoComments: PhotoCommentLike[];

  @OneToMany(() => PhotoLike, (like) => like.user)
  likePhotos: PhotoLike[];

  @OneToMany(() => MessageMetoo, (metoo) => metoo.user)
  messageMetoo: MessageMetoo[];

  @OneToMany(() => MessageFamilyMetoo, (metoo) => metoo.user)
  messageFamilyMetoo: MessageFamilyMetoo[];

  @OneToMany(() => MessageFamilyKeep, (keep) => keep.user)
  messageFamilyKeep: MessageFamilyKeep[];

  @OneToMany(() => MessageKeep, (keep) => keep.user)
  messageKeep: MessageKeep[];

  @OneToOne(() => FamilyPedia)
  familyPedia: FamilyPedia;

  @OneToMany(() => BalanceChoice, (choice) => choice.user)
  balanceChoices: BalanceChoice[];

  @OneToMany(() => Notification, (notification) => notification.receiver)
  receivedNotifications: Notification[];

  @OneToMany(() => Notification, (notification) => notification.sender)
  sentNotifications: Notification[];

  @OneToMany(() => CommunityReport, (report) => report.reporter)
  reports: CommunityReport[];

  @OneToMany(() => UserInquiry, (inquiry) => inquiry.author)
  inquiries: UserInquiry[];

  @OneToMany(() => BalanceGameFamilyComment, (comment) => comment.author)
  balanceGameFamilyComments: BalanceGameFamilyComment[];

  @OneToMany(() => BalanceGameComment, (comment) => comment.author)
  balanceGameComments: BalanceGameComment[];

  @OneToMany(() => Letter, (letter) => letter.sender)
  letterSent: Letter[];

  @OneToMany(() => Letter, (letter) => letter.receiver)
  letterReceived: Letter[];

  @OneToMany(() => LetterKeep, (keep) => keep.user)
  letterKeeps: LetterKeep[];
}

export enum FamilyPosition {
  GRANDPA = '할아버지',
  GRANMA = '할머니',
  DAD = '아빠',
  MOM = '엄마',
  SON = '아들',
  DAUGHTER = '딸',
}

export enum AuthProvider {
  KAKAO = 'kakao',
  NAVER = 'naver',
  APPLE = 'apple',
}
