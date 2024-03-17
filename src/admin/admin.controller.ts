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
import {
  AdminServiceLetter,
  AdminServiceMessage,
  AdminServicePhoto,
  AdminServiceUser,
} from './admin.service';
import {
  CreateMessageInput,
  CreateMessageOutput,
} from 'src/messages/dtos/create-message.dto';
import { Message, ServiceLinked } from 'src/messages/entities/message.entity';
import { DailyEmotions } from 'src/emotions/entities/emotion.entity';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { LetterHashtag } from 'src/letter/entities/letter-hashtag.entity';
import { LetterTheme } from 'src/letter/entities/letter-theme.entity';
import { EditLetterThemeInput } from './dtos/edit-letter-theme.dto';
import {
  CreateLetterThemeInput,
  CreateLetterThemeOutput,
} from './dtos/create-letter-theme.dto';
import { CreateLetterHashTagInput } from './dtos/create-letter-hashtag.dto';
import { CreateMessageFamInput } from 'src/messages/dtos/create-message-family.dto';
import { Admin } from 'src/auth/admin.decorator';
import { Family } from 'src/family/entities/familiy.entity';
import { EditMessageInput } from 'src/messages/dtos/edit-message.dto';
import { DAU } from './entities/dau.entity';
import { MAU } from './entities/mau.entity';
import { LetterGuide } from 'src/letter/entities/letter-guide.entity';
import { CreateLetterGuideInput } from './dtos/create-letter-guide.dto';
import { EditLetterGuideInput } from './dtos/edit-letter-guide.dto';

@Admin()
@Controller('admin/message')
export class AdminControllerMessage {
  constructor(private readonly adminService: AdminServiceMessage) {}

  @Get('comments/userFam')
  getCommentedUserFamCnt(): Promise<{
    userCnt: number;
    familyCnt: number;
    familyNotAdmin: number;
  }> {
    return this.adminService.getCommentedUserFamCnt();
  }

  // 전체 가족 수
  @Get('familyCnt')
  getAllFamiliesCnt(): Promise<number> {
    return this.adminService.getAllFamiliesCnt();
  }

  // 오늘의 전체 댓글량
  @Get('comments')
  getTodayCommentsCnt(): Promise<number> {
    return this.adminService.getTodayCommentsCnt();
  }

  // 오늘의 전체 좋아요
  @Get('metoos')
  getTodayMetoos(): Promise<number> {
    return this.adminService.getTodayMetoos();
  }

  // 3일간 발송 예정 이야기들
  @Get('near')
  findMessagesNearArrive(): Promise<Message[]> {
    return this.adminService.findMessagesNearArrive();
  }

  // 개별 이야기
  @Get(':id')
  findMessage(
    @Param('id') id: number,
    @Query('isSent') isSent: boolean,
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
    return this.adminService.findMessage(id, isSent);
  }

  // 전체 이야기 목록
  @Get()
  findMessages(@Query('prev') prev: number): Promise<
    {
      id: number;
      payload: string;
      emotion: DailyEmotions;
      uploadAt: Date;
      messageFamCount: number;
      createdAt: Date;
    }[]
  > {
    return this.adminService.findMessages(prev);
  }

  // 이야기 등록
  @Post()
  createMessage(
    @Body() createMessageInput: CreateMessageInput,
  ): Promise<CreateMessageOutput> {
    return this.adminService.createMessage(createMessageInput);
  }

  // 이야기 수정
  @Patch(':id')
  editMessage(
    @Param('id') id: number,
    @Body() editMessageInput: EditMessageInput,
  ): Promise<BaseOutput> {
    return this.adminService.editMessage(id, editMessageInput);
  }

  // 이야기 삭제: 한 가족에게라도 공개되지 않은 경우 (messagaeFam, receiveDate)
  @Delete(':id')
  deleteMessage(@Param('id') id: number): Promise<BaseOutput> {
    return this.adminService.deleteMessage(id);
  }

  // 사용자에게 발송
  @Post('send')
  sendMessagToFam(
    @Body() createMessageFamInput: CreateMessageFamInput,
  ): Promise<BaseOutput> {
    return this.adminService.sendMessagToFam(createMessageFamInput);
  }
}

@Admin()
@Controller('admin/letter')
export class AdminControllerLetter {
  constructor(private readonly adminService: AdminServiceLetter) {}

  @Get('today/sent')
  getTodaySent(): Promise<{ all: number; timeCapsules: number }> {
    return this.adminService.getTodaySent();
  }

  @Post('theme/:id/recommend')
  sendThemeRecommendNotif(@Param('id') themeId: number): Promise<BaseOutput> {
    return this.adminService.sendThemeRecommendNotif(themeId);
  }

