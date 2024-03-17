import { Injectable, UploadedFiles } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { Not, Repository } from 'typeorm';
import { CreateFamilyPediaInput } from './dtos/create-family-pedia.dto';
import { CreateRowInput } from './dtos/create-row.dto';
import { EditRowInput } from './dtos/edit-row.dto';
import { FamilyPediaRow } from './entities/family-pedia-row.entity';
import { FamilyPedia } from './entities/family-pedia.entity';
import * as sharp from 'sharp';
import axios from 'axios';
import { NotificationService } from 'src/notification/notification.service';
import { UploadsService } from 'src/uploads/uploads.service';
import { EditPediaPhotoOutput } from './dtos/edit-family-pedia.dto';
import { ROUTE_NAME } from 'src/common/navigation-route';
import { Status } from 'src/common/entities/comment.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class FamilyPediaService {
  constructor(
    @InjectRepository(FamilyPedia)
    private familyPediaRepository: Repository<FamilyPedia>,
    @InjectRepository(FamilyPediaRow)
    private rowRepository: Repository<FamilyPediaRow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
    private readonly uploadService: UploadsService,
  ) {}

  /** 1. create FamilyPedia: signup 시, 자동으로 돼야함 */
  async createFamilyPedia({
    ownerId,
  }: CreateFamilyPediaInput): Promise<BaseOutput> {
    const defaultRows = [
      '가장 좋아하는 음식',
      '어릴 적 꿈',
      '여행가고 싶은 나라',
      '가장 행복했던 일',
      '해보고 싶은 것',
    ];

    const familyPedia = this.familyPediaRepository.create({
      owner: { id: ownerId },
    });

    try {
      await this.familyPediaRepository.save(familyPedia); // save DB

      for (const row of defaultRows) {
        const newRow = this.rowRepository.create({
          tag: row,
          payload: '', // empty payload
          lastEditor: 1, // editor: 1 ==> admin
          familyPedia: { id: familyPedia.id },
        });

        // insert가 너무 여러번 호출되지 않나
        await this.rowRepository.save(newRow);
      }

      return { ok: true };
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }
  }

  async createFamilyPediaRows(
    { userId, familyId }: UserId,
    id: number,
    rows: CreateRowInput[],
  ): Promise<BaseOutput> {
    try {
      for (const row of rows) {
        const newRow = this.rowRepository.create({
          tag: row.tag,
          payload: row.payload,
          lastEditor: userId,
          familyPedia: { id },
        });

        // insert가 너무 여러번 호출되지 않나
        await this.rowRepository.save(newRow);
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

      const target = await this.familyPediaRepository.findOne({
        where: { id },
        relations: { owner: true },
      });

      await this.notificationService.sendNotification({
        tokens: familyMembers.map((user) => user.fcmToken),
        title: '우리가 인물사전',
        body: `${target.owner.userName}님의 인물 사전에 새로운 항목이 추가되었습니다!`,
        screen: ROUTE_NAME.FAMILYPEDIA_MEMBER,
        param: { pediaId: id },
        senderId: userId,
        receiversId: familyMembers.map((user) => user.id),
      });

      return { ok: true };
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }
  }

  async editFamilyPediaRows(
    { userId, familyId }: UserId,
    id: number,
    rows: EditRowInput[],
  ): Promise<BaseOutput> {
    try {
      for (const row of rows) {
        await this.rowRepository.update(
          {
            id: row.id,
            familyPedia: { id, owner: { family: { id: familyId } } },
          },
          {
            ...(row.payload && { payload: row.payload }),
            lastEditor: userId,
          },
        );
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

      const target = await this.familyPediaRepository.findOne({
        where: { id },
        relations: { owner: true },
      });

      await this.notificationService.sendNotification({
        tokens: familyMembers.map((user) => user.fcmToken),
        title: '우리가 인물사전',
        body: `${target.owner.userName}님의 인물 사전이 수정되었습니다!`,
        screen: ROUTE_NAME.FAMILYPEDIA_MEMBER,
        param: { pediaId: id },
        senderId: userId,
        receiversId: familyMembers.map((user) => user.id),
      });

      return { ok: true };
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }
  }

  async deleteFamilyPediaRows(
    { familyId }: UserId,
    id: number,
    rows: { id: number }[],
  ): Promise<BaseOutput> {
    try {
      for (const row of rows) {
        await this.rowRepository.delete({
          id: row.id,
          familyPedia: { id, owner: { family: { id: familyId } } },
        });
      }

      return { ok: true };
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }
  }

  findAll({ familyId }: UserId): Promise<FamilyPedia[]> {
    return this.familyPediaRepository.find({
      where: { owner: { family: { id: familyId } } },
      relations: { owner: true },
    });
  }

  findOne(id: number): Promise<FamilyPedia> {
    return this.familyPediaRepository.findOne({
      where: { id },
      relations: { owner: true, rows: true },
    });
  }

  async editProfilePhoto(
    { userId, familyId }: UserId,
    id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<EditPediaPhotoOutput> {
    const target = await this.familyPediaRepository.findOne({
      where: { id },
      relations: { owner: true },
    });

    const prevPhoto = target.profilePhoto;

    const S3DirName = 'familyPedia';

    // 1. upload photo
    const urls = await this.uploadService.uploadPhotos(
      userId,
      S3DirName,
      files,
    );

    if (urls.length === 0) {
      return { ok: false, error: 'Upload Error.' };
    }

    const imageBuffer = (
      await axios({ url: urls[0], responseType: 'arraybuffer' })
    ).data as Buffer;

    const metadata = await sharp(imageBuffer).metadata();

    const result = await this.familyPediaRepository.update(
      { id },
      {
        ...(metadata && {
          profileWidth: metadata.width,
          profileHeight: metadata.height,
        }),
        profilePhoto: urls[0],
      },
    );

    // user not found
    if (result.affected === 0) {
      return { ok: false, error: "Couldn't update the Pedia Photo." };
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

    await this.notificationService.sendNotification({
      tokens: familyMembers.map((user) => user.fcmToken),
      title: '우리가 인물사전',
      body: `${target.owner.userName}님의 인물 사전이 수정되었습니다!`,
      screen: ROUTE_NAME.FAMILYPEDIA_MEMBER,
      param: { pediaId: id },
      senderId: userId,
      receiversId: familyMembers.map((user) => user.id),
    });

    if (
      prevPhoto !==
      'https://wooriga-prod.s3.ap-northeast-2.amazonaws.com/familyPedia/default.jpeg'
    ) {
      await this.uploadService.deletePhotos([prevPhoto]);
    }

    return { ok: true, profilePhoto: urls[0] };
  }

  // @ROW와 관련된 Services
  async createRow(
    { userId }: UserId,
    id: number,
    createRowInput: CreateRowInput,
  ): Promise<BaseOutput> {
    const newRow = this.rowRepository.create({
      ...createRowInput,
      lastEditor: userId,
      familyPedia: { id },
    });

    try {
      await this.rowRepository.save(newRow); // save DB

      return { ok: true };
    } catch (e) {
      // if error
      return { ok: false, error: e.code }; // ER_DUP_ENTRY === 중복 entry 존재
    }
  }

  async deleteRow(id: number, { userId }: UserId) {
    /////// 누가 해당 row를 삭제할 수 있게 할 지 권한 논의 필요함
    const result = await this.rowRepository.delete({ id });

    if (result.affected === 0) {
      return { ok: false, error: "Couldn't Delete the Row." };
    }

    return { ok: true };
  }

  async editRow(id: number, { userId }: UserId, editRowInput: EditRowInput) {
    const result = await this.rowRepository.update(
      { id },
      { ...editRowInput, lastEditor: userId },
    );

    // user not found
    if (result.affected === 0) {
      return { ok: false, error: "Couldn't edit the Row" };
    }

    return { ok: true };
  }

  async findAllRows(pediaId: number): Promise<FamilyPediaRow[]> {
    const familyPedia = await this.familyPediaRepository.findOne({
      where: { id: pediaId },
    });

    return familyPedia.rows;
  }
}
