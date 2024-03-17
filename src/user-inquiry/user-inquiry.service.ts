import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseOutput } from 'src/common/dtos/base-output.dto';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserInquiryInput } from './dtos/create-user-inquiry.dto';
import { EditUserInquiryInput } from './dtos/edit-user-inquiry.dto';
import { UserInquiry } from './entities/user-inquiry.entity';
import { UserId } from 'src/auth/auth-user.decorator';

@Injectable()
export class UserInquiryService {
  constructor(
    @InjectRepository(UserInquiry)
    private inquryRepository: Repository<UserInquiry>,
  ) {}

  async createInquiry(
    { userId }: UserId,
    createInquiryInput: CreateUserInquiryInput,
  ): Promise<BaseOutput> {
    const inquiry = this.inquryRepository.create({
      ...createInquiryInput,
      author: { id: userId },
    });

    try {
      await this.inquryRepository.save(inquiry);
    } catch (e) {
      return { ok: false, error: e.message };
    }

    return { ok: true };
  }

  async deleteInquiry({ userId }: UserId, id: number): Promise<BaseOutput> {
    const result = await this.inquryRepository.delete({
      id,
      author: { id: userId },
    });

    if (result.affected === 0) {
      return { ok: false, error: "Couldn't delete inquriry." };
    }

    return { ok: true };
  }

  async editInquiry(
    { userId }: UserId,
    id: number,
    editInquiryIput: EditUserInquiryInput,
  ): Promise<BaseOutput> {
    const result = await this.inquryRepository.update(
      {
        id,
        author: { id: userId },
      },
      editInquiryIput,
    );

    if (result.affected === 0) {
      return { ok: false, error: "Couldn't update inquriry." };
    }

    return { ok: true };
  }

  findInquiry({ userId }: UserId, id: number): Promise<UserInquiry> {
    return this.inquryRepository.findOne({
      where: { id, author: { id: userId } },
    });
  }

  async findMyInquiries(
    { userId }: UserId,
    prev: number,
  ): Promise<UserInquiry[]> {
    const take = 20;

    const inquiries = await this.inquryRepository.find({
      where: { author: { id: userId } },
      take,
      skip: prev * take,
    });

    return inquiries;
  }
}
