import { Controller, Post, Get, Delete, Param, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AttachmentService } from './attachment.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Attachments')
@ApiBearerAuth('token')
@Controller('attachment')
export class AttachmentController {
    constructor(private attachment: AttachmentService) { }

    @Post(':workspaceId/:projectId/tasks/:taskId/attachments')
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async createAttachment(
        @Req() req: any,
        @Param('workspaceId') workspaceId: string,
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string,
        @UploadedFile() file: Express.Multer.File
    ) {
        return this.attachment.createAttachment(req.user.sub, workspaceId, projectId, taskId, file);
    }

    @Get(':workspaceId/:projectId/tasks/:taskId/attachments')
    async getTaskAttachment(
        @Req() req: any,
        @Param('workspaceId') workspaceId: string,
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string
    ) {
        return this.attachment.getTaskAttachment(req.user.sub, workspaceId, projectId, taskId);
    }

    @Get(':workspaceId/:projectId/tasks/:taskId/attachments/:attachmentId')
    async getAttachment(
        @Req() req: any,
        @Param('workspaceId') workspaceId: string,
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string,
        @Param('attachmentId') attachmentId: string
    ) {
        return this.attachment.getAttachment(req.user.sub, workspaceId, projectId, taskId, attachmentId);
    }

    @Delete(':workspaceId/:projectId/tasks/:taskId/attachments/:attachmentId')
    async deleteAttachment(
        @Req() req: any,
        @Param('workspaceId') workspaceId: string,
        @Param('projectId') projectId: string,
        @Param('taskId') taskId: string,
        @Param('attachmentId') attachmentId: string
    ) {
        return this.attachment.deleteAttachment(req.user.sub, workspaceId, projectId, taskId, attachmentId);
    }
}
