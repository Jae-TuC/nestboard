import { Controller, Get, Param, Patch, Req, Delete } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('notification')
export class NotificationController {
    constructor(private notificationService: NotificationService) { }


    @ApiBearerAuth("token")
    @Get()
    async getUserNotification(@Req() req: any) {
        return this.notificationService.getUserNotification(req.user.sub)
    }

    @ApiBearerAuth("token")
    @Get("/unread")
    async getUnreadNotification(@Req() req: any) {
        return this.notificationService.getUnreadNotification(req.user.sub)
    }

    @ApiBearerAuth("token")
    @Get("/unread/count")
    async getUnreadCount(@Req() req: any) {
        return this.notificationService.getUnreadCount(req.user.sub)
    }

    @ApiBearerAuth("token")
    @Get(":notificationId")
    async getNotification(@Req() req: any, @Param("notificationId") notificationId: string) {
        return this.notificationService.getNotification(req.user.sub, notificationId)
    }

    @ApiBearerAuth("token")
    @Patch(":notificationId")
    async markAsRead(@Req() req: any, @Param("notificationId") notificationId: string) {
        return this.notificationService.markAsRead(req.user.sub, notificationId)
    }

    @ApiBearerAuth("token")
    @Patch("read-all")
    async markAllAsRead(@Req() req: any) {
        return this.notificationService.markAllAsRead(req.user.sub)
    }

    @ApiBearerAuth("token")
    @Delete(":notificationId")
    async deleteNotification(@Req() req: any, @Param("notificationId") notificationId: string) {
        return this.notificationService.deleteNotification(req.user.sub, notificationId)
    }

    @ApiBearerAuth("token")
    @Delete("clear")
    async clearNotification(@Req() req: any) {
        return this.notificationService.clearNotification(req.user.sub)
    }
}
