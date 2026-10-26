import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { inviteMemberDto } from './dto/invite-member.dto';
import { Role } from '../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorators';
import { Public } from '../auth/decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('invitation')
export class InvitationController {
    constructor(private invitation: InvitationService) { }

    // @Public()
    // @Get()
    // async getAllInvitations() {
    //     return await this.invitation.getAllInvitations();
    // }


    @ApiBearerAuth('token')
    @Get("me")
    async getInvitationsByUser(@Req() req: any) {
        return await this.invitation.getInvitationsByUser(req.user.sub);
    }

    @ApiBearerAuth('token')
    @Post(":invitationId/accept")
    async acceptInvitation(@Req() req: any, @Param("invitationId") invitationId: string) {
        return await this.invitation.acceptInvitation(invitationId, req.user.sub);
    }


    @ApiBearerAuth('token')
    @Post(":invitationId/reject")
    async rejectInvitation(@Req() req: any, @Param("invitationId") invitationId: string) {
        return await this.invitation.rejectInvitation(invitationId, req.user.sub);
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER)
    @Post(':workspaceId/invite')
    async inviteMember(
        @Req() req: any,
        @Param("workspaceId") workspaceId: string, 
        @Body() dto: inviteMemberDto
    ) {
        return await this.invitation.inviteMember(req.user.sub, workspaceId, dto);
    }
}
