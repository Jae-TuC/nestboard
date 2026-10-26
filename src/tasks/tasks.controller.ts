import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorators';
import { Role } from '../generated/prisma/enums';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { UpdateTaskPositionDto } from './dto/update-task-position.dto';

@Controller('/workspaces/:workspaceId/projects/:projectId/tasks')
export class TasksController {
    constructor(private tastService: TasksService) { }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN)
    @Post()
    async createProjectTask(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Body() dto: CreateTaskDto) {
        return await this.tastService.createProjectTask(req.user.sub, workspceId, projectId, dto)
    }


    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Get()
    async getProjectTasks(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string) {
        return await this.tastService.getProjectTasks(req.user.sub, workspceId, projectId)
    }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Get(":taskId")
    async getProjectTaskById(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string) {
        return await this.tastService.getProjectTaskById(req.user.sub, workspceId, projectId, taskId)
    }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Patch(":taskId")
    async updateProjectTaskById(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body() dto: UpdateTaskDto) {
        return await this.tastService.updateProjectTaskById(req.user.sub, workspceId, projectId, taskId, dto)
    }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN)
    @Delete(":taskId")
    async deleteProjectTask(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string) {
        return await this.tastService.deleteProjectTask(req.user.sub, workspceId, projectId, taskId)
    }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Patch(":taskId/status")
    async updateProjectTaskStatusById(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body() dto: UpdateTaskStatusDto) {
        return await this.tastService.updateProjectTaskStatusById(req.user.sub, workspceId, projectId, taskId, dto)
    }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Patch(":taskId/assign")
    async assignProjectTask(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body() dto: AssignTaskDto) {
        return await this.tastService.assignProjectTask(req.user.sub, workspceId, projectId, taskId, dto)
    }

    @ApiBearerAuth("token")
    @Roles(Role.OWNER, Role.ADMIN, Role.MEMBER)
    @Patch(":taskId/unassign")
    async unassignProjectTask(@Req() req: any, @Param("workspaceId") workspceId: string, @Param("projectId") projectId: string, @Param("taskId") taskId: string, @Body() dto: UpdateTaskStatusDto) {
        return await this.tastService.unassignProjectTask(req.user.sub, workspceId, projectId, taskId)
    }

    @ApiBearerAuth('token')
    @Patch(':taskId/position')
    async updateProjectTaskPosition(
        @Req() req: any,
        @Param('workspaceId') workspaceId: string,
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string,
        @Body() dto: UpdateTaskPositionDto,
    ) {
        return this.tastService.updateProjectTaskPosition(
            req.user.sub,
            workspaceId,
            projectId,
            taskId,
            dto.position,
        );
    }
}
