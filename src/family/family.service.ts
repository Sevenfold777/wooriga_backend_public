import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService, TOKEN_TYPE } from 'src/auth/auth.service';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { Status } from 'src/common/entities/comment.entity';
import { MessageFamily } from 'src/messages/entities/message-family.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import { User } from 'src/users/entities/user.entity';
import { Not, Repository } from 'typeorm';
import { DeleteFamilyOutput } from './dtos/delete-family.dto';
import { InviteFamilyOutput } from './dtos/invite-family.dto';
import { Family } from './entities/familiy.entity';
import { UserId } from 'src/auth/auth-user.decorator';
import { UserAuth } from 'src/users/entities/user-auth.entity';
import { LoginUserOutput } from 'src/users/dtos/login-user.dto';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family) private familyRepository: Repository<Family>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserAuth)
    private userAuthRepository: Repository<UserAuth>,
    @InjectRepository(MessageFamily)
    private messageRepository: Repository<MessageFamily>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    private readonly authService: AuthService,
  ) {}

  /** createFamily */
  async createFamily(userId: number): Promise<BaseOutput> {
    const family = this.familyRepository.create({ users: [{ id: userId }] });

    try {
      const newFam = await this.familyRepository.save(family);

      // family 만들기 성공 --> default message set
      const defaultMsg = this.messageRepository.create({
        family: { id: newFam.id },
        message: { id: 100000 }, // 추후에 바꿔야
        receiveDate: new Date(),
        sender: { id: 4 },
      }); // admin

      await this.messageRepository.save(defaultMsg);
    } catch (e) {
      return { ok: false, error: e.code };
    }

    return { ok: true };
  }

  /** myFamily: without me */
  async myFamily(
    { userId, familyId }: UserId,
    exceptMe: boolean,
  ): Promise<Family> {
    const family = await this.familyRepository.findOne({
      where: {
        id: familyId,
      },
      relations: { users: true },
    });

    const members = family.users.filter((user) =>
      exceptMe
        ? user.id !== userId && user.status === Status.ACTIVE
        : user.status === Status.ACTIVE,
    );

    return {
      id: family.id,
      createdAt: family.createdAt,
      updatedAt: family.updatedAt,
      users: members,
      messageFamily: [], // for type restriction (dummy)
      photos: [], // for type restriction (dummy)
    };
  }

  /** joinFamliy */
  async joinFamily(
    { userId, familyId: familyToBeMerged }: UserId,
    familyToken: string,
  ): Promise<LoginUserOutput> {
    try {
      const tokenVerified = await this.authService.decrypt({
        target: familyToken,
      });

      const familyToJoin = parseInt(tokenVerified);

      if (familyToJoin === familyToBeMerged) {
        return {
          ok: false,
          error: 'Already in the same family.',
        };
      }

      const currentFamilyUsers = await this.familyRepository.findOne({
        where: { id: familyToBeMerged },
        relations: { users: true },
        select: ['users'],
      });

      // 1. change current logged in user's familyId
      const userUpdate = await this.userRepository.update(
        { id: userId },
        { family: { id: familyToJoin } },
      );

      if (userUpdate.affected === 0) {
        return { ok: false, error: 'Family Join failed.' };
      }

      const accessToken = this.authService.sign({
        userId,
        familyId: familyToJoin,
        tokenType: TOKEN_TYPE.ACCESS,
      });

      const refreshToken = this.authService.sign({
        userId,
        familyId: familyToJoin,
        tokenType: TOKEN_TYPE.REFRESH,
      });

      const refreshTokenUpdate = await this.userAuthRepository.update(
        { user: { id: userId } },
        { refreshToken },
      );

      if (refreshTokenUpdate.affected === 0) {
        return { ok: false, error: 'Refresh Token Update Failed' };
      }

      // if the last member to leave the family
      if (currentFamilyUsers?.users.length === 1) {
        // 2. update photos
        await this.photoRepository.delete(
          {
            family: { id: familyToBeMerged },
          },
          // { family: { id: familyToJoin } },
        );

        // 3. delete messageFamilies
        await this.messageRepository.delete(
          {
            family: { id: familyToBeMerged },
          },
          // { family: { id: familyToJoin } },
        );

        // 3. delete family with no user
        const deleteFamily = await this.familyRepository.delete({
          id: familyToBeMerged,
        });

        if (deleteFamily.affected === 0) {
          return { ok: false, error: 'Fail to delete Family to be mergered.' };
        }
      }

      /** 22. 10. 13. */
      /** raw sql로 구현하자. family entity와 oneToMany로
       * 연결된 3개의 entity: messageFamily, user, photo의
       * familyId = familyToBeMerged인 entities의
       * familyId = familyToJoin으로
       */

      return { ok: true, accessToken, refreshToken };
    } catch (e) {
      return { ok: false, error: 'Invalid Family.' };
    }
  }

  /** invite Family */
  async inviteFamily({ familyId }: UserId): Promise<InviteFamilyOutput> {
    // const token = this.authService.sign(familyId);
    const token = await this.authService.encrypt({ target: String(familyId) });

    return { ok: true, token };
  }
}
