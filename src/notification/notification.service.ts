import { Injectable } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CronJob, CronTime } from 'cron';
import { messaging as FCM } from 'firebase-admin';
import { BatchResponse } from 'firebase-admin/lib/messaging/messaging-api';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class NotificationService {
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /** schedule notification (e.g. push FCM 30 minutes later) */
  async scheduleNotification({
    scheduleName,
    tokens,
    title,
    body,
    timeToSend,
    screen,
    param,
    senderId,
    receiversId,
  }: {
    scheduleName: string;
    tokens: string[];
    title: string;
    body: string;
    timeToSend: Date;
    screen?: string;
    param?: any;
    senderId: number;
    receiversId: number[];
  }) {
    const job = new CronJob({
      cronTime: timeToSend,
      onTick: async () => {
        await this.sendNotification({
          tokens,
          title,
          body,
          screen,
          param,
          senderId,
          receiversId,
        });
        job.stop();
      },
      onComplete: () => {
        // this.unscheduleNotification(scheduleName);
      },
    });

    this.schedulerRegistry.addCronJob(scheduleName, job);
    job.start();
  }

  /** remove schedule */
  unscheduleNotification(scheduleName: string) {
    this.schedulerRegistry.deleteCronJob(scheduleName);
  }

  /** change notification delivery time: 30 --> 0 */
  async fireScheduledNotification({
    scheduleName,
    tokens,
    title,
    body,
    screen,
    param,
    senderId,
    receiversId,
  }: {
    scheduleName: string;
    tokens: string[];
    title: string;
    body: string;
    screen?: string;
    param?: any;
    senderId: number;
    receiversId: number[];
  }) {
    this.unscheduleNotification(scheduleName);

    await this.sendNotification({
      tokens,
      title,
      body,
      screen,
      param,
      senderId,
      receiversId,
    });
  }

  /** sendNotification */
  async sendNotification({
    tokens,
    title,
    body,
    screen,
    param,
    senderId,
    receiversId,
    save = true,
  }: {
    tokens: string[];
    title: string;
    body: string;
    senderId?: number;
    receiversId?: number[];
    screen?: string;
    param?: any;
    save?: boolean;
  }) {
    if (tokens.length === 0) {
      return;
    }

    const nonNullTokens = tokens.filter((token) => token);

    console.log(nonNullTokens.length, nonNullTokens);
    console.log(tokens.length, tokens);

    // return;

    // avoid when non valid tokens
    if (!nonNullTokens.length) return;

    const result = await FCM().sendMulticast({
      tokens: nonNullTokens,
      notification: {
        title,
        body,
      },
      ...(screen && {
        data: { screen, ...(param && { param: JSON.stringify(param) }) },
      }),
      apns: {
        // headers: {},
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
      android: {
        priority: 'high',
        notification: {
          // for android head-up
          title,
          body,
          priority: 'high',
          icon: 'default',
          channelId: '500',
          sound: 'default',
        },
      },
    });

    console.log(result);

    if (save) {
      const notifications = receiversId.map((receiverId) =>
        this.notificationRepository.create({
          title,
          body,
          ...(screen && {
            screen,
            ...(param && { param: JSON.stringify(param) }),
          }),
          sender: { id: senderId },
          receiver: { id: receiverId },
        }),
      );

      try {
        for (const notification of notifications) {
          await this.notificationRepository.save(notification);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }

  getAllSchedules() {
    const jobs = this.schedulerRegistry.getCronJobs();
    console.log(jobs);
  }

  findReceivedNotifications(
    { userId }: UserId,
    prev: number,
  ): Promise<Notification[]> {
    const take = 20;

    return this.notificationRepository.find({
      where: { receiver: { id: userId } },
      take,
      skip: prev * take,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteNotification(
    { userId }: UserId,
    id: number,
  ): Promise<BaseOutput> {
    const result = await this.notificationRepository.delete({
      id,
      receiver: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Couldn't delete notification." };
    }

    return { ok: true };
  }
}
