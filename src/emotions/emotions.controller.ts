import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { CreateDailyEmoInput } from './dtos/create-daily-emotion.dto';
import { EditDailyEmoInput } from './dtos/edit-daily-emotion';
import { UserEmotion } from './dtos/user-emotion-dto';
import { EmotionsService } from './emotions.service';
import { DailyEmotion } from './entities/emotion.entity';

@Controller('emotions')
export class EmotionsController {
  constructor(private readonly emotionService: EmotionsService) {}

  /** 1. createToday */
  @Post()
  createDailyEmotion(
    @AuthUser() user: UserId,
    @Body() createDailyEmoInput: CreateDailyEmoInput,
  ): Promise<BaseOutput> {
    return this.emotionService.createDailyEmotion(user, createDailyEmoInput);
  }
  /** 2. delete */
  @Delete(':id')
  deleteDailyEmotion(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.emotionService.deleteDailyEmotion(user, id);
  }

  /** 3. update */
  @Patch(':id')
  editDailyEmotion(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() editDailyEmoInput: EditDailyEmoInput,
  ) {
    return this.emotionService.editDailyEmotion(user, id, editDailyEmoInput);
  }

  /** 7. findMyToday */
  @Get('today/my')
  findMyEmotionToday(@AuthUser() user: UserId): Promise<UserEmotion> {
    return this.emotionService.findMyEmotionToday(user);
  }

  /** 4. findFamilyToday */
  @Get('today/family')
  findFamilyEmotionsToday(@AuthUser() user: UserId): Promise<UserEmotion[]> {
    return this.emotionService.findFamilyEmotionsToday(user);
  }

  /** 5. findFamily: limit */
  @Get()
  findFamilyEmotions(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<{
    date: Date;
    emotions: { userId: number; type: string }[];
  }> {
    return this.emotionService.findFamilyEmotions(user, prev);
  }

  /** 6. findOne */
  @Get(':id')
  findFamilyEmotion(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<DailyEmotion> {
    return this.emotionService.findFamilyEmotion(user, id);
  }

  @Post('poke')
  pokeFamilyEmotion(
    @AuthUser() user: UserId,
    @Body() body: { targetId: number },
  ): Promise<BaseOutput> {
    return this.emotionService.pokeFamilyEmotion(user, body);
  }
}
