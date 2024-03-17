import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { AuthUser, UserId } from 'src/auth/auth-user.decorator';
import { CreateUserInput, CreateUserOutput } from './dtos/create-user.dto';
import { DeleteUserOuput } from './dtos/delete-user.dto';
import {
  LoginTokenInput,
  LoginUserInput,
  LoginUserOutput,
} from './dtos/login-user.dto';
import { EditUserInput, EditUserOutput } from './dtos/edit-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Public } from 'src/auth/public.decorator';
import { RefreshTokenInput } from './dtos/refresh-token.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** createUser */
  @Public()
  @Post()
  createUser(
    @Body() createUserInput: CreateUserInput,
  ): Promise<CreateUserOutput> {
    return this.usersService.createUser(createUserInput);
  }

  /** deleteUser - soft delete */
  @Delete()
  deleteUser(@AuthUser() user: UserId): Promise<DeleteUserOuput> {
    return this.usersService.deleteUser(user);
  }

  /** withdrawUser */
  // withdraw user

  /** editUser */
  @Patch()
  editUser(
    @AuthUser() user: UserId,
    @Body() editUserInput: EditUserInput,
  ): Promise<EditUserOutput> {
    return this.usersService.editUser(user, editUserInput);
  }

  /** myProfile */
  @Get('my')
  myProfile(@AuthUser() user: UserId): Promise<User> {
    return this.usersService.myProfile(user);
  }

  /** social login */
  @Public()
  @Post('login/social')
  socialLogin(
    @Body() socialLoginInput: LoginUserInput,
  ): Promise<LoginUserOutput> {
    return this.usersService.socialLogin(socialLoginInput);
  }

  @Public()
  @Post('login')
  socialLoginToken(
    @Body() loginInput: LoginTokenInput,
  ): Promise<LoginUserOutput> {
    return this.usersService.login(loginInput);
  }

  @Public()
  @Patch('refreshToken')
  refreshToken(
    @Body() refreshTokenInput: RefreshTokenInput,
  ): Promise<LoginUserOutput> {
    return this.usersService.refreshToken(refreshTokenInput);
  }
}
