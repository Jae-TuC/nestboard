import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../generated/prisma/enums';

@Injectable()
export class ProjectsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationService
    ) { }


    async createWorkspaceProject(userId: string, workspaceId: string, dto: CreateProjectDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.create({
            data: {
                ...dto,
                workspaceId,
                createdById: userId
            }
        })

        const members = await this.prisma.membership.findMany({
            where: { workspaceId }
        });
        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationsService.createNotification(
                    member.userId,
                    NotificationType.PROJECT_CREATED,
                    'New Project Created',
                    `A new project "${project.name}" has been created in the workspace`,
                    userId,
                    project.id,
                    workspaceId
                );
            }
        }

        return {
            success: true,
            message: "Project created successfully",
            data: {
                project,
            },
        };

    }

    async getWorkspaceProjects(userId: string, workspaceId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const projects = await this.prisma.project.findMany({
            where: {
                workspaceId,
                createdById: userId
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                }
            }
        })

        return {
            success: true,
            message: "Projects fetched successfully",
            data: {
                projects,
            },
        };
    }

    async getWorkspaceProjectById(userId: string, workspaceId: string, projectId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findUnique({
            where: {
                id: projectId,
                workspaceId
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                },
                tasks: true
            }
        })


        if (!project) {
            throw new NotFoundException("Project does not exist")
        }

        return {
            success: true,
            message: "Project fetched successfully",
            data: {
                project,
            },
        };

    }

    async updateWorkspaceProjectById(userId: string, workspaceId: string, projectId: string, dto: UpdateProjectDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findUnique({
            where: {
                id: projectId,
                workspaceId
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not exist in this workspace!")
        }

        const updatedProject = await this.prisma.project.update({
            where: {
                id: project.id
            },
            data: dto
        })

        const members = await this.prisma.membership.findMany({
            where: { workspaceId }
        });
        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationsService.createNotification(
                    member.userId,
                    NotificationType.PROJECT_UPDATED,
                    'Project Updated',
                    `The project "${updatedProject.name}" has been updated`,
                    userId,
                    project.id,
                    workspaceId
                );
            }
        }

        return {
            success: true,
            message: "Project updated successfully",
            data: {
                project: updatedProject,
            },
        };
    }

    async deleteWorkspaceProjectById(userId: string, workspaceId: string, projectId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findUnique({
            where: {
                id: projectId,
                workspaceId
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not exist in this workspace!")
        }

        const members = await this.prisma.membership.findMany({
            where: { workspaceId }
        });
        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationsService.createNotification(
                    member.userId,
                    NotificationType.PROJECT_DELETED,
                    'Project Deleted',
                    `The project "${project.name}" has been deleted`,
                    userId,
                    undefined,
                    workspaceId
                );
            }
        }

        await this.prisma.project.delete({
            where: {
                id: project.id
            },
        })

        return {
            success: true,
            message: "Project deleted successfully",
            data: null,
        };
    }

}
