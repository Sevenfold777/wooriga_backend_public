import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import {
  DailyEmotion,
  DailyEmotions,
} from 'src/emotions/entities/emotion.entity';
import { Letter } from 'src/letter/entities/letter.entity';
import { LetterTheme } from 'src/letter/entities/letter-theme.entity';
import { LetterHashtag } from 'src/letter/entities/letter-hashtag.entity';
import { LetterExample } from 'src/letter/entities/letter-example.entity';
import {
  CreateMessageInput,
  CreateMessageOutput,
} from 'src/messages/dtos/create-message.dto';
import { MessageFamilyComment } from 'src/messages/entities/message-family-comment.entity';
import { MessageFamilyMetoo } from 'src/messages/entities/message-family-metoo.entity';
import { MessageFamily } from 'src/messages/entities/message-family.entity';
import { Message, ServiceLinked } from 'src/messages/entities/message.entity';
import {
  Between,
  DataSource,
  LessThan,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { EditLetterThemeInput } from './dtos/edit-letter-theme.dto';
import { CreateLetterThemeOutput } from './dtos/create-letter-theme.dto';
import { CreateLetterHashTagInput } from './dtos/create-letter-hashtag.dto';
import { CreateMessageFamInput } from 'src/messages/dtos/create-message-family.dto';
import { Family } from 'src/family/entities/familiy.entity';
import { NotificationService } from 'src/notification/notification.service';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { Cron } from '@nestjs/schedule';
import { Photo } from 'src/photos/entities/photo.entity';
import { PhotoComment } from 'src/photos/entities/photo-comment.entity';
import { PhotoLike } from 'src/photos/entities/photo-like.entity';
import { User } from 'src/users/entities/user.entity';
import { UserAuth } from 'src/users/entities/user-auth.entity';
import { Status } from 'src/common/entities/comment.entity';
import { FamilyPedia } from 'src/family-pedia/entities/family-pedia.entity';
import { EditMessageInput } from 'src/messages/dtos/edit-message.dto';
import { DAU } from './entities/dau.entity';
import { MAU } from './entities/mau.entity';
import axios from 'axios';
import { LetterGuide } from 'src/letter/entities/letter-guide.entity';
import { CreateLetterGuideInput } from './dtos/create-letter-guide.dto';
import { EditLetterGuideInput } from './dtos/edit-letter-guide.dto';

@Injectable()
export class AdminServiceMessage {
  constructor(
    @InjectRepository(Message) private messageRepository: Repository<Message>,
    @InjectRepository(MessageFamily)
    private messageFamRepository: Repository<MessageFamily>,
    @InjectRepository(MessageFamilyComment)
    private commentRepository: Repository<MessageFamilyComment>,
    @InjectRepository(MessageFamilyMetoo)
    private metooRepository: Repository<MessageFamilyMetoo>,
    @InjectRepository(Family) private familyRepository: Repository<Family>,
    private readonly notificationService: NotificationService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  getAllFamiliesCnt(): Promise<number> {
    return this.familyRepository.count();
  }

  // 오늘의 전체 댓글량
  getTodayCommentsCnt(): Promise<number> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.commentRepository.count({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });
  }

  async getCommentedUserFamCnt(): Promise<{
    userCnt: number;
    familyCnt: number;
    familyNotAdmin: number;
  }> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    const allComments = await this.commentRepository.find({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
      relations: { author: { family: true } },
    });

    let userCnt = 0;
    let familyCnt = 0;
    let notAdminCnt = 0;
    const users = [];
    const families = [];

    allComments.forEach((comment) => {
      if (!users.includes(comment.author.id)) {
        userCnt++;
        users.push(comment.author.id);
      }

      if (!families.includes(comment.author.family.id)) {
        familyCnt++;
        families.push(comment.author.family.id);
      }
    });

    families.forEach((family) => {
      if ([3, 8, 12, 23, 27].includes(family)) return;
      notAdminCnt++;
    });

    return { userCnt, familyCnt: familyCnt, familyNotAdmin: notAdminCnt };
  }

  // 오늘의 전체 좋아요
  getTodayMetoos(): Promise<number> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.metooRepository.count({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });
  }

  // 3일간 발송 예정 이야기들
  async findMessagesNearArrive(): Promise<Message[]> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    const threeDaysLater = new Date(todayBegin);
    threeDaysLater.setDate(threeDaysLater.getDate() + 4); // 오늘, 내일, 모레, 글피 까지

    return this.messageRepository.find({
      where: { uploadAt: Between(todayBegin, threeDaysLater) },
      relations: { messageFamily: true },
    });
  }

  // 개별 이야기
  async findMessage(
    id: number,
    isSent: boolean,
  ): Promise<{
    id: number;
    payload: string;
    emotion: DailyEmotions;
    uploadAt: Date;
    messageFamCount?: number;
    commentedUsersCount?: number;
    commentsCount?: number;
    metoosCount?: number;
    linkTo: ServiceLinked;
  }> {
    if (isSent) {
      const result = await this.dataSource.query(`
      SELECT M.id, M.payload, M.emotion, M.uploadAt, SUM(MSTAT.commentsCnt) as commentsCnt, SUM(MSTAT.metoosCnt) as metoosCnt, 
      COUNT(MSTAT.id) as messageFamCnt, SUM(MSTAT.commentedUsersCnt) as commentedUsersCnt, M.linkTo
      FROM (SELECT * FROM message WHERE id = ${id}) as M
      INNER JOIN (
        SELECT MF.messageId, MF.id, IFNULL(commentsCnt, 0) as commentsCnt, IFNULL(metoosCnt, 0) as metoosCnt, IFNULL(commentedUsersCnt, 0) as commentedUsersCnt
        FROM (SELECT * FROM message_family WHERE messageId = ${id}) as MF
        LEFT OUTER JOIN (SELECT messageId, COUNT(id) as commentsCnt, COUNT(DISTINCT authorId) as commentedUsersCnt
        FROM message_family_comment 
        GROUP BY messageId) as comments on comments.messageId = MF.id
        LEFT OUTER JOIN (SELECT messageId, COUNT(id) as metoosCnt
        FROM message_family_metoo
        GROUP BY messageId) as metoos on metoos.messageId = MF.id
        ) as MSTAT on MSTAT.messageId = M.id
        GROUP BY M.id;
        `);

      const mStat = result[0];

      return {
        id: mStat.id,
        payload: mStat.payload,
        emotion: mStat.emotion,
        uploadAt: new Date(mStat.uploadAt),
        messageFamCount: parseInt(mStat.messageFamCnt),
        commentedUsersCount: parseInt(mStat.commentedUsersCnt),
        commentsCount: parseInt(mStat.commentsCnt),
        metoosCount: parseInt(mStat.metoosCnt),
        linkTo: mStat.linkTo,
      };
    } else {
      const message = await this.messageRepository.findOne({ where: { id } });

      return message;
    }
  }

  // 전체 이야기 목록
  async findMessages(prev: number): Promise<
    {
      id: number;
      payload: string;
      emotion: DailyEmotions;
      uploadAt: Date;
      createdAt: Date;
      messageFamCount: number;
      linkTo: ServiceLinked;
    }[]
  > {
    const take = 20;

    const messages = await this.messageRepository.find({
      relations: {
        // metoos: true,
        // comments: true,
        messageFamily: { sender: true },
      },
      order: { uploadAt: 'DESC' },
      take: take,
      skip: prev * take,
    });

    return messages.map((message) => {
      return {
        id: message.id,
        payload: message.payload,
        emotion: message.emotion,
        uploadAt: message.uploadAt,
        createdAt: message.createdAt,
        messageFamCount: message.messageFamily.length,
        linkTo: message.linkTo,
      };
    });
  }

  // 이야기 등록
  async createMessage({
    payload,
    emotion,
    uploadAt,
    linkTo,
  }: CreateMessageInput): Promise<CreateMessageOutput> {
    const message = this.messageRepository.create({
      emotion,
      payload,
      author: { id: 4 }, // admin
      uploadAt,
      linkTo,
    });

    try {
      await this.messageRepository.save(message);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true, id: message.id };
  }

  // 이야기 수정
  async editMessage(
    id: number,
    { payload, emotion, uploadAt, linkTo }: EditMessageInput,
  ): Promise<BaseOutput> {
    const result = await this.messageRepository.update(
      { id },
      { payload, emotion, uploadAt, linkTo },
    );

    if (result.affected === 0) {
      return {
        ok: false,
        error: "Couldn't update example",
      };
    }

    return { ok: true };
  }

  // 이야기 삭제: 한 가족에게라도 공개되지 않은 경우 (messagaeFam, receiveDate)
  async deleteMessage(id: number): Promise<BaseOutput> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: { messageFamily: true },
    });

    if (
      message.messageFamily?.filter(
        (message) => message.receiveDate <= new Date(),
      ).length > 0
    ) {
      return { ok: false, error: 'Already sent to some families.' };
    }

    const result = await this.messageRepository.delete({ id });

    if (result.affected === 0) {
      return { ok: false, error: 'Message not found.' };
    }

    return { ok: true };
  }

  // 사용자에게 발송
  async sendMessagToFam({
    messageId,
    receiveDate,
  }: CreateMessageFamInput): Promise<BaseOutput> {
    // const allFamilies = await this.familyRepository.find({
    //   select: ['id', 'users'],
    //   // where: [{ id: 8 }, { id: 3 }], // 나중에는 풀어야
    //   relations: { users: true },
    // });

    const now = new Date();

    // 생일 등의 사유로 미리 이야기 받은 가족 제외 (하루에 이야기 1개만 받도록)
    const targetUsers: {
      familyId: number;
      fcmToken: string;
      messageCnt: number;
    }[] = await this.dataSource.query(`
          SELECT F.id as familyId, user.fcmToken, messageCnt
          FROM (SELECT family.id, COUNT(MF.id) as messageCnt 
              FROM family
                LEFT OUTER JOIN (SELECT * FROM message_family
                      WHERE DATE(message_family.receiveDate) = '${now.getFullYear()}-${
      now.getMonth() + 1
    }-${now.getDate()}') as MF
                                on MF.familyId = family.id
                GROUP BY family.id) as F
          LEFT OUTER JOIN user on F.id = user.familyId
          WHERE messageCnt = 0;    
    `);

    const families: number[] = [];

    targetUsers.forEach((user) => {
      if (families.includes(user.familyId)) return;
      families.push(user.familyId);
    });

    const messageFams: MessageFamily[] = [];

    for (const familyId of families) {
      const temp = this.messageFamRepository.create({
        receiveDate,
        message: { id: messageId },
        family: { id: familyId },
        sender: { id: 4 },
      });

      messageFams.push(temp);
    }

    // console.log(messageFams, messageFams.length);
    // return;

    await this.messageFamRepository.insert(messageFams);

    const fcmTokens = targetUsers.map((user) => user.fcmToken);

    console.log(fcmTokens.length, receiveDate);

    for (let index = 0; index < Math.ceil(fcmTokens.length / 500); index++) {
      this.notificationService.sendNotification({
        tokens: fcmTokens.slice(500 * index, 500 * (index + 1)),
        title: '우리가 이야기',
        body: '오늘의 이야기가 도착했습니다!',
        screen: ROUTE_NAME.MESSAGE_HOME,
        save: false, // db에 저장하지 않음
      });
    }

    return { ok: true };
  }

  // 알림 보내줘야할 타임캡슐이 있는지 확인

  @Cron('0 0 12 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async messageSend(): Promise<void> {
    const now = new Date();

    const queryString = `
                SELECT * FROM message
                where authorId = '${4}'
                and year(uploadAt) = '${now.getFullYear()}'
                and month(uploadAt) = '${now.getMonth() + 1}'
                and day(uploadAt) = '${now.getDate()}';`;

    const messageToSend: Message = (
      await this.dataSource.query(queryString)
    )[0];

    await this.sendMessagToFam({
      messageId: messageToSend.id,
      receiveDate: new Date(),
    });
  }

  @Cron('0 0 8 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async sendBirthMessage(): Promise<void> {
    const todaySolar = new Date(new Date().toLocaleDateString('ko-KR')); // 양력 오늘
    const todayLunar = await solarToLunar({
      solYear: String(todaySolar.getFullYear()),
      solMonth: String(todaySolar.getMonth() + 1).padStart(2, '0'),
      solDay: String(todaySolar.getDate()).padStart(2, '0'),
    }); // 음력 오늘 한국천문연구원_음양력 정보 활용 (data.go.kr)

    const queryString = `
    SELECT user.id, user.familyId, birthUser.id as birthUserId, user.fcmToken
    FROM (SELECT id, userName, familyId
          FROM user
          WHERE (isBirthLunar = 0 and month(birthday) = '${
            todaySolar.getMonth() + 1
          }' and day(birthday) = '${todaySolar.getDate()}')
          ${
            todayLunar
              ? `OR (isBirthLunar = 1 and month(birthday) = '${
                  todayLunar.getMonth() + 1
                }' and day(birthday) = '${todayLunar.getDate()}')`
              : ''
          }) as birthUser
    INNER JOIN user on user.familyId = birthUser.familyId;
  `;

    // 1. birthUsers.familyId => messageFam; 미리 작성해둔 생일 이야기 중 보내지도록 ==> message service로 넘겨야?
    const targetUsers: {
      id: number;
      familyId: number;
      fcmToken: string;
      birthUserId: number;
    }[] = await this.dataSource.query(queryString);

    const families: {
      familyId: number;
      memberIds: number[];
      birthUserId?: number;
    }[] = [];

    targetUsers.forEach((user) => {
      // 생일자 flag
      let isBirth = false;
      if (user.id === user.birthUserId) {
        isBirth = true;
      }

      // 존재 체크
      const existingFamIdx = families.findIndex(
        (family) => family.familyId === user.familyId,
      );

      // 아마 존재할 경우
      if (existingFamIdx !== -1) {
        families[existingFamIdx].memberIds.push(user.id);

        if (isBirth) {
          families[existingFamIdx].birthUserId = user.id;
        }
      }
      // 존재하지 않을 경우
      else {
        families.push({
          familyId: user.familyId,
          memberIds: [user.id],
          birthUserId: isBirth ? user.birthUserId : -1,
        });
      }
    });

    // console.log(families); // debug

    const messageFams: MessageFamily[] = [];

    for (const family of families) {
      const temp = this.messageFamRepository.create({
        receiveDate: new Date(),
        message: {
          id:
            301 +
            (family.memberIds.findIndex(
              (userId) => userId === family.birthUserId,
            ) %
              4),
        }, // messageId: 301 ~ 304가 생일
        family: { id: family.familyId },
        sender: { id: 4 },
      });

      messageFams.push(temp);
    }

    await this.messageFamRepository.insert(messageFams);

    // 2. birthday families' users fcm => notify
    const fcmTokens = targetUsers.map((user) => user.fcmToken);

    console.log(fcmTokens.length, new Date());

    for (let index = 0; index < Math.ceil(fcmTokens.length / 500); index++) {
      this.notificationService.sendNotification({
        tokens: fcmTokens.slice(500 * index, 500 * (index + 1)),
        title: '우리가 이야기',
        body: '오늘의 이야기가 도착했습니다!',
        screen: ROUTE_NAME.MESSAGE_HOME,
        save: false, // db에 저장하지 않음
      });
    }
  }
}

@Injectable()
export class AdminServiceLetter {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Letter) private letterRepository: Repository<Letter>,
    @InjectRepository(LetterGuide)
    private letterGuideRepository: Repository<LetterGuide>,
    @InjectRepository(LetterTheme)
    private themeRepository: Repository<LetterTheme>,
    @InjectRepository(LetterHashtag)
    private hashtagRepository: Repository<LetterHashtag>,
    @InjectRepository(LetterExample)
    private exampleRepository: Repository<LetterExample>,
    private readonly notificationService: NotificationService,
  ) {}

  async getTodaySent(): Promise<{ all: number; timeCapsules: number }> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    const sentToday = await this.letterRepository.findAndCount({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });

    return {
      all: sentToday[1],
      timeCapsules: sentToday[0].filter((letter) => letter.isTimeCapsule)
        .length,
    };
  }

  async findLetterThemes(prev: number): Promise<
    {
      id: number;
      title: string;
      hashtags: LetterHashtag[];
      sentAmount: number;
    }[]
  > {
    const take = 20;

    const themes = await this.themeRepository.find({
      relations: { letters: true, hashtags: true },
      order: { updatedAt: 'desc' },
      take,
      skip: take * prev,
    });

    return themes.map((theme) => {
      return {
        id: theme.id,
        title: theme.title,
        hashtags: theme.hashtags,
        sentAmount: theme.letters.length,
      };
    });
  }

  findLetterTheme(id: number): Promise<LetterTheme> {
    return this.themeRepository.findOne({
      where: { id },
      relations: { examples: true, hashtags: true },
    });
  }

  async deleteLetterTheme(id: number): Promise<BaseOutput> {
    const result = await this.themeRepository.delete({ id });

    if (result.affected === 0) {
      return { ok: false, error: 'Theme not found.' };
    }

    return { ok: true };
  }

  async editLetterTheme(
    id: number,
    { title, payload, recommendText, example, hashtags }: EditLetterThemeInput,
  ): Promise<BaseOutput> {
    // const targetTheme = await this.themeRepository.findOne({ where: { id } });
    // const newTheme = { ...targetTheme, hashtags };

    // 1. update theme entity
    const newTheme = this.themeRepository.create({
      id,
      ...(title && { title }),
      ...(payload && { payload }),
      ...(recommendText && { recommendText }),
      ...(hashtags && { hashtags }),
    });

    const result = await this.themeRepository.save(newTheme);

    // const result = await this.themeRepository.update(
    //   { id },
    //   {
    //     ...(title && { title }),
    //     ...(payload && { payload }),
    //     ...(recommendText && { recommendText }),
    //     ...(hashtags && { hashtags }),
    //   },
    // );

    // if (result.affected === 0 && (title || payload || recommendText)) {
    //   return {
    //     ok: false,
    //     error: "Couldn't update the theme.",
    //     // error: "Couldn't update title / payload / recommendText",
    //   };
    // }

    // 2. update example
    const resultEx = await this.exampleRepository.update(
      { theme: { id } },
      { ...(example && { payload: example }) },
    );

    if (resultEx.affected === 0 || example) {
      return {
        ok: false,
        error: "Couldn't update example",
      };
    }

    return { ok: true };
  }

  async createLetterTheme({
    title,
    payload,
    recommendText,
    example,
    hashtags,
  }: EditLetterThemeInput): Promise<CreateLetterThemeOutput> {
    let theme: LetterTheme;
    try {
      // 1. create Theme
      const newTheme = this.themeRepository.create({
        title,
        payload,
        recommendText,
        hashtags,
      });

      theme = await this.themeRepository.save(newTheme);

      // 2. create example
      const newEx = this.exampleRepository.create({
        payload: example,
        theme: { id: theme.id },
      });

      await this.exampleRepository.save(newEx);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true, id: theme.id };
  }

  findAllHashTags(): Promise<LetterHashtag[]> {
    return this.hashtagRepository.find({ order: { createdAt: 'DESC' } });
  }

  async createHashTag({ name }: CreateLetterHashTagInput): Promise<BaseOutput> {
    try {
      // 1. create Theme
      const newHashTag = this.hashtagRepository.create({
        name,
      });

      await this.hashtagRepository.save(newHashTag);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true };
  }

  async deleteHashTag({ name }: CreateLetterHashTagInput): Promise<BaseOutput> {
    const hashTag = await this.hashtagRepository.findOne({
      where: { name },
      relations: { themes: true },
    });

    if (hashTag.themes.length > 0) {
      return { ok: false, error: 'The hashtag is already in use.' };
    }

    const result = await this.hashtagRepository.delete({ name });

    if (result.affected === 0) {
      return { ok: false, error: 'HashTag not found.' };
    }

    return { ok: true };
  }

  async sendThemeRecommendNotif(themeId: number): Promise<BaseOutput> {
    const theme = await this.themeRepository.findOne({
      where: { id: themeId },
    });

    const allUsers = await this.userRepository.find({
      select: ['id', 'fcmToken'],
      where: { mktPushAgreed: true },
    });

    const fcmTokens = allUsers.map((user) => user.fcmToken);
    console.log(fcmTokens.length, theme.id);

    // return { ok: false, error: 'temp' };

    for (let index = 0; index < Math.ceil(fcmTokens.length / 500); index++) {
      this.notificationService.sendNotification({
        tokens: fcmTokens.slice(500 * index, 500 * (index + 1)),
        title: '우리가 편지',
        body: theme.recommendText,
        screen: ROUTE_NAME.LETTER_THEME_DETAIL,
        param: { themeId },
        save: false, // db에 저장하지 않음
      });
    }

    return { ok: true };
  }

  async getLetterGuide(id: number): Promise<LetterGuide> {
    return this.letterGuideRepository.findOne({ where: { id } });
  }

  async getLetterGuideList(): Promise<LetterGuide[]> {
    // 현재 pagination은 없음
    return this.letterGuideRepository.find({
      order: { updatedAt: 'desc', id: 'desc' },
    });
  }

  async postLetterGuide(
    createGuideInput: CreateLetterGuideInput,
  ): Promise<BaseOutput> {
    try {
      const newGuide = this.letterGuideRepository.create(createGuideInput);

      await this.letterGuideRepository.save(newGuide);

      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Entity creation error ocurred.' };
    }
  }

  async editLetterGuide(
    id: number,
    editGuideInput: EditLetterGuideInput,
  ): Promise<BaseOutput> {
    try {
      const result = await this.letterGuideRepository.update(
        { id },
        editGuideInput,
      );

      if (result.affected === 0) {
        return { ok: false, error: 'Cannot update record' };
      }

      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Cannot update the record.' };
    }
  }

  async deleteLetterGuide(id: number): Promise<BaseOutput> {
    try {
      const result = await this.letterGuideRepository.delete({ id });

      if (result.affected === 0) {
        return { ok: false, error: 'Cannot delete record' };
      }

      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Cannot delete the record.' };
    }
  }
}

@Injectable()
export class AdminServicePhoto {
  constructor(
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(PhotoComment)
    private commentRepository: Repository<PhotoComment>,
    @InjectRepository(PhotoLike)
    private likeRepository: Repository<PhotoLike>,
  ) {}

  getPhotosCnt(): Promise<number> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.photoRepository.count({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });
  }

  // 오늘의 전체 댓글량
  getTodayCommentsCnt(): Promise<number> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.commentRepository.count({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });
  }

  // 오늘의 전체 좋아요
  getTodayLikes(): Promise<number> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.likeRepository.count({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });
  }
}

@Injectable()
export class AdminServiceUser {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserAuth)
    private userAuthRepository: Repository<UserAuth>,
    @InjectRepository(Family)
    private familyiRepository: Repository<Family>,
    @InjectRepository(FamilyPedia)
    private pediaRepository: Repository<FamilyPedia>,
    @InjectRepository(DailyEmotion)
    private emoRepository: Repository<DailyEmotion>,
    @InjectRepository(DAU)
    private dauRepository: Repository<DAU>,
    @InjectRepository(MAU)
    private mauRepository: Repository<MAU>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  getFamilyCnt(): Promise<number> {
    return this.familyiRepository.count();
  }

  getUserCnt(): Promise<number> {
    return this.userRepository.count({ where: { status: Status.ACTIVE } });
  }

  async getAU(): Promise<{ dau: number; mau: number }> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    const monthBegin = new Date(todayBegin);
    monthBegin.setMonth(monthBegin.getMonth() - 1);

    const dau = await this.userAuthRepository.count({
      where: { updatedAt: MoreThanOrEqual(todayBegin) },
    });
    const mau = await this.userAuthRepository.count({
      where: { updatedAt: MoreThanOrEqual(monthBegin) },
    });

    return { dau, mau };
  }

  getFamilyWithUser(prev: number): Promise<Family[]> {
    const take = 20;

    return this.familyiRepository.find({
      select: { id: true, users: { id: true }, createdAt: true },
      relations: { users: true },
      order: { id: 'desc' },
      take,
      skip: prev * take,
    });
  }

  async getUserStat(prev: number): Promise<
    {
      id: number;
      createdAt: Date;
      lastLogin: Date;
      messageCommentCnt: number;
      letterSentCnt: number;
      photoUploadCnt: number;
      photoCommentCnt: number;
      dailyEmotionCnt: number;
    }[]
  > {
    const take = 20;

    console.time();
    // 최적화 필요
    const result = await this.dataSource.query(`
        SELECT user.id, user.createdAt, user_auth.updatedAt as lastLogin, IFNULL(commentsCnt, 0) as messageCommentCnt, 
		        IFNULL(letterSent, 0) as letterSentCnt, IFNULL(photos, 0) as photoUploadCnt,  
                IFNULL(photoCommentCnt, 0) as photoCommentCnt, IFNULL(emoCnt, 0) as dailyEmotionCnt
        FROM user
        INNER JOIN user_auth on user.id = user_auth.userId
        LEFT OUTER JOIN (SELECT mf.authorId, COUNT(mf.id) as commentsCnt
				        FROM message_family_comment as mf
                        GROUP BY mf.authorId) as msgComments on msgComments.authorId = user.id
        LEFT OUTER JOIN (SELECT letter.senderId, COUNT(letter.id) as letterSent
				        FROM letter
                        GROUP BY letter.senderId) as letters on letters.senderId = user.id
        LEFT OUTER JOIN (SELECT photo.authorId, COUNT(photo.id) as photos
				        FROM photo
                        GROUP BY photo.authorId) as photo on photo.authorId = user.id
        LEFT OUTER JOIN (SELECT photo_comment.authorId, COUNT(photo_comment.id) as photoCommentCnt
				        FROM photo_comment
                        GROUP BY photo_comment.authorId) as phComments on phComments.authorId = user.id
        LEFT OUTER JOIN (SELECT e.userId, COUNT(e.id) as emoCnt
				        FROM daily_emotion as e
                        GROUP BY e.userId) as emos on emos.userId = user.id
        ORDER BY user.id DESC
        LIMIT ${take}
        OFFSET ${take * prev};
    `);

    console.timeEnd();

    return result;
  }

  getPediaEditted(): Promise<number> {
    const defaultProfile =
      'https://wooriga-prod.s3.ap-northeast-2.amazonaws.com/familyPedia/default.jpeg';

    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.pediaRepository.count({
      where: [
        {
          updatedAt: MoreThanOrEqual(todayBegin),
          profilePhoto: Not(defaultProfile),
        },
        {
          rows: { updatedAt: MoreThanOrEqual(todayBegin), payload: Not('') },
        },
      ],
      relations: { rows: true },
    });
  }

  getEmoSelected(): Promise<number> {
    const todayBegin = new Date();
    todayBegin.setHours(0);
    todayBegin.setMinutes(0);
    todayBegin.setSeconds(0);
    todayBegin.setMilliseconds(0);

    return this.emoRepository.count({
      where: { createdAt: MoreThanOrEqual(todayBegin) },
    });
  }

  getDAU(prev: number): Promise<DAU[]> {
    const take = 20;

    return this.dauRepository.find({
      order: { date: 'DESC' },
      take,
      skip: take * prev,
    });
  }

  getMAU(prev: number): Promise<MAU[]> {
    const take = 20;

    return this.mauRepository.find({
      order: { date: 'DESC' },
      take,
      skip: take * prev,
    });
  }

  @Cron('0 59 23 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async recordStat(): Promise<void> {
    try {
      const today = new Date(new Date().toLocaleDateString('ko-KR'));

      const todayResult = await this.getAU();

      const dau = this.dauRepository.create({
        date: today,
        count: todayResult.dau,
      });

      await this.dauRepository.save(dau);

      if (today.getDate() === 1) {
        const mau = this.dauRepository.create({
          date: today,
          count: todayResult.mau,
        });

        await this.mauRepository.save(mau);
      }
    } catch (e) {
      console.log(e);
    }
  }

  @Cron('0 0 20 * * *', {
    timeZone: 'Asia/Seoul',
  })
  async notifyBirthday(): Promise<void> {
    const todaySolar = new Date(new Date().toLocaleDateString('ko-KR')); // 양력 오늘

    const tomorrowSolar = new Date(todaySolar.getTime() + 1000 * 60 * 60 * 24);
    const threeDaysLaterSolar = new Date(
      todaySolar.getTime() + 1000 * 60 * 60 * 24 * 3,
    );

    const tomorrowLunarPromise = solarToLunar({
      solYear: String(tomorrowSolar.getFullYear()),
      solMonth: String(tomorrowSolar.getMonth() + 1).padStart(2, '0'),
      solDay: String(tomorrowSolar.getDate()).padStart(2, '0'),
    }); // 음력 오늘 한국천문연구원_음양력 정보 활용 (data.go.kr)

    const threeDaysLaterLunarPromise = solarToLunar({
      solYear: String(threeDaysLaterSolar.getFullYear()),
      solMonth: String(threeDaysLaterSolar.getMonth() + 1).padStart(2, '0'),
      solDay: String(threeDaysLaterSolar.getDate()).padStart(2, '0'),
    }); // 음력 오늘 한국천문연구원_음양력 정보 활용 (data.go.kr)

    // 이 둘의 순서는 상관 없어서 all
    const [tomorrowLunar, threeDaysLaterLunar] = await Promise.all([
      tomorrowLunarPromise,
      threeDaysLaterLunarPromise,
    ]);

    const queryString = `
      SELECT user.id, user.userName, user.familyId, user.fcmToken, birthUser.id as birthUserId, birthUser.userName as birthUserName, birthUser.birthday
      FROM (SELECT id, userName, familyId, birthday
            FROM user
            WHERE (isBirthLunar = 0 and month(birthday) = '${
              tomorrowSolar.getMonth() + 1
            }' and day(birthday) = '${tomorrowSolar.getDate()}')
            OR (isBirthLunar = 0 and month(birthday) = '${
              threeDaysLaterSolar.getMonth() + 1
            }' and day(birthday) = '${threeDaysLaterSolar.getDate()}')
            ${
              tomorrowLunar
                ? `OR (isBirthLunar = 1 and month(birthday) = '${
                    tomorrowLunar.getMonth() + 1
                  }' and day(birthday) = '${tomorrowLunar.getDate()}')
                  OR (isBirthLunar = 1 and month(birthday) = '${
                    threeDaysLaterLunar.getMonth() + 1
                  }' and day(birthday) = '${threeDaysLaterLunar.getDate()}')`
                : ''
            }) as birthUser
      INNER JOIN user on user.familyId = birthUser.familyId
      WHERE user.id <> birthUser.id;
    `;

    const birthUsers = await this.dataSource.query(queryString);

    // for test
    // const birthUsers1 = await this.dataSource.query(queryString);
    // const birthUsers = birthUsers1.filter((user) => user.familyId === 8);

    const birthdayMessage =
      '곧 우리가족의 생일이에요! 따뜻한 축하의 편지를 전해보아요';

    for (let index = 0; index < birthUsers.length; index++) {
      birthUsers[index].birthday.setFullYear(todaySolar.getFullYear());

      // console.log({
      //   param: {
      //     isBirth: true,
      //     targetId: birthUsers[index].birthUserId,
      //     birthday: birthUsers[index].birthday,
      //   },
      // });

      this.notificationService.sendNotification({
        tokens: [birthUsers[index].fcmToken],
        title: '우리가',
        body: birthdayMessage,
        screen: ROUTE_NAME.LETTER_SEND,
        param: {
          isBirth: true,
          targetId: birthUsers[index].birthUserId,
          birthday: birthUsers[index].birthday,
        },
        senderId: 4,
        receiversId: [birthUsers[index].id],
        save: true,
      });
    }
  }

  // async getBirthUsersCnt(): Promise<number> {
  //   const todaySolar = new Date(new Date().toLocaleDateString('ko-KR')); // 양력 오늘

  //   const tomorrowSolar = new Date(todaySolar.getTime() + 1000 * 60 * 60 * 24);

  //   const todayLunarPromise = solarToLunar({
  //     solYear: String(todaySolar.getFullYear()),
  //     solMonth: String(todaySolar.getMonth() + 1).padStart(2, '0'),
  //     solDay: String(todaySolar.getDate()).padStart(2, '0'),
  //   }); // 음력 오늘 한국천문연구원_음양력 정보 활용 (data.go.kr)

  //   const tomorrowLunarPromise = solarToLunar({
  //     solYear: String(tomorrowSolar.getFullYear()),
  //     solMonth: String(tomorrowSolar.getMonth() + 1).padStart(2, '0'),
  //     solDay: String(tomorrowSolar.getDate()).padStart(2, '0'),
  //   }); // 음력 오늘 한국천문연구원_음양력 정보 활용 (data.go.kr)

  //   // console.time('fetch');
  //   const [todayLunar, tomorrowLunar] = await Promise.all([
  //     todayLunarPromise,
  //     tomorrowLunarPromise,
  //   ]);
  //   // console.timeEnd('fetch');

  //   // console.log(todayLunar, tomorrowLunar);

  //   // console.time('query');
  //   const birthUsers = await this.dataSource.query(`
  //       SELECT id, userName, familyId, birthday
  //       FROM user
  //       WHERE (isBirthLunar = 0 and month(birthday) = '${
  //         tomorrowSolar.getMonth() + 1
  //       }' and day(birthday) = '${tomorrowSolar.getDate()}')
  //       OR (isBirthLunar = 0 and month(birthday) = '${
  //         todaySolar.getMonth() + 1
  //       }' and day(birthday) = '${todaySolar.getDate()}')
  //       ${
  //         tomorrowLunar
  //           ? `OR (isBirthLunar = 1 and month(birthday) = '${
  //               tomorrowLunar.getMonth() + 1
  //             }' and day(birthday) = '${tomorrowLunar.getDate()}')
  //             OR (isBirthLunar = 1 and month(birthday) = '${
  //               todayLunar.getMonth() + 1
  //             }' and day(birthday) = '${todayLunar.getDate()}')`
  //           : ''
  //       };
  //   `);
  //   // console.timeEnd('query');

  //   console.log(birthUsers);

  //   return 1;
  // }
}

// 음력 구하기: 공공 데이터 포털 api 사용
async function solarToLunar({
  solYear,
  solMonth,
  solDay,
}: {
  solYear: string;
  solMonth: string;
  solDay: string;
}): Promise<Date> {
  const {
    data: {
      response: {
        header: { resultCode },
        body: {
          items: {
            item: { lunMonth, lunDay, lunYear },
          },
        },
      },
    },
  } = await axios.get(
    `http://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService/getLunCalInfo?solYear=${solYear}&solMonth=${solMonth}&solDay=${solDay}&ServiceKey=${process.env.DATAGOKR_KEY}`,
  );

  if (resultCode === '00') {
    return new Date(
      new Date(`${lunYear}-${lunMonth}-${lunDay}`).toLocaleDateString('ko-KR'),
    );
  } else {
    // on error
    return;
  }
}
