import { Body, Controller, Get, Patch, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/user.dto';
import { GetUser } from './decorator/get-user.decorator';

@ApiTags('User')
@Controller('user')
export class UserController {
    constructor(private userService: UserService) { }

    @ApiBearerAuth('token')
    @Get('me')
    async getProfile(@Request() req) {
        const user = await this.userService.findOneById(req.user.sub);
        return {
            success: true,
            message: "User profile fetched successfully",
            data: {
                user,
            },
        };
    }

    @ApiBearerAuth("token")
    @Patch("me")
    async updateUser(@GetUser("sub") userId: string, @Body() updateUser: UpdateUserDto) {
        const user = await this.userService.updateUser(userId, updateUser);
        const { password, ...result } = user;

        return {
            success: true,
            message: "User updated successfully",
            data: {
                user: result,
            },
        };
    }
}
