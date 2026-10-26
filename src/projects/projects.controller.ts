import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Controller('/workspaces/:workspaceId/projects')
export class ProjectsController {
    constructor(private projectService: ProjectsService) { }


    @ApiBearerAuth('token')
    @Roles(Role.OWNER, Role.ADMIN)
    @Post()
    async createWorkspaceProject(@Req() req: any, @Param("workspaceId") workspaceId: string, @Body() dto: CreateProjectDto) {
        return await this.projectService.createWorkspaceProject(req.user.sub, workspaceId, dto);
    }

    @ApiBearerAuth('token')
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Get()
    async getWorkspaceProjects(@Req() req: any, @Param("workspaceId") workspaceId: string) {
        return await this.projectService.getWorkspaceProjects(req.user.sub, workspaceId);
    }

    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Get(":projectId")
    async getWorkspaceProjectById(@Req() req: any, @Param("workspaceId") workspaceId: string, @Param("projectId") projectId: string) {
        return await this.projectService.getWorkspaceProjectById(req.user.sub, workspaceId, projectId);
    }

    @Roles(Role.OWNER, Role.ADMIN)
    @Patch(":projectId")
    async updateWorkspaceProjectById(@Req() req: any, @Param("workspaceId") workspaceId: string, @Param("projectId") projectId: string, @Body() dto: UpdateProjectDto) {
        return await this.projectService.updateWorkspaceProjectById(req.user.sub, workspaceId, projectId, dto);
    }

    @Roles(Role.OWNER, Role.ADMIN)
    @Delete(":projectId")
    async deleteWorkspaceProjectById(@Req() req: any, @Param("workspaceId") workspaceId: string, @Param("projectId") projectId: string) {
        return await this.projectService.deleteWorkspaceProjectById(req.user.sub, workspaceId, projectId);
    }

}
