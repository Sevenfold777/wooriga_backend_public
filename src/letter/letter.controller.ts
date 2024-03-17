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
import { LetterService } from './letter.service';
import { LetterTheme } from './entities/letter-theme.entity';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Letter } from './entities/letter.entity';
import {
  CreateLetterInput,
  CreateLetterOutput,
} from './dtos/create-letter.dto';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { EditLetterInput } from './dtos/edit-letter.dto';
import { LetterNotifOutput } from './dtos/letter-notif.dto';
import { LetterGuide } from './entities/letter-guide.entity';

@Controller('letter')
export class LetterController {
  constructor(private readonly letterService: LetterService) {}

  @Post()
  sendLetter(
    @AuthUser() user: UserId,
    @Body() createLetterInput: CreateLetterInput,
  ): Promise<CreateLetterOutput> {
    return this.letterService.sendLetter(user, createLetterInput);
  }

  @Patch(':id/read')
  readLetter(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.letterService.readLetter(user, id);
  }

  @Patch(':id')
  editLetter(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() editLetterInput: EditLetterInput,
  ): Promise<BaseOutput> {
    return this.letterService.editLetter(user, id, editLetterInput);
  }

  @Delete(':id')
  deleteLetter(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.letterService.deleteLetter(user, id);
  }

  @Get('received/:id')
  findLetterReceived(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<Letter> {
    return this.letterService.findLetterReceived(user, id);
  }

  @Get('sent/:id')
  findLetterSent(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<Letter> {
    return this.letterService.findLetterSent(user, id);
  }

  @Get('received')
  findLettersRecieved(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
    @Query('isTimeCapsule') isTimeCapsule = false,
  ): Promise<Letter[]> {
    return this.letterService.findLettersReceived(user, prev, isTimeCapsule);
  }

  @Get('sent')
  findLettersSent(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
    @Query('isTimeCapsule') isTimeCapsule = false,
  ): Promise<Letter[]> {
    return this.letterService.findLettersSent(user, prev, isTimeCapsule);
  }

  @Get('themes')
  findThemes(@Query('prev') prev: number): Promise<LetterTheme[]> {
    return this.letterService.findThemes(prev);
  }

  @Get('theme/:id')
  findTheme(@Param('id') id: number): Promise<LetterTheme> {
    return this.letterService.findTheme(id);
  }

  @Get('kept')
  findKept(
    @AuthUser() user: UserId,
    @Query('prev') prev: number,
  ): Promise<Letter[]> {
    return this.letterService.findKept(user, prev);
  }

  @Post(':id/keep')
  keepLetter(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.letterService.keepLetter(user, id);
  }

  @Delete(':id/keep')
  unkeepLetter(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.letterService.unkeepLetter(user, id);
  }

  @Get('home')
  getHomeNofif(@AuthUser() user: UserId): Promise<LetterNotifOutput> {
    return this.letterService.getHomeNofif(user);
  }

  @Get('guide')
  getLetterGuide(): Promise<LetterGuide> {
    return this.letterService.getLetterGuide();
  }
}
