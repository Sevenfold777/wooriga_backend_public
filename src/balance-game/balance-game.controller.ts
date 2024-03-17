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
import { BalanceGameService } from './balance-game.service';
import {
  BalanceGameFamilyOutput,
  BalanceGameOutput,
} from './dtos/balance-game.dto';
import { CommentBalanceGameInput } from './dtos/comment-balance-game.dto';
import { BalanceChoice } from './entities/balance-choice.entity';
import { BalanceGameComment } from './entities/balance-game-comment.entity';
import { BalanceGameFamilyComment } from './entities/balance-game-family-comment.entity';
import { BalanceGame } from './entities/balance-game.entity';

@Controller('balanceGame')
export class BalanceGameController {
  constructor(private readonly balanceGameService: BalanceGameService) {}

  @Get()
  findBalanceGames(
    @AuthUser() user: UserId,
    @Query('prev') prev = 0,
  ): Promise<BalanceGameOutput[]> {
    return this.balanceGameService.findBalanceGames(user, prev);
  }

  // to be
  @Get('recommend')
  findGamesRecommnded(@AuthUser() user: UserId): Promise<BalanceGame[]> {
    return this.balanceGameService.findGamesRecommended(user);
  }

  // @Get('recommend')
  // findGameRecommnded(@AuthUser() user: UserId): Promise<BalanceGame> {
  //   return this.balanceGameService.findGameRecommended(user);
  // }

  @Get(':id/family/comment')
  findFamilyComments(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Query('prev') prev = 0,
  ): Promise<BalanceGameFamilyComment[]> {
    return this.balanceGameService.findFamilyComments(user, id, prev);
  }

  @Get(':id/comment')
  findComments(
    @Param('id') id: number,
    @Query('prev') prev: number,
  ): Promise<BalanceGameComment[]> {
    return this.balanceGameService.findComments(id, prev);
  }

  @Get(':id/choice/family')
  findFamilyChoices(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<
    {
      userId: number;
      userName: string;
      choiceId: number | null;
      payload: string | null;
    }[]
  > {
    return this.balanceGameService.findFamilyChoices(user, id);
  }

  @Get(':id/choice')
  findChoices(@Param('id') id: number): Promise<BalanceChoice[]> {
    return this.balanceGameService.findChoices(id);
  }

  @Get(':id/family')
  findBalanceGameFamily(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BalanceGameFamilyOutput> {
    return this.balanceGameService.findBalanceGameFamily(user, id);
  }

  @Get(':id')
  findBalanceGame(@Param('id') id: number): Promise<BalanceGame> {
    return this.balanceGameService.findBalanceGame(id);
  }

  @Post(':id/choice')
  choiceSelection(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Query('choice') choice: string,
  ): Promise<BaseOutput> {
    return this.balanceGameService.choiceSelection(user, id, choice);
  }

  @Patch(':id/choice')
  changeSelection(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Query('choice') choice: string,
  ): Promise<BaseOutput> {
    return this.balanceGameService.changeSelection(user, id, choice);
  }

  @Delete(':id/choice')
  deleteSelection(
    @AuthUser() user: UserId,
    @Param('id') id: number,
  ): Promise<BaseOutput> {
    return this.balanceGameService.deleteSelection(user, id);
  }

  @Post(':id/comment')
  commentGame(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() commentBalanceGameInput: CommentBalanceGameInput,
  ): Promise<BaseOutput> {
    return this.balanceGameService.commentGame(
      user,
      id,
      commentBalanceGameInput,
    );
  }

  @Delete(':commentId/comment')
  deleteComment(
    @AuthUser() user: UserId,
    @Param('commentId') commentId: number,
  ): Promise<BaseOutput> {
    return this.balanceGameService.deleteComment(user, commentId);
  }

  @Post(':id/family/comment')
  commentGameFamily(
    @AuthUser() user: UserId,
    @Param('id') id: number,
    @Body() commentBalanceGameInput: CommentBalanceGameInput,
  ): Promise<BaseOutput> {
    return this.balanceGameService.commentGameFamily(
      user,
      id,
      commentBalanceGameInput,
    );
  }

  @Delete(':commentId/family/comment')
  deleteFamilyComment(
    @AuthUser() user: UserId,
    @Param('commentId') commentId: number,
  ): Promise<BaseOutput> {
    return this.balanceGameService.deleteFamilyComment(user, commentId);
  }
}
