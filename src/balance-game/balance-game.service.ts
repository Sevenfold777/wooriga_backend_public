import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Status } from 'src/common/entities/comment.entity';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { NotificationService } from 'src/notification/notification.service';
import { User } from 'src/users/entities/user.entity';
import { DataSource, Not, Repository } from 'typeorm';
import {
  BalanceGameFamilyOutput,
  BalanceGameOutput,
} from './dtos/balance-game.dto';
import { CommentBalanceGameInput } from './dtos/comment-balance-game.dto';
import { BalanceChoice } from './entities/balance-choice.entity';
import { BalanceGameComment } from './entities/balance-game-comment.entity';
import { BalanceGameFamilyComment } from './entities/balance-game-family-comment.entity';
import { BalanceGame } from './entities/balance-game.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class BalanceGameService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @InjectRepository(BalanceGame)
    private gameRepository: Repository<BalanceGame>,
    @InjectRepository(BalanceChoice)
    private choiceRepository: Repository<BalanceChoice>,
    @InjectRepository(BalanceGameComment)
    private commentRepository: Repository<BalanceGameComment>,
    @InjectRepository(BalanceGameFamilyComment)
    private familyCommentRepository: Repository<BalanceGameFamilyComment>,
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async findBalanceGames(
    { userId }: UserId,
    prev: number,
  ): Promise<BalanceGameOutput[]> {
    const take = 20;

    const rawGame = await this.dataSource.query(`
      select G.id, G.createdAt, G.updatedAt, G.question, G.choiceA, G.choiceB, G.commentDecorator, C.id as isAnswered 
      from balance_game as G
      left outer join (select * from balance_choice where userId = ${userId}) as C on G.id = C.balanceGameId
      order by id desc
      limit ${take} offset ${take * prev};
    `);

    return rawGame.map((game) => {
      return {
        id: game.id,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        question: game.question,
        choiceA: game.choiceA,
        choiceB: game.choiceB,
        isAnswered: Boolean(game.isAnswered),
        commentDecorator: game.commentDecorator,
      };
    });
  }

  async findGamesRecommended({ userId }: UserId): Promise<BalanceGame[]> {
    const take = 20;

    const rawGame = await this.dataSource.query(`
      select * from balance_game
      where balance_game.id 
        not in (select balanceGameId as gameId from balance_choice
            inner join user on balance_choice.userId = user.id
            where user.id = ${userId})
      order by rand()
      limit ${take};
    `);

    if (rawGame.length === 0) {
      const latestGame = await this.gameRepository.find({
        order: { createdAt: 'desc' },
        take,
      });

      return latestGame;
    }

    return rawGame;
  }

  async findBalanceGameFamily(
    user: UserId,
    id: number,
  ): Promise<BalanceGameFamilyOutput> {
    const game = await this.gameRepository.findOne({ where: { id } });
    const familyChoices = await this.findFamilyChoices(user, id);

    return {
      ...game,
      choices: familyChoices,
    };
  }

  findBalanceGame(id: number): Promise<BalanceGame> {
    return this.gameRepository.findOne({
      where: { id },
      relations: { choices: { user: true } },
    });
  }

  findChoices(id: number): Promise<BalanceChoice[]> {
    return this.choiceRepository.find({
      where: { balanceGame: { id } },
    });
  }

  async findFamilyChoices(
    { familyId }: UserId,
    id: number,
  ): Promise<
    {
      userId: number;
      userName: string;
      choiceId: number | null;
      payload: string | null;
    }[]
  > {
    const familyChoices = await this.dataSource
      .query(`with gameChoice as (select * from balance_choice where balanceGameId = ${id})
              select user_active.id as userId, user_active.userName, gameChoice.id as choiceId, payload 
              from (select * from user where user.status = "active") as user_active
              left outer join gameChoice on user_active.id = gameChoice.userId
              where user_active.familyId = ${familyId};`);

    return familyChoices;
  }

  async choiceSelection(
    { userId }: UserId,
    id: number,
    choice: string,
  ): Promise<BaseOutput> {
    // check if present
    // const isPresent = await this.choiceRepository.findOne({
    //   where: { user: { id: userId }, balanceGame: { id } },
    // });

    const choiceCreated = this.choiceRepository.create({
      user: { id: userId },
      balanceGame: { id },
      payload: choice,
    });

    try {
      await this.choiceRepository.save(choiceCreated);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true };
  }

  async changeSelection(
    { userId }: UserId,
    id: number,
    choice: string,
  ): Promise<BaseOutput> {
    const result = await this.choiceRepository.update(
      {
        balanceGame: { id },
        user: { id: userId },
      },
      { payload: choice },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Choice not found.' };
    }
    return { ok: true };
  }

  async deleteSelection({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.choiceRepository.delete({
      balanceGame: { id },
      user: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: 'Choice not found.' };
    }
    return { ok: true };
  }

  async commentGame(
    { userId }: UserId,
    id: number,
    { payload }: CommentBalanceGameInput,
  ): Promise<BaseOutput> {
    // create comment
    const comment = this.commentRepository.create({
      payload,
      author: { id: userId },
      balanceGame: { id },
    });

    try {
      await this.commentRepository.save(comment);
    } catch (e) {
      return { ok: false, error: "Couldn't create the comment." };
    }

    return { ok: true };
  }
  async deleteComment(
    { userId }: UserId,
    commentId: number,
  ): Promise<BaseOutput> {
    // const result = await this.commentRepository.delete({
    //   id: commentId,
    //   author: { id: userId },
    // });

    const result = await this.commentRepository.update(
      {
        id: commentId,
        author: { id: userId },
      },
      { status: Status.DELETED },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Comment Not found.' };
    }

    return { ok: true };
  }

  findComments(id: number, prev: number): Promise<BalanceGameComment[]> {
    const take = 20;

    return this.commentRepository.find({
      where: { balanceGame: { id }, status: Status.ACTIVE },
      take,
      skip: take * prev,
      order: { createdAt: 'desc' },
    });
  }

  async commentGameFamily(
    { userId, familyId }: UserId,
    id: number,
    { payload }: CommentBalanceGameInput,
  ): Promise<BaseOutput> {
    // create comment
    const comment = this.familyCommentRepository.create({
      payload,
      author: { id: userId },
      balanceGame: { id },
      familyId,
    });

    try {
      await this.familyCommentRepository.save(comment);
    } catch (e) {
      return { ok: false, error: "Couldn't create the comment." };
    }

    const familyMembers = await this.userRepository.find({
      select: ['fcmToken', 'id'],
      where: {
        status: Status.ACTIVE,
        family: { id: familyId },
        id: Not(userId),
        fcmToken: Not(''),
      },
    });

    return { ok: true };
  }

  async deleteFamilyComment(
    { userId, familyId }: UserId,
    commentId: number,
  ): Promise<BaseOutput> {
    // const result = await this.familyCommentRepository.delete({
    //   id: commentId,
    //   familyId,
    //   author: { id: userId },
    // });

    const result = await this.familyCommentRepository.update(
      {
        id: commentId,
        familyId,
        author: { id: userId },
      },
      { status: Status.DELETED },
    );

    if (result.affected === 0) {
      return { ok: false, error: 'Comment Not found.' };
    }

    return { ok: true };
  }

  findFamilyComments(
    { userId, familyId }: UserId,
    id: number,
    prev: number,
  ): Promise<BalanceGameFamilyComment[]> {
    const take = 20;

    return this.familyCommentRepository.find({
      where: { balanceGame: { id }, familyId, status: Status.ACTIVE },
      take,
      skip: take * prev,
      order: { createdAt: 'desc' },
    });
  }
}