  @Get('themes')
  findLetterThemes(@Query('prev') prev: number): Promise<
    {
      id: number;
      title: string;
      hashtags: LetterHashtag[];
      sentAmount: number;
    }[]
  > {
    return this.adminService.findLetterThemes(prev);
  }

  @Get('theme/:id')
  findLetterTheme(@Param('id') id: number): Promise<LetterTheme> {
    return this.adminService.findLetterTheme(id);
  }

  @Delete('theme/:id')
  deleteLetterTheme(@Param('id') id: number): Promise<BaseOutput> {
    return this.adminService.deleteLetterTheme(id);
  }

  @Patch('theme/:id')
  editLetterTheme(
    @Param('id') id: number,
    @Body() editLetterThemeInput: EditLetterThemeInput,
  ): Promise<BaseOutput> {
    return this.adminService.editLetterTheme(id, editLetterThemeInput);
  }

  @Post('theme')
  createLetterTheme(
    @Body() createLetterThemeInput: CreateLetterThemeInput,
  ): Promise<CreateLetterThemeOutput> {
    console.log('hi');

    return this.adminService.createLetterTheme(createLetterThemeInput);
  }

  @Get('hashtags')
  findAllHashTags(): Promise<LetterHashtag[]> {
    return this.adminService.findAllHashTags();
  }

  @Post('hashtag')
  createHashTag(
    @Body() createLetterHashTagInput: CreateLetterHashTagInput,
  ): Promise<BaseOutput> {
    return this.adminService.createHashTag(createLetterHashTagInput);
  }

  @Delete('hashtag')
  deleteHashTag(
    @Body() createLetterHashTagInput: CreateLetterHashTagInput,
  ): Promise<BaseOutput> {
    return this.adminService.deleteHashTag(createLetterHashTagInput);
  }

  @Get('guide/:id')
  getLetterGuide(@Param('id') id: number): Promise<LetterGuide> {
    return this.adminService.getLetterGuide(id);
  }

  @Get('guide')
  getLetterGuideList(): Promise<LetterGuide[]> {
    return this.adminService.getLetterGuideList();
  }

  @Post('guide')
  postLetterGuide(
    @Body() createGuideInput: CreateLetterGuideInput,
  ): Promise<BaseOutput> {
    return this.adminService.postLetterGuide(createGuideInput);
  }

  @Patch('guide/:id')
  editLetterGuide(
    @Param('id') id: number,
    @Body() editGuideInput: EditLetterGuideInput,
  ): Promise<BaseOutput> {
    return this.adminService.editLetterGuide(id, editGuideInput);
  }

  @Delete('guide/:id')
  deleteLetterGuide(@Param('id') id: number): Promise<BaseOutput> {
    return this.adminService.deleteLetterGuide(id);
  }
}

@Admin()
@Controller('admin/photo')
export class AdminControllerPhoto {
  constructor(private readonly adminService: AdminServicePhoto) {}

  @Get()
  getPhotosCnt(): Promise<number> {
    return this.adminService.getPhotosCnt();
  }

  @Get('comments')
  getTodayCommentsCnt(): Promise<number> {
    return this.adminService.getTodayCommentsCnt();
  }

  @Get('likes')
  getTodayLikes(): Promise<number> {
    return this.adminService.getTodayLikes();
  }
}

@Admin()
@Controller('admin/user')
export class AdminControllerUser {
  constructor(private readonly adminService: AdminServiceUser) {}

  @Get('family')
  getFamilyCnt(): Promise<number> {
    return this.adminService.getFamilyCnt();
  }

  @Get('stat')
  getUserStat(@Query('prev') prev: number): Promise<
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
    return this.adminService.getUserStat(prev);
  }

  @Get()
  getUserCnt(): Promise<number> {
    return this.adminService.getUserCnt();
  }

  @Get('active')
  getAU(): Promise<{ dau: number; mau: number }> {
    return this.adminService.getAU();
  }

  @Get('byFamily')
  getFamilyWithUser(@Query('prev') prev: number): Promise<Family[]> {
    return this.adminService.getFamilyWithUser(prev);
  }

  @Get('pedia')
  getPediaEditted(): Promise<number> {
    return this.adminService.getPediaEditted();
  }

  @Get('emotion')
  getEmoSelected(): Promise<number> {
    return this.adminService.getEmoSelected();
  }

  @Get('dau')
  getDAU(@Query('prev') prev: number): Promise<DAU[]> {
    return this.adminService.getDAU(prev);
  }

  @Get('mau')
  getMAU(@Query('prev') prev: number): Promise<MAU[]> {
    return this.adminService.getMAU(prev);
  }

  // @Get('birthday')
  // getBirthUsersCnt(): Promise<number> {
  //   return this.adminService.getBirthUsersCnt();
  // }
}
