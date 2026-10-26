import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '../generated/prisma/enums';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(
        private prisma: PrismaService,
        private notificationGateway: NotificationGateway,
    ) { }

    async createNotification(
        userId: string,
        type: NotificationType,
        title: string,
        message: string,
        actorId?: string,
        projectId?: string,
        workspaceId?: string,
        taskId?: string,
    ) {
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                actorId,
                projectId,
                workspaceId,
                taskId
            },

            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true
                    }
                },
                workspace: true,
                project: true,
                task: true
            }
        })

        this.notificationGateway.sendNotificationToUser(userId, notification);

        return notification
    }

    async getUserNotification(userId: string) {
        const notifications = await this.prisma.notification.findMany({
            where: {
                userId
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },

                workspace: true,
                project: true,
                task: true,
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return {
            success: true,
            message: 'Notifications fetched successfully',
            data: {
                notifications,
            },
        };
    }

    async getUnreadNotification(userId: string) {
        const notifications = await this.prisma.notification.findMany({
            where: {
                userId,
                isRead: false
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },

                workspace: true,
                project: true,
                task: true,
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return {
            success: true,
            message: 'Unread notifications fetched successfully',
            data: {
                notifications,
                count: notifications.length,
            },
        };
    }

    async getUnreadCount(userId: string) {
        const count = await this.prisma.notification.count({
            where: {
                userId,
                isRead: false
            }
        });

        return {
            success: true,
            message: 'Unread notification count fetched successfully',
            data: {
                count,
            },
        };
    }


    async getNotification(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                userId,
                id: notificationId
            },
            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },

                workspace: true,
                project: true,
                task: true,
            },
        });

        if (!notification) {
            throw new NotFoundException(
                'Notification does not exist',
            );
        }

        return {
            success: true,
            message: 'Notification fetched successfully',
            data: {
                notification,
            },
        };
    }

    async markAsRead(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                userId,
                id: notificationId
            },
        });

        if (!notification) {
            throw new NotFoundException(
                'Notification does not exist',
            );
        }

        const updatedNotification = await this.prisma.notification.update({
            where: {
                id: notificationId
            },
            data: {
                isRead: true
            }
        });

        return {
            success: true,
            message: 'Notification marked as read',
            data: {
                notification: updatedNotification,
            },
        };
    }

    async markAllAsRead(userId: string) {
        await this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: {
                isRead: true
            }
        });

        return {
            success: true,
            message: 'All notifications marked as read',
            data: null,
        };
    }

    async deleteNotification(userId: string, notificationId: string) {
        const notification = await this.prisma.notification.findFirst({
            where: {
                userId,
                id: notificationId
            },
        });

        if (!notification) {
            throw new NotFoundException(
                'Notification does not exist',
            );
        }

        await this.prisma.notification.delete({
            where: {
                id: notificationId
            }
        })

        return {
            success: true,
            message: 'Notification deleted successfully',
            data: null,
        };
    }

    async clearNotification(userId: string) {
        await this.prisma.notification.deleteMany({
            where: {
                userId
            }
        })

        return {
            success: true,
            message: 'Notifications cleared successfully',
            data: null,
        };
    }
}

// | Method   | Endpoint                                  | Description                                  | Auth        |
// | -------- | ----------------------------------------- | -------------------------------------------- | ----------- |
// | `GET`    | `/api/notifications`                      | Get all notifications for the logged-in user | 🔒 Required |
// | `GET`    | `/api/notifications/unread`               | Get only unread notifications                | 🔒 Required |
// | `GET`    | `/api/notifications/unread/count`         | Get unread notification count                | 🔒 Required |
// | `PATCH`  | `/api/notifications/:notificationId/read` | Mark a notification as read                  | 🔒 Required |
// | `PATCH`  | `/api/notifications/read-all`             | Mark all notifications as read               | 🔒 Required |
// | `DELETE` | `/api/notifications/:notificationId`      | Delete a notification                        | 🔒 Required |
// | `DELETE` | `/api/notifications/clear`      | Delete a notification                        | 🔒 Required |
