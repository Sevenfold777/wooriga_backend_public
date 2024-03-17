import { Controller, Delete, Get, Param, Query } from '@nestjs/common';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('received')
  findReceivedNotifications(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<Notification[]> {
    return this.notificationService.findReceivedNotifications(user, prev);
  }

  @Delete(':id')
  deleteNotification(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.notificationService.deleteNotification(user, id);
  }
}
