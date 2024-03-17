import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Not, Repository } from 'typeorm';
import { CreateDailyEmoInput } from './dtos/create-daily-emotion.dto';
import { EditDailyEmoInput } from './dtos/edit-daily-emotion';
import { UserEmotion } from './dtos/user-emotion-dto';
import { DailyEmotion } from './entities/emotion.entity';
import { messaging as FCM } from 'firebase-admin';
import { NotificationService } from 'src/notification/notification.service';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { Status } from 'src/common/entities/comment.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class EmotionsService {
  constructor(
    @InjectRepository(DailyEmotion)
    private dailyEmoRepository: Repository<DailyEmotion>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  /** 1. createToday */
  async createDailyEmotion(
    { userId, familyId }: UserId,
    { type }: CreateDailyEmoInput,
  ): Promise<BaseOutput> {
    const today = new Date(new Date().toLocaleDateString('ko-KR'));
    /** check if already created daily emotion */
    const emotion = await this.dailyEmoRepository.findOne({
      where: {
        user: { id: userId },
        // family: { id: familyId },
        date: today,
      },
    });

    if (emotion) {
      return { ok: false, error: 'Already created Daily Emotion.' };
    }

    const dailyEmotion = this.dailyEmoRepository.create({
      type,
      user: { id: userId },
      date: today,
    });

    try {
      await this.dailyEmoRepository.save(dailyEmotion); // save DB

      // 감정 선택하면 가족에게 푸쉬
      const familyMembers = await this.userRepository.find({
        select: ['fcmToken', 'userName', 'id'],
        where: { family: { id: familyId } },
      });

      const meIdx = familyMembers.findIndex((user) => user.id === userId);
      const me = familyMembers[meIdx];

      const familyTokens = familyMembers
        .filter((user) => user.id !== userId)
        .map((user) => user.fcmToken);

      await this.notificationService.sendNotification({
        tokens: familyTokens,
        title: '오늘의 우리가',
        body: `${me.userName} 님이 오늘의 감정을 선택하였습니다!`,
        screen: ROUTE_NAME.MESSAGE_HOME,
        save: false,
      });
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }

    return { ok: true };
  }

  /** 2. delete */
  async deleteDailyEmotion(
    { userId }: UserId,
    id: number,
  ): Promise<BaseOutput> {
    const result = await this.dailyEmoRepository.delete({
      id,
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Couldn't Delete the Emotion." };
    }

    return { ok: true };
  }

  /** 3. update */
  async editDailyEmotion(
    { userId, familyId }: UserId,
    id: number,
    editDailyEmoInput: EditDailyEmoInput,
  ): Promise<BaseOutput> {
    const today = new Date(new Date().toLocaleDateString('ko-KR'));

    const result = await this.dailyEmoRepository.update(
      { id, user: { id: userId }, date: today },
      editDailyEmoInput,
    );

    // user not found
    if (result.affected === 0) {
      return { ok: false, error: "Couldn't find the Emotion" };
    }

    // 감정 선택하면 가족에게 푸쉬
    const familyMembers = await this.userRepository.find({
      select: ['fcmToken', 'userName', 'id'],
      where: { family: { id: familyId } },
    });

    const meIdx = familyMembers.findIndex((user) => user.id === userId);
    const me = familyMembers[meIdx];

    const familyTokens = familyMembers
      .filter((user) => user.id !== userId)
      .map((user) => user.fcmToken);

    await this.notificationService.sendNotification({
      tokens: familyTokens,
      title: '오늘의 우리가',
      body: `${me.userName} 님이 오늘의 감정을 선택하였습니다!`,
      screen: ROUTE_NAME.MESSAGE_HOME,
      save: false,
    });

    return { ok: true };
  }

  /** 4. findFamilyToday */
  async findFamilyEmotionsToday({
    userId,
    familyId,
  }: UserId): Promise<UserEmotion[]> {
    const today = new Date(new Date().toLocaleDateString('ko-KR'));
    const todayString = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    // raw sql query
    const userEmotions = await this.dataSource.query(`
      with today_emotion as (select * from daily_emotion where date = '${todayString}'),
          family_members as (select user.id, user.userName, user.familyId, family_pedia.id as pediaId
                             from user inner join family_pedia on family_pedia.ownerId = user.id
                             where user.familyId = ${familyId} and user.id <> ${userId})
      select family_members.id as userId, family_members.userName, family_members.familyId, 
              family_members.pediaId, today_emotion.id as emotionId, today_emotion.type from family_members
      left outer join today_emotion on family_members.id = today_emotion.userId`);

    return userEmotions;
  }

  /** 7. findMyEmotionToday */
  async findMyEmotionToday({ userId }: UserId): Promise<UserEmotion> {
    const today = new Date(new Date().toLocaleDateString('ko-KR'));
    const todayString = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    /** raw sql query */
    const userEmotion = await this.dataSource.query(`
      with today_emotion as (select * from daily_emotion where date = '${todayString}'),
          me as (select * from user where id = ${userId})
      select me.id as userId, me.userName, me.familyId,
              today_emotion.id as emotionId, today_emotion.type from me
      left outer join today_emotion on me.id = today_emotion.userId`);

    return userEmotion;
  }

  /** 5. findFamily: limit */
  async findFamilyEmotions(
    { userId, familyId }: UserId,
    prev: number,
  ): Promise<{
    date: Date;
    emotions: { userId: number; type: string }[];
  }> {
    const take = 20;
    const today = new Date(new Date().toLocaleDateString('ko-KR'));
    const todayString = `${today.getFullYear()}-${
      today.getMonth() + 1
    }-${today.getDate()}`;

    /** query raw */
    const rawQuery = await this.dataSource
      .query(`with family_members as (select * from user where familyId = ${familyId})
              select date, group_concat('{"userId":', userId, ', "type":  "',type,'"} ') as emotions
              from daily_emotion
              inner join family_members on daily_emotion.userId = family_members.id
              where date <> '${todayString}'
              group by date
              order by date DESC, userId ASC
              limit ${take} offset ${prev * take};`);

    /** structure raw query */
    const familyEmotionsByDay = rawQuery?.map(
      (dateEmotions: { date: Date; emotions: string }) => {
        return {
          date: dateEmotions.date,
          emotions: dateEmotions.emotions
            .split(' ,')
            .map((emotion: string) => JSON.parse(emotion))
            .sort((a, b) => {
              return a.userId - b.userId;
            }),
        };
      },
    );
    return familyEmotionsByDay;

    // console.log(JSON.parse('{"userId":28, "type":"happy"} '));

    // return this.dailyEmoRepository.find({
    //   where: { user: { family: { id: familyId } } },
    //   relations: { user: true },
    //   order: { date: 'DESC' },
    // });
  }

  /** 6. findOne */
  findFamilyEmotion({ familyId }: UserId, id: number): Promise<DailyEmotion> {
    return this.dailyEmoRepository.findOne({
      where: { user: { family: { id: familyId }, id } },
      relations: { user: true },
    });
  }

  async pokeFamilyEmotion(
    { userId, familyId }: UserId,
    { targetId }: { targetId: number },
  ): Promise<BaseOutput> {
    const target = await this.userRepository.findOne({
      where: { id: targetId, family: { id: familyId }, status: Status.ACTIVE },
    });

    try {
      await this.notificationService.sendNotification({
        tokens: [target.fcmToken],
        title: '오늘의 감정을 선택해주세요',
        body: `가족들이 ${target.userName}님의 감정을 궁금해 합니다!`,
        screen: ROUTE_NAME.MESSAGE_HOME,
        param: { openEmotionSelection: true },
        senderId: userId,
        receiversId: [targetId],
      });
    } catch (e) {
      if (!target) {
        return { ok: false, error: 'Cannot find the target user.' };
      }

      return { ok: false, error: 'Send Notification Failed.' };
    }

    return { ok: true };
  }
}
