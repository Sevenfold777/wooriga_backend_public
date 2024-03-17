import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

export enum ReportTarget {
  MESSAGE_PUBLIC = 'message',
  MESSAGE_FAMILY = 'messageFamily',
  MESSAGE_PUBLIC_COMMENT = 'messageComment',
  MESSAGE_FAMILY_COMMENT = 'messageFamilyComment',
  BALANCE_GAME_COMMENT = 'balanceGameComment',
  PHOTO = 'photo',
  PHOTO_COMMENT = 'photoComment',
}

export enum ReportType {
  PRIVACY = '개인정보 유출',
  ABNORMAL = '부적절 메세지 (폭력, 비속어, 음란 등)',
  SPAM = '허위 사실 유포 또는 도배',
  OFFENSIVE = '불쾌감 또는 혐오감 유발',
  DISTURB = '서비스 이용 방해',
  INFRIDGE = '권리 침해 또는 창작물 무단 유포',
  ETC = '기타',
}

@Entity()
export class CommunityReport extends BaseEntity {
  @Column()
  targetType: ReportTarget; // 신고 대상 타입

  @Column()
  targetId: number; // 신고 대상 id

  @Column()
  reportType: ReportType; // 신고 사유

  @Column({ nullable: true })
  payload: string; // 세부 사유

  @Column({ default: false })
  isReplied: boolean; // 신고 결과 심사 여부

  @Column({ nullable: true })
  reply?: boolean; // 신고 결과 (null, false, true)

  @Column({ nullable: true })
  replyDate?: Date; // 신고 심사 날짜

  @ManyToOne(() => User, { createForeignKeyConstraints: false })
  reporter: User; // 신고자

  //   @ManyToOne(() => User, (user) => user.reported)
  //   reported: User;
}
