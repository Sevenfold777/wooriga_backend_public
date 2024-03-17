import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Letter } from './entities/letter.entity';
import {
  Between,
  DataSource,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Not,
  Repository,
} from 'typeorm';
import { LetterTheme } from './entities/letter-theme.entity';
import { LetterExample } from './entities/letter-example.entity';
import { LetterHashtag } from './entities/letter-hashtag.entity';
import { User } from 'src/users/entities/user.entity';
import {
  CreateLetterInput,
  CreateLetterOutput,
} from './dtos/create-letter.dto';
import { EditLetterInput } from './dtos/edit-letter.dto';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { LetterKeep } from './entities/letter-keep.entity';
import { LetterNotifOutput } from './dtos/letter-notif.dto';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { NotificationService } from 'src/notification/notification.service';
import { Cron } from '@nestjs/schedule';
import { UserId } from 'src/auth/auth-user.decorator';
import { LetterGuide } from './entities/letter-guide.entity';

@Injectable()
export class LetterService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Letter) private letterRepository: Repository<Letter>,
    @InjectRepository(LetterGuide)
    private letterGuideRepository: Repository<LetterGuide>,
    @InjectRepository(LetterTheme)
    private themeRepository: Repository<LetterTheme>,
    @InjectRepository(LetterHashtag)
    private hashTagRepository: Repository<LetterHashtag>,
    @InjectRepository(LetterKeep)
    private keepRepository: Repository<LetterKeep>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async sendLetter(
    { userId }: UserId,
    {
      title,
      payload,
      emotion,
      isTimeCapsule,
      receiveDate,
      receivers,
      themeId,
      isTemp,
    }: CreateLetterInput,
  ): Promise<CreateLetterOutput> {
    try {
      let lastLetterId: number;
      // 1. 임시저장
      if (isTemp) {
        const newLetter = this.letterRepository.create({
          title,
          payload,
          emotion,
          isTimeCapsule,
          receiveDate: isTimeCapsule ? receiveDate : new Date(),
          sender: { id: userId },
          ...(themeId && { theme: { id: themeId } }),
          ...(isTemp && { isTemp }),
        });

        const letter = await this.letterRepository.save(newLetter);
        lastLetterId = letter.id;
      }
      // 2. 실제 전송
      else {
        const receiversWithToken = await this.userRepository.find({
          select: ['id', 'fcmToken'],
          where: { id: In(receivers) },
        });

        for (const receiver of receiversWithToken) {
          const newLetter = this.letterRepository.create({
            title,
            payload,
            emotion,
            isTimeCapsule,
            receiveDate: isTimeCapsule ? receiveDate : new Date(),
            sender: { id: userId },
            ...(receiver.id !== -1 && { receiver: { id: receiver.id } }),
            ...(themeId && { theme: { id: themeId } }),
            ...(isTemp && { isTemp }),
          });

          const letter = await this.letterRepository.save(newLetter);
          lastLetterId = letter.id;

          isTimeCapsule
            ? this.notificationService.sendNotification({
                tokens: [receiver.fcmToken],
                title: '우리가 편지',
                body: '새로운 타임캡슐이 작성되었습니다!',
                screen: ROUTE_NAME.TIME_CAPSULES_NAV,
                senderId: userId,
                receiversId: receivers,
              })
            : this.notificationService.sendNotification({
                tokens: [receiver.fcmToken],
                title: '우리가 편지',
                body: '새로운 편지가 도착했습니다!',
                screen: ROUTE_NAME.LETTER_RECEIVED,
                param: { letterId: letter.id },
                senderId: userId,
                receiversId: receivers,
              });
        }
      }

      return { ok: true, id: lastLetterId };
    } catch (e) {
      return { ok: false, error: e.code };
    }
  }

  async editLetter(
    { userId }: UserId,
    id: number,
    {
      title,
      payload,
      emotion,
      isTimeCapsule,
      receiveDate,
      themeId,
      isTemp,
    }: EditLetterInput,
  ): Promise<CreateLetterOutput> {
    try {
      // 1. update letter
      const result = await this.letterRepository.update(
        { id, sender: { id: userId }, isRead: false },
        {
          title,
          payload,
          emotion,
          isTimeCapsule,
          receiveDate: isTimeCapsule ? receiveDate : new Date(),
          theme: themeId ? { id: themeId } : null, // test 해봐야
          ...(isTemp && { isTemp }),
        },
      );

      if (result.affected === 0) {
        return { ok: false, error: "Couldn't update the letter." };
      }

      return { ok: true, id };
    } catch (e) {
      console.log(e);

      return { ok: false, error: 'Something went wrong.' };
    }
  }

  async deleteLetter({ userId }: UserId, id: number): Promise<BaseOutput> {
    try {
      const result = await this.letterRepository.delete({
        id,
        sender: { id: userId },
        isRead: false,
      });

      if (result.affected === 0) {
        return { ok: false, error: 'Could not delete the letter' };
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.code };
    }
  }

  findLettersReceived(
    { userId }: UserId,
    prev: number,
    isTimeCapsule: boolean,
  ): Promise<Letter[]> {
    const take = 20;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 3);
    const timeCapusuleBool = JSON.parse(String(isTimeCapsule));

    return this.letterRepository.find({
      where: {
        receiver: { id: userId },
        ...(timeCapusuleBool
          ? {
              isTimeCapsule: timeCapusuleBool,
              receiveDate: MoreThanOrEqual(maxDate),
            } // 받은 타임캡슐: 타임 캡슐인 것만; 개봉된지 3일 이내의 것부터 미개봉 타임캡슐 전부
          : { receiveDate: LessThanOrEqual(new Date()) }), // 받은 편지함: 타임캡슐 여부 무관 / 지금보다 receiveDate 작은 거 전부
      },
      relations: { receiver: true, sender: true },
      order: { receiveDate: 'desc' },
      take,
      skip: take * prev,
    });
  }

  async findLettersSent(
    { userId }: UserId,
    prev: number,
    isTimeCapsule: boolean,
  ): Promise<Letter[]> {
    const take = 20;
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() - 3);
    const timeCapusuleBool = JSON.parse(String(isTimeCapsule));

    const letters = await this.letterRepository.find({
      where: [
        {
          sender: { id: userId },
          ...(timeCapusuleBool && {
            isTimeCapsule: timeCapusuleBool,
            receiveDate: MoreThanOrEqual(maxDate),
            isTemp: false,
          }),
        },
        !timeCapusuleBool && {
          sender: { id: userId },
          isTemp: true,
        },
      ],
      relations: { receiver: true, sender: true },
      order: { updatedAt: 'desc' },
      take,
      skip: take * prev,
    });

    return letters.sort((a, b) => {
      if (b.isTemp === true) {
        return 1;
      } else if (a.isTemp === true) {
        return -1;
      }
    });
  }

  findLetterSent({ userId }: UserId, id: number): Promise<Letter> {
    return this.letterRepository.findOne({
      where: { id, sender: { id: userId } },
      relations: { receiver: true },
    });
  }

  findLetterReceived({ userId }: UserId, id: number): Promise<Letter> {
    return this.letterRepository.findOne({
      where: { id, receiver: { id: userId } },
      relations: {
        sender: true,
        keeps: { user: true },
        receiver: true,
      },
    });
  }

  findThemes(prev: number): Promise<LetterTheme[]> {
    const take = 20;

    return this.themeRepository.find({
      relations: { hashtags: true },
      order: { updatedAt: 'desc' },
      take,
      skip: take * prev,
    });
  }

  findTheme(id: number): Promise<LetterTheme> {
    return this.themeRepository.findOne({
      where: { id },
      relations: { hashtags: true, examples: true },
    });
  }

  async readLetter({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.letterRepository.update(
      {
        id,
        receiver: { id: userId },
      },
      { isRead: true },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Read Failed.' };
    }

    return { ok: true };
  }

  async keepLetter({ userId }: UserId, id: number): Promise<BaseOutput> {
    const exist = await this.keepRepository.findOne({
      where: { letter: { id }, user: { id: userId } },
    });

    if (exist) {
      return { ok: false, error: 'Already kept.' };
    }

    const keep = this.keepRepository.create({
      letter: { id },
      user: { id: userId },
    });

    try {
      await this.keepRepository.save(keep);
    } catch (e) {
      return { ok: false, error: "Couldn't keep Message." };
    }

    return { ok: true };
  }

  async unkeepLetter({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.keepRepository.delete({
      letter: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Coudn't delete keep." };
    }

    return { ok: true };
  }

  findKept({ userId }: UserId, prev: number): Promise<Letter[]> {
    const take = 20;

    return this.letterRepository.find({
      where: { keeps: { user: { id: userId } } },
      relations: { receiver: true, keeps: true, sender: true },
      order: { receiveDate: 'desc' },
      take,
      skip: take * prev,
    });
  }

  async getHomeNofif({ userId }: UserId): Promise<LetterNotifOutput> {
    const now = new Date();
    const aDayAgo = new Date();
    aDayAgo.setDate(aDayAgo.getDate() - 1);
    const aDayAfter = new Date();
    aDayAfter.setDate(aDayAfter.getDate() + 1);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // 확률 당첨 함수
    const probabiltyGen = (denom: number): boolean => {
      return Math.floor(Math.random() * 1000) % denom === 0;
    };

    // 1. 편지 도착 / 타임캡슐 도착 체크 (50%)
    if (probabiltyGen(2)) {
      const letterReceived = await this.letterRepository.findOne({
        where: [
          { receiver: { id: userId }, isTimeCapsule: false, isRead: false },
          {
            receiver: { id: userId },
            isTimeCapsule: true,
            receiveDate: Between(threeDaysAgo, now),
            isRead: false,
          },
        ],
        relations: { receiver: true, sender: true },
      });

      // 1-1. 찾았으면 return Letter
      if (letterReceived) {
        return {
          message: letterReceived.isTimeCapsule
            ? `${letterReceived.sender.userName} 님이 보낸 타임캡슐이\n공개되었습니다!`
            : `새로운 편지가 도착했어요!`,
          screen: ROUTE_NAME.LETTER_RECEIVED,
          param: JSON.stringify({ letterId: letterReceived.id }),
        };
      }
    }

    // 2. 보낸 타임캡슐 도착 당일 (30%)
    if (probabiltyGen(3)) {
      const tcOpened = await this.letterRepository.findOne({
        where: {
          sender: { id: userId },
          isTimeCapsule: true,
          receiveDate: Between(aDayAgo, now),
        },
        relations: { sender: true, receiver: true },
      });

      if (tcOpened) {
        return {
          message: `${tcOpened.receiver.userName} 님에게 보낸 타임캡슐이\n공개되었습니다!`,
          screen: ROUTE_NAME.LETTER_SENT,
          param: JSON.stringify({ letterId: tcOpened.id }),
        };
      }
    }

    // 3. 공개 예정(하루 전)인 보낸 / 받은 TC (16%)
    if (probabiltyGen(6)) {
      const tcAboutOpen = await this.letterRepository.findOne({
        where: [
          {
            sender: { id: userId },
            isTimeCapsule: true,
            isRead: false, // 안 넣어도 되지만
            receiveDate: Between(now, aDayAfter),
          },
          {
            receiver: { id: userId },
            isTimeCapsule: true,
            isRead: false,
            receiveDate: Between(now, aDayAfter),
          },
        ],
        relations: { sender: true, receiver: true },
      });

      if (tcAboutOpen) {
        return tcAboutOpen.sender.id === userId
          ? {
              message: `${tcAboutOpen.receiver.userName} 님에게 보낸 타임캡슐이\n1일 뒤 공개 예정입니다!`,
              screen: ROUTE_NAME.TIME_CAPSULES_SENT,
            }
          : {
              message: `${tcAboutOpen.sender.userName} 님이 작성한 타임캡슐이\n1일 뒤 공개 예정입니다!`,
              screen: ROUTE_NAME.TIME_CAPSULES_RECEIVED,
            };
      }
    }
    // 4. 주제 추천 (75%)
    if (!probabiltyGen(4)) {
      const themeRecommend = await this.dataSource.query(`
        select id, title, recommendText from letter_theme
        order by rand()
        limit 1;
        `);

      if (themeRecommend.length) {
        return {
          message: themeRecommend[0].recommendText,
          screen: ROUTE_NAME.LETTER_THEME_DETAIL,
          param: JSON.stringify({
            themeId: themeRecommend[0].id,
            headerTitle: themeRecommend[0].title,
            isSelect: false,
          }),
        };
      }
    }

    // 5. 기본 (편지 작성 권유)
    return {
      message: '편지를 작성하여\n우리가족에게 마음을 전해보아요!',
      screen: ROUTE_NAME.LETTER_SEND,
    };
  }

  // 알림 보내줘야할 타임캡슐이 있는지 확인
  @Cron('0 * * * * *')
  async chkTimeCapsuleOpened(): Promise<void> {
    const now = new Date();
    const aMinuteAgo = new Date(now);
    aMinuteAgo.setMinutes(aMinuteAgo.getMinutes() - 1);

    // 1. 1분 이내에 개봉된 타임캡슐 찾기
    const lettersToNotif = await this.letterRepository.find({
      where: {
        isTimeCapsule: true,
        receiveDate: Between(aMinuteAgo, now),
        isRead: false,
        isTemp: false,
      },
      relations: { sender: true, receiver: true },
    });

    // 2. 알림 보내기
    for (const letter of lettersToNotif) {
      // 굳이 await 하지는 않았는데 하는 게 좋으려나?
      this.notificationService.sendNotification({
        tokens: [letter.receiver.fcmToken],
        title: '우리가 편지',
        body: '새로운 타임캡슐이 공개되었습니다!',
        screen: ROUTE_NAME.LETTER_RECEIVED,
        param: { letterId: letter.id },
        senderId: letter.sender.id,
        receiversId: [letter.receiver.id],
      });

      this.notificationService.sendNotification({
        tokens: [letter.sender.fcmToken],
        title: '우리가 편지',
        body: `${letter.receiver.userName} 님에게 작성한 타임캡슐이 공개되었습니다!`,
        screen: ROUTE_NAME.LETTER_SENT,
        param: { letterId: letter.id },
        senderId: letter.receiver.id,
        receiversId: [letter.sender.id],
      });
    }
  }

  getLetterGuide(): Promise<LetterGuide> {
    return this.letterGuideRepository.findOne({
      where: { isPinned: true },
      order: { updatedAt: 'desc', id: 'desc' },
    });
  }
}
