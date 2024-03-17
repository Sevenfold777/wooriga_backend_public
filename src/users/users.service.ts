import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService, TOKEN_TYPE } from 'src/auth/auth.service';
import { In, Repository } from 'typeorm';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { DeleteUserOuput } from './dtos/delete-user.dto';
import {
  LoginTokenInput,
  LoginUserInput,
  LoginUserOutput,
} from './dtos/login-user.dto';
import { EditUserInput, EditUserOutput } from './dtos/edit-user.dto';
import { AuthProvider, User } from './entities/user.entity';
import { FamilyService } from 'src/family/family.service';
import { FamilyPediaService } from 'src/family-pedia/family-pedia.service';
import { UserAuth } from './entities/user-auth.entity';
import { RefreshTokenInput } from './dtos/refresh-token.dto';
import { Status } from 'src/common/entities/comment.entity';
import { PhotosService } from 'src/photos/photos.service';
import { DailyEmotion } from 'src/emotions/entities/emotion.entity';
import { PhotoLike } from 'src/photos/entities/photo-like.entity';
import { MessageMetoo } from 'src/messages/entities/message-metoo.entity';
import { MessageFamilyMetoo } from 'src/messages/entities/message-family-metoo.entity';
import { PhotoCommentLike } from 'src/photos/entities/photo-comment-like.entity';
import { MessageCommentLike } from 'src/messages/entities/message-comment-like.entity';
import { MessageFamilyCommentLike } from 'src/messages/entities/message-family-comment-like.entity';
import { FamilyPedia } from 'src/family-pedia/entities/family-pedia.entity';
import { BalanceChoice } from 'src/balance-game/entities/balance-choice.entity';
import { Photo } from 'src/photos/entities/photo.entity';
import { UploadsService } from 'src/uploads/uploads.service';
import { BalanceGameComment } from 'src/balance-game/entities/balance-game-comment.entity';
import { BalanceGameFamilyComment } from 'src/balance-game/entities/balance-game-family-comment.entity';
import { PhotoComment } from 'src/photos/entities/photo-comment.entity';
import { MessageComment } from 'src/messages/entities/message-comment.entity';
import { MessageFamilyComment } from 'src/messages/entities/message-family-comment.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Photo) private photoRepository: Repository<Photo>,
    @InjectRepository(UserAuth)
    private userAuthRespository: Repository<UserAuth>,
    private readonly authService: AuthService,
    private readonly familyService: FamilyService,
    private readonly familyPediaService: FamilyPediaService,
    private readonly uploadService: UploadsService,
    // for hard delete
    @InjectRepository(MessageFamilyCommentLike)
    private messageFamCommentLikeRepository: Repository<MessageFamilyCommentLike>,
    @InjectRepository(MessageCommentLike)
    private messageCommentLikeRepository: Repository<MessageCommentLike>,
    @InjectRepository(PhotoCommentLike)
    private photoCommentLikeRepository: Repository<PhotoCommentLike>,
    @InjectRepository(PhotoLike)
    private photoLikeRepository: Repository<PhotoLike>,
    @InjectRepository(MessageMetoo)
    private messageMetooRepository: Repository<MessageMetoo>,
    @InjectRepository(MessageFamilyMetoo)
    private messageFamMetooRepository: Repository<MessageFamilyMetoo>,
    @InjectRepository(FamilyPedia)
    private familyPediaRepository: Repository<FamilyPedia>,
    @InjectRepository(BalanceChoice)
    private balanceChoiceRepository: Repository<BalanceChoice>,
    @InjectRepository(DailyEmotion)
    private emotionRepository: Repository<DailyEmotion>,
    // for soft delete
    @InjectRepository(BalanceGameComment)
    private balanceCommentRepository: Repository<BalanceGameComment>,
    @InjectRepository(BalanceGameFamilyComment)
    private balanceFamilyCommentRepository: Repository<BalanceGameFamilyComment>,
    @InjectRepository(PhotoComment)
    private photoCommentRepository: Repository<PhotoComment>,
    @InjectRepository(MessageComment)
    private messageCommentRepository: Repository<MessageComment>,
    @InjectRepository(MessageFamilyComment)
    private messageFamCommentRepository: Repository<MessageFamilyComment>,
  ) {}

  /** createUser */
  async createUser({
    email,
    birthday,
    position,
    familyToken,
    userName,
    provider,
    mktPushAgreed,
    token,
    nonce,
    isBirthLunar,
  }: CreateUserInput): Promise<CreateUserOutput> {
    let familyToJoin: number;
    const birthdayString = `${birthday.slice(0, 4)}-${birthday.slice(
      4,
      6,
    )}-${birthday.slice(6)}`;

    if (familyToken) {
      try {
        /** verify familyToken */
        const tokenVerified = await this.authService.decrypt({
          target: familyToken,
        });

        familyToJoin = parseInt(tokenVerified);
      } catch (e) {
        return { ok: false, error: 'Invalid Family token' };
      }
    }

    // 0. token verify
    let authInfo: { email: string; id?: string };
    switch (provider) {
      case AuthProvider.KAKAO:
        authInfo = await this.authService.kakaoLogin(token);
        break;

      case AuthProvider.NAVER:
        authInfo = await this.authService.naverLogin(token);
        break;

      case AuthProvider.APPLE:
        authInfo = await this.authService.appleLogin(token, nonce);
        break;

      default:
        break;
    }

    // 1-1. create UserEntity
    const user = this.userRepository.create({
      email,
      userName,
      birthday: new Date(birthdayString),
      isBirthLunar,
      provider,
      position,
      mktPushAgreed,
      ...(familyToJoin && { family: { id: familyToJoin } }),
    }); // create new User instance

    try {
      const newUser = await this.userRepository.save(user); // save DB

      // 1-2. createUserAuth
      const userAuth = new UserAuth();
      userAuth.user = newUser;
      if (authInfo.id) {
        userAuth.providerId = authInfo.id;
      }

      await this.userAuthRespository.save(userAuth);

      /** 가족 join 아니면, 새로운 가족 만들기 */
      if (!familyToJoin) {
        await this.familyService.createFamily(newUser?.id);
      }

      await this.familyPediaService.createFamilyPedia({ ownerId: newUser?.id });

      return { ok: true, user: newUser };
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }
  }

  /** deleteUser */
  async deleteUser({ userId }: UserId): Promise<DeleteUserOuput> {
    // const result = await this.userRepository.delete({ id });

    // 탈퇴는 빈번히 일어나지 않기에 한 번에 큰 join을 하는 것이 낫다고 판단
    // (그렇지 않으면 매번 get 요청 시 user join을 추가해야)
    const userDetail = await this.userRepository.findOne({
      where: { id: userId, status: Status.ACTIVE },
      relations: {
        photos: { files: true },
      },
    });

    // HARD DELETE
    try {
      // 1. delete PHOTO created - also hard-deletes photo-comments
      const fileUrls = [];
      userDetail.photos.forEach((photo) =>
        photo.files.forEach((file) => fileUrls.push(file.url)),
      );

      await this.photoRepository.delete({
        id: In(userDetail.photos.map((photo) => photo.id)),
      });

      // delete from S3
      await this.uploadService.deletePhotos(fileUrls);

      // 2. messageFamCommentLike
      await this.messageFamCommentLikeRepository.delete({
        user: { id: userId },
      });
      // await this.messageFamCommentLikeRepository.delete({
      //   id: In(userDetail.likeMessageFamComments.map((like) => like.id)),
      // });

      // 3. messageCommentLike
      await this.messageCommentLikeRepository.delete({
        user: { id: userId },
      });
      // await this.messageCommentLikeRepository.delete({
      //   id: In(userDetail.likeMessageComments.map((like) => like.id)),
      // });

      // 4. photoCommentLike
      await this.photoCommentLikeRepository.delete({
        user: { id: userId },
      });
      // await this.photoCommentLikeRepository.delete({
      //   id: In(userDetail.likePhotoComments.map((like) => like.id)),
      // });

      // 5. photoLike
      await this.photoLikeRepository.delete({
        user: { id: userId },
      });
      // await this.photoLikeRepository.delete({
      //   id: In(userDetail.likePhotos.map((like) => like.id)),
      // });

      // 6. messageMetoo
      await this.messageMetooRepository.delete({
        user: { id: userId },
      });
      // await this.messageMetooRepository.delete({
      //   id: In(userDetail.messageMetoo.map((metoo) => metoo.id)),
      // });

      // 7. messageFamMetoo
      await this.messageFamMetooRepository.delete({
        user: { id: userId },
      });
      // await this.messageFamMetooRepository.delete({
      //   id: In(userDetail.messageFamilyMetoo.map((metoo) => metoo.id)),
      // });

      // 8. familyPedia
      const familyPedia = await this.familyPediaRepository.findOne({
        where: { owner: { id: userId } },
      });
      console.log(familyPedia);

      if (
        familyPedia.profilePhoto !==
        'https://wooriga-prod.s3.ap-northeast-2.amazonaws.com/familyPedia/default.jpeg'
      ) {
        await this.uploadService.deletePhotos([familyPedia.profilePhoto]);
      }
      await this.familyPediaRepository.delete({ owner: { id: userId } });

      // // 9. balanceChoice
      await this.balanceChoiceRepository.delete({
        user: { id: userId },
      });
      // await this.balanceChoiceRepository.delete({
      //   id: In(userDetail.balanceChoices.map((choice) => choice.id)),
      // });

      // 10. Emotions Repo
      await this.emotionRepository.delete({
        user: { id: userId },
      });
      // await this.emotionRepository.delete({
      //   id: In(userDetail.dailyEmotions.map((emotion) => emotion.id)),
      // });
    } catch (e) {
      console.warn(e);
      return { ok: false, error: e.message };
    }

    // 2. soft delete
    try {
      await this.balanceCommentRepository.update(
        { author: { id: userId } },
        { status: Status.DELETED },
      );

      await this.balanceFamilyCommentRepository.update(
        { author: { id: userId } },
        { status: Status.DELETED },
      );

      await this.photoCommentRepository.update(
        { author: { id: userId } },
        { status: Status.DELETED },
      );

      await this.messageCommentRepository.update(
        { author: { id: userId } },
        { status: Status.DELETED },
      );

      await this.messageFamCommentRepository.update(
        { author: { id: userId } },
        { status: Status.DELETED },
      );
    } catch (e) {
      console.warn(e);

      return {
        ok: false,
        error: e.message,
      };
    }
    // delete user
    const result = await this.userRepository.update(
      { id: userId },
      { status: Status.DELETED },
    );

    if (result.affected === 0) {
      return { ok: false, error: "Couldn't Delete the User." };
    }

    return { ok: true };
  }

  /** editUser */
  async editUser(
    { userId }: UserId,
    editUserInput: EditUserInput,
  ): Promise<EditUserOutput> {
    let birthdayString: string;

    if (editUserInput.birthday) {
      birthdayString = `${editUserInput.birthday.slice(
        0,
        4,
      )}-${editUserInput.birthday.slice(4, 6)}-${editUserInput.birthday.slice(
        6,
      )}`;
    }

    console.log('birthday: ', editUserInput.birthday);
    console.log('birthdayString: ', birthdayString);
    console.log('new Date(birthdayString): ', new Date(birthdayString));

    const result = await this.userRepository.update(
      { id: userId },
      {
        ...editUserInput,
        ...(editUserInput.birthday && {
          birthday: new Date(birthdayString),
        }),
      },
    );

    // user not found
    if (result.affected === 0) {
      return { ok: false, error: "Couldn't find the User" };
    }

    return { ok: true };
  }

  /** myProfile */
  async myProfile({ userId }: UserId): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, status: Status.ACTIVE },
      relations: { family: true },
    });

    return user;
  }

  /** social login */
  async socialLogin(
    socialLoginInput: LoginUserInput,
  ): Promise<LoginUserOutput> {
    // 1. check if user with current email exists
    const user = await this.userRepository.findOne({
      where: { email: socialLoginInput.email },
      relations: { family: true },
    });

    // 2. if not exist: create User
    if (!user) {
      return { ok: false, signUpRequired: true };
    } else if (user.status !== Status.ACTIVE) {
      return { ok: false, signUpRequired: false, error: 'INACTIVE ID' };
    } else {
      const accessToken = this.authService.sign({
        userId: user.id,
        familyId: user.family.id,
        tokenType: TOKEN_TYPE.ACCESS,
      });

      const refreshToken = this.authService.sign({
        userId: user.id,
        familyId: user.family.id,
        tokenType: TOKEN_TYPE.REFRESH,
      });

      const refreshTokenUpdate = await this.userAuthRespository.update(
        { user: { id: user.id } },
        { refreshToken },
      );

      if (refreshTokenUpdate.affected === 0) {
        if (socialLoginInput.isSignUp) {
          return { ok: true, accessToken, refreshToken };
        }

        return { ok: false, error: 'Refresh Token Update Failed' };
      }

      return { ok: true, accessToken, refreshToken };
    }
  }

  async login({
    token,
    nonce,
    provider,
    isSignUp,
  }: LoginTokenInput): Promise<LoginUserOutput> {
    console.log({
      token,
      nonce,
      provider,
      isSignUp,
    });

    // 0. verify token
    let authInfo: { email: string; id?: string };
    switch (provider) {
      case AuthProvider.KAKAO:
        authInfo = await this.authService.kakaoLogin(token);
        break;

      case AuthProvider.NAVER:
        authInfo = await this.authService.naverLogin(token);
        break;

      case AuthProvider.APPLE:
        authInfo = await this.authService.appleLogin(token, nonce);
        break;

      default:
        break;
    }

    console.log(authInfo);

    // 1. check if user with current email exists
    const user = await this.userRepository.findOne({
      where: { email: authInfo.email },
      relations: { family: true },
    });

    console.log(user);

    // 2. if not exist: create User
    if (!user) {
      return { ok: false, signUpRequired: true };
    } else if (user.status !== Status.ACTIVE) {
      return { ok: false, signUpRequired: false, error: 'INACTIVE ID' };
    } else {
      const accessToken = this.authService.sign({
        userId: user.id,
        familyId: user.family.id,
        tokenType: TOKEN_TYPE.ACCESS,
      });

      const refreshToken = this.authService.sign({
        userId: user.id,
        familyId: user.family.id,
        tokenType: TOKEN_TYPE.REFRESH,
      });

      const refreshTokenUpdate = await this.userAuthRespository.update(
        { user: { id: user.id } },
        { refreshToken, ...(authInfo.id && { providerId: authInfo.id }) },
      );

      if (refreshTokenUpdate.affected === 0) {
        if (isSignUp) {
          return { ok: true, accessToken, refreshToken };
        }

        return { ok: false, error: 'Refresh Token Update Failed' };
      }

      return { ok: true, accessToken, refreshToken };
    }
  }

  async refreshToken({
    refreshToken,
  }: RefreshTokenInput): Promise<LoginUserOutput> {
    const tokenVerified = this.authService.verify(refreshToken);
    const userId = tokenVerified.userId;
    const familyId = tokenVerified.familyId;

    const userAuth = await this.userAuthRespository.findOne({
      where: { user: { id: userId, status: Status.ACTIVE } },
    });

    if (userAuth.refreshToken !== refreshToken) {
      return { ok: false, error: 'Invalid Refresh Token' };
    }

    const newAccessToken = this.authService.sign({
      userId,
      familyId,
      tokenType: TOKEN_TYPE.ACCESS,
    });

    const newRefreshToken = this.authService.sign({
      userId,
      familyId,
      tokenType: TOKEN_TYPE.REFRESH,
    });

    if (!newAccessToken || !refreshToken) {
      return { ok: false, error: "Couldn't get access / refresh token" };
    }

    const refreshTokenUpdate = await this.userAuthRespository.update(
      { user: { id: userId, status: Status.ACTIVE } },
      { refreshToken: newRefreshToken },
    );
    if (refreshTokenUpdate.affected === 0) {
      return { ok: false, error: 'Refresh Token Update Failed' };
    }

    return {
      ok: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
