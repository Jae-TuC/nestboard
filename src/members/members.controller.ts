import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { Roles } from '../common/decorators/roles.decorators';
import { inviteMemberDto } from './dto/invite-member.dto';
import { Role } from '../generated/prisma/enums';
import { UpdateRoleDto } from './dto/update-member.dto';

@Controller('workspaces')
export class MembersController {
    constructor(private memberService: MembersService) { }


    @ApiBearerAuth('token')
    @Roles(Role.OWNER)
    @Post(':workspaceId/invite')
    async inviteMember(
        @Req() req: any,
        @Param("workspaceId") workspaceId: string,
        @Body() dto: inviteMemberDto
    ) {
        return await this.memberService.inviteMember(req.user.sub, workspaceId, dto);
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER, Role.MEMBER, Role.ADMIN)
    @Get(':workspaceId/members')
    async getWorkspaceMembers(@Req() req: any, @Param('workspaceId') workspaceId: string) {
        return await this.memberService.getWorkspaceMembers(req.user.sub, workspaceId)
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER, Role.MEMBER, Role.ADMIN)
    @Get(':workspaceId/members/:memberId')
    async getWorkspaceMemberById(@Req() req: any, @Param('workspaceId') workspaceId: string, @Param("memberId") memberId: string) {
        return await this.memberService.getWorkspaceMemberById(req.user.sub, workspaceId, memberId)
    }


    @ApiBearerAuth('token')
    @Roles(Role.OWNER, Role.ADMIN)
    @Patch(':workspaceId/members/:memberId/role')
    async updateWorkspaceMemberRole(@Req() req: any, @Param('workspaceId') workspaceId: string, @Param("memberId") memberId: string, @Body() dto: UpdateRoleDto) {
        return await this.memberService.updateWorkspaceMemberRole(req.user.sub, workspaceId, memberId, dto)
    }


    @ApiBearerAuth('token')
    @Roles(Role.MEMBER, Role.ADMIN)
    @Post(':workspaceId/leave')
    async leaveWorkspace(@Req() req: any, @Param('workspaceId') workspaceId: string, @Param("memberId") memberId: string) {
        return await this.memberService.leaveWorkspace(req.user.sub, workspaceId)
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER, Role.ADMIN)
    @Delete(':workspaceId/members/:memberId')
    async removeMemberFromWorkspace(@Req() req: any, @Param('workspaceId') workspaceId: string, @Param("memberId") memberId: string) {
        return await this.memberService.removeMemberFromWorkspace(req.user.sub, workspaceId, memberId)
    }

}
