import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../generated/prisma/enums';

@Injectable()
export class TasksService {
    constructor(private prisma: PrismaService, private notificationsService: NotificationService) { }

    async createProjectTask(userId: string, workspaceId: string, projectId: string, dto: CreateTaskDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found!")
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

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        });

        if (!project) {
            throw new NotFoundException("Project not found")
        }

        if (dto.assigneeId) {
            const assigneeMembership = await this.prisma.membership.findUnique({
                where: {
                    workspaceId_userId: {
                        workspaceId,
                        userId: dto.assigneeId
                    }
                }
            })

            if (!assigneeMembership) {
                throw new BadRequestException("The assigned user is not a member of this workspace")
            }
        }


        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                status: dto.status ?? "TODO",
                priority: dto.priority ?? "MEDIUM",

                dueDate: dto.dueDate ? new Date(dto.dueDate) : null,

                assigneeId: dto.assigneeId,

                projectId,
                creatorId: userId

            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                },
                assignee: {
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

        const members = await this.prisma.membership.findMany({
            where: { workspaceId }
        });
        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationsService.createNotification(
                    member.userId,
                    NotificationType.TASK_CREATED,
                    'New Task Created',
                    `A new task "${task.title}" has been created in the workspace`,
                    userId,
                    projectId,
                    workspaceId,
                    task.id
                );
            }
        }

        if (task.assigneeId && task.assigneeId !== userId) {
            await this.notificationsService.createNotification(
                task.assigneeId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                `You have been assigned the task "${task.title}"`,
                userId,
                projectId,
                workspaceId,
                task.id
            );
        }

        return {
            success: true,
            message: 'Task created successfully',
            data: {
                task,
            },
        };
    }

    async getProjectTasks(userId: string, workspaceId: string, projectId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const tasks = await this.prisma.task.findMany({
            where: {
                projectId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return {
            success: true,
            message: "Tasks fetched successfully",
            data: {
                tasks,
            },
        };
    }

    async getProjectTaskById(userId: string, workspaceId: string, projectId: string, taskId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const task = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    }
                },
                assignee: {
                    select: {

                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    }
                }
            },
        })



        if (!task) {
            throw new NotFoundException("Task does not exist in this project")
        }

        return {
            success: true,
            message: 'Task fetched successfully',
            data: {
                task,
            },
        };
    }

    async updateProjectTaskById(userId: string, workspaceId: string, projectId: string, taskId: string, dto: UpdateTaskDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const existingTask = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        })

        if (!existingTask) {
            throw new NotFoundException("Task does not exist in this project")
        }

        const task = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                ...dto,
                ...(dto.dueDate !== undefined && {
                    dueDate: dto.dueDate ? new Date(dto.dueDate) : null
                })
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    }
                },
                assignee: {
                    select: {

                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    }
                }
            }
        })

        const members = await this.prisma.membership.findMany({
            where: { workspaceId }
        });
        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationsService.createNotification(
                    member.userId,
                    NotificationType.TASK_UPDATED,
                    'Task Updated',
                    `The task "${task.title}" has been updated`,
                    userId,
                    projectId,
                    workspaceId,
                    task.id
                );
            }
        }

        return {
            success: true,
            message: 'Task updated successfully',
            data: {
                task,
            },
        };
    }

    async deleteProjectTask(userId: string, workspaceId: string, projectId: string, taskId: string,) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const existingTask = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        })

        if (!existingTask) {
            throw new NotFoundException("Task does not exist in this project")
        }

        await this.prisma.task.delete({
            where: {
                id: taskId,
            }
        })

        return {
            success: true,
            message: 'Task deleted successfully',
            data: null,
        };
    }

    async updateProjectTaskStatusById(userId: string, workspaceId: string, projectId: string, taskId: string, dto: UpdateTaskStatusDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const existingTask = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        })

        if (!existingTask) {
            throw new NotFoundException("Task does not exist in this project")
        }

        const task = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                status: dto.status
            }
        })

        const isCompleted = dto.status === 'DONE';
        const type = isCompleted ? NotificationType.TASK_COMPLETED : NotificationType.TASK_STATUS_UPDATED;
        const title = isCompleted ? 'Task Completed' : 'Task Status Updated';
        const message = isCompleted
            ? `The task "${task.title}" has been completed`
            : `The status of task "${task.title}" has been updated to ${dto.status}`;

        const members = await this.prisma.membership.findMany({
            where: { workspaceId }
        });
        for (const member of members) {
            if (member.userId !== userId) {
                await this.notificationsService.createNotification(
                    member.userId,
                    type,
                    title,
                    message,
                    userId,
                    projectId,
                    workspaceId,
                    task.id
                );
            }
        }

        return {
            success: true,
            message: 'Task status updated successfully',
            data: {
                task,
            },
        };
    }

    async assignProjectTask(userId: string, workspaceId: string, projectId: string, taskId: string, dto: AssignTaskDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const existingTask = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        })

        if (!existingTask) {
            throw new NotFoundException("Task does not exist in this project")
        }

        const assigneeMembership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: dto.assigneeId
                }
            }
        })

        if (!assigneeMembership) {
            throw new BadRequestException(
                'The user you are trying to assign is not a member of this workspace',
            );
        }

        const task = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                assigneeId: dto.assigneeId
            },
            include: {
                assignee: {
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

        if (dto.assigneeId !== userId) {
            await this.notificationsService.createNotification(
                dto.assigneeId,
                NotificationType.TASK_ASSIGNED,
                'Task Assigned',
                `You have been assigned the task "${task.title}"`,
                userId,
                projectId,
                workspaceId,
                task.id
            );
        }

        return {
            success: true,
            message: 'Task assigned successfully',
            data: {
                task,
            },
        };
    }

    async unassignProjectTask(userId: string, workspaceId: string, projectId: string, taskId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exists")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            }
        })

        if (!project) {
            throw new NotFoundException("Project does not belong to this workspace")
        }

        const task = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        })

        if (!task) {
            throw new NotFoundException("Task does not exist in this project")
        }

        if (!task.assigneeId) {
            throw new BadRequestException(
                'Task is already unassigned',
            );
        }

        const updatedTask = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                assigneeId: null
            }
        })

        if (task.assigneeId && task.assigneeId !== userId) {
            await this.notificationsService.createNotification(
                task.assigneeId,
                NotificationType.TASK_UNASSIGNED,
                'Task Unassigned',
                `You have been unassigned from the task "${task.title}"`,
                userId,
                projectId,
                workspaceId,
                task.id
            );
        }

        return {
            success: true,
            message: 'Task unassigned successfully',
            data: {
                task: updatedTask,
            },
        };
    }
    // async getAllProjectTasks(userId: string, workspaceId: string, projectId: string, taskId: string) {

    // }
    async updateProjectTaskPosition(
        userId: string,
        workspaceId: string,
        projectId: string,
        taskId: string,
        newPosition: number,
    ) {
        // 1. Check workspace
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId,
            },
        });

        if (!workspace) {
            throw new NotFoundException('Workspace does not exist');
        }

        // 2. Check membership
        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId,
                },
            },
        });

        if (!membership) {
            throw new ForbiddenException(
                'You are not a member of this workspace',
            );
        }

        // 3. Check project
        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId,
            },
        });

        if (!project) {
            throw new NotFoundException(
                'Project does not belong to this workspace',
            );
        }

        // 4. Check task
        const task = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId,
            },
        });

        if (!task) {
            throw new NotFoundException(
                'Task does not exist in this project',
            );
        }

        // 5. Get all tasks in the same project
        const tasks = await this.prisma.task.findMany({
            where: {
                projectId,
            },
            orderBy: {
                position: 'asc'
            },
        });

        // 6. Validate position
        if (newPosition < 0 || newPosition >= tasks.length) {
            throw new BadRequestException(
                `Position must be between 0 and ${tasks.length - 1}`,
            );
        }

        const oldPosition = task.position;

        // Nothing to change
        if (oldPosition === newPosition) {
            return {
                success: true,
                message: 'Task position unchanged',
                data: {
                    task,
                },
            };
        }

        // 7. Reorder tasks
        if (newPosition < oldPosition) {
            // Moving UP
            await this.prisma.task.updateMany({
                where: {
                    projectId,
                    position: {
                        gte: newPosition,
                        lt: oldPosition,
                    },
                },
                data: {
                    position: {
                        increment: 1,
                    },
                },
            });
        } else {
            // Moving DOWN
            await this.prisma.task.updateMany({
                where: {
                    projectId,
                    position: {
                        gt: oldPosition,
                        lte: newPosition,
                    },
                },
                data: {
                    position: {
                        decrement: 1,
                    },
                },
            });
        }

        // 8. Set the task's new position
        const updatedTask = await this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                position: newPosition,
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                assignee: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });

        return {
            success: true,
            message: 'Task position updated successfully',
            data: {
                task: updatedTask,
            },
        };
    }
}
