import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';

@Controller('workspaces')
export class WorkspacesController {
    constructor(private workspaceService: WorkspacesService) { }

    @ApiBearerAuth('token')
    @Post()
    async createWorkspace(@Req() req: any, @Body() dto: CreateWorkspaceDto) {
        return this.workspaceService.createWorkspace(req.user.sub, dto);
    }

    @ApiBearerAuth('token')
    @Get("/me")
    async getUserWorkspaces(@Req() req: any) {
        console.log(req.user.sub)
        return this.workspaceService.getUserWorkspacesId(req.user.sub)
    }

    @ApiBearerAuth('token')
    @Get(':workspaceId')
    async getWorkspaceById(@Param('workspaceId') workspaceId: string) {
        return await this.workspaceService.getWorkspaceById(workspaceId);
    }

    @ApiBearerAuth('token')
    @Get('slug/:slug')
    async getWorkspaceBySlug(@Param('slug') slug: string) {
        return await this.workspaceService.getWorkspaceBySlug(slug);
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER)
    @Patch(":workspaceId")
    async updateWorkspace(@Param("workspaceId") workspaceId: string, @Body() dto: UpdateWorkspaceDto) {
        return await this.workspaceService.updateWorkspace(workspaceId, dto)
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER)
    @Delete(":workspaceId")
    async deleteWorkspace(@Param("workspaceId") workspaceId: string) {
        return this.workspaceService.deleteWorkspace(workspaceId)
    }
}
