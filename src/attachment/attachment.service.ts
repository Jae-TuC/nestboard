import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAttachmentDto } from './dto/attachment.dto';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class AttachmentService {
    constructor(
        private prisma: PrismaService, 
        private upload: UploadService
    ) { }

    private async validateTaskAccess(userId: string, workspaceId: string, projectId: string, taskId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: { id: workspaceId }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace not found!");
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    userId,
                    workspaceId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace");
        }

        const project = await this.prisma.project.findFirst({
            where: {
                id: projectId,
                workspaceId
            }
        });

        if (!project) {
            throw new NotFoundException("Project does not exist in this workspace");
        }

        const task = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                projectId
            }
        });

        if (!task) {
            throw new NotFoundException("Task does not belong to this project!");
        }

        return task;
    }

    async createAttachment(
        userId: string,
        workspaceId: string,
        projectId: string,
        taskId: string,
        file: Express.Multer.File
    ) {
        await this.validateTaskAccess(userId, workspaceId, projectId, taskId);

        const isImage = file.mimetype.startsWith('image/');
        const uploadResult = isImage
            ? await this.upload.uploadImage(file)
            : await this.upload.uploadDocument(file);

        const attachment = await this.prisma.attachment.create({
            data: {
                name: file.originalname,
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                mimeType: file.mimetype,
                size: file.size,
                resourceType: isImage ? 'image' : 'raw',
                taskId,
                uploadedById: userId
            }
        });

        return {
            success: true,
            message: 'Attachment uploaded successfully',
            data: {
                attachment,
            },
        };
    }

    async getTaskAttachment(
        userId: string,
        workspaceId: string,
        projectId: string,
        taskId: string
    ) {
        await this.validateTaskAccess(userId, workspaceId, projectId, taskId);

        const attachments = await this.prisma.attachment.findMany({
            where: { taskId }
        });

        return {
            success: true,
            message: 'Attachments fetched successfully',
            data: {
                attachments,
            },
        };
    }

    async getAttachment(
        userId: string,
        workspaceId: string,
        projectId: string,
        taskId: string,
        attachmentId: string
    ) {
        await this.validateTaskAccess(userId, workspaceId, projectId, taskId);

        const attachment = await this.prisma.attachment.findFirst({
            where: {
                id: attachmentId,
                taskId
            }
        });

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        return {
            success: true,
            message: 'Attachment fetched successfully',
            data: {
                attachment,
            },
        };
    }

    async deleteAttachment(
        userId: string,
        workspaceId: string,
        projectId: string,
        taskId: string,
        attachmentId: string
    ) {
        await this.validateTaskAccess(userId, workspaceId, projectId, taskId);

        const attachment = await this.prisma.attachment.findFirst({
            where: {
                id: attachmentId,
                taskId
            }
        });

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        // Delete asset from Cloudinary using stored publicId and resourceType
        await this.upload.deleteFile(attachment.publicId, attachment.resourceType || 'raw');

        // Delete from database
        await this.prisma.attachment.delete({
            where: { id: attachmentId }
        });

        return {
            success: true,
            message: 'Attachment deleted successfully',
            data: null,
        };
    }
}
