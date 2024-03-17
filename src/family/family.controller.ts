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
import { DeleteFamilyOutput } from './dtos/delete-family.dto';
import { InviteFamilyOutput } from './dtos/invite-family.dto';
import { Family } from './entities/familiy.entity';
import { FamilyService } from './family.service';

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  /** createFamily */
  @Post()
  createFamily(userId: number): Promise<BaseOutput> {
    return this.familyService.createFamily(userId);
  }

  @Get('my')
  myFamily(
    @AuthUser() user: UserId,
    @Query('exceptMe') exceptMe: boolean,
  ): Promise<Family> {
    return this.familyService.myFamily(user, exceptMe);
  }

  /** joinFamliy */
  @Patch('join/:familyToken')
  joinFamily(
    @AuthUser() user: UserId,
    @Param('familyToken') familyToken: string,
  ): Promise<BaseOutput> {
    return this.familyService.joinFamily(user, familyToken);
  }

  /** invite Family */
  @Post('invite')
  inviteFamily(@AuthUser() user: UserId): Promise<InviteFamilyOutput> {
    return this.familyService.inviteFamily(user);
  }

  /** withdraw family */
}
