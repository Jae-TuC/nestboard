import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { inviteMemberDtoType } from './dto/invite-member.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../generated/prisma/enums';

@Injectable()
export class InvitationService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationService
    ) { }


    async getAllInvitations() {
        const invitations = await this.prisma.invitation.findMany({
            include: {
                workspace: true,
                invitedBy: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return {
            success: true,
            message: "Invitations fetched successfully",
            data: {
                invitations,
            },
        };
    }
    async getInvitationsByUser(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new NotFoundException("User not found")
        }

        const invitations = await this.prisma.invitation.findMany({
            where: {
                email: user.email,
                status: "PENDING"
            },
            include: {
                workspace: true,
                invitedBy: true
            },
            orderBy: { createdAt: "desc" }
        })

        return {
            success: true,
            message: "Invitations fetched successfully",
            data: {
                invitations,
            },
        };
    }

    async inviteMember(inviterId: string, workspaceId: string, dto: inviteMemberDtoType) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace does not exist!")
        }

        const user = await this.prisma.user.findUnique({
            where: {
                email: dto.email
            }
        })

        if (!user) {
            throw new NotFoundException(
                'User with this email does not exist!',
            );
        }

        const existingMember = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    userId: user.id,
                    workspaceId
                }
            }
        })

        if (existingMember) {
            throw new BadRequestException(
                'User is already a member of this workspace!',
            );
        }

        const existingInvitation = await this.prisma.invitation.findFirst({
            where: {
                workspaceId,
                email: dto.email,
                status: "PENDING"
            }
        });

        if (existingInvitation) {
            throw new BadRequestException(
                'An invitation has already been sent to this user!',
            );
        }

        const invitation = await this.prisma.invitation.create({
            data: {
                workspaceId,
                invitedById: inviterId,
                email: dto.email,
                role: dto.role ?? "MEMBER",

                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
        })

        await this.notificationsService.createNotification(
            user.id,
            NotificationType.WORKSPACE_INVITATION,
            'Workspace Invitation',
            `You have been invited to join the workspace "${workspace.name}"`,
            inviterId,
            undefined,
            workspaceId
        );

        return {
            success: true,
            message: "Invitation sent successfully",
            data: {
                invitation,
            },
        };
    }

    async acceptInvitation(invitationId: string, userId: string) {
        const invitation = await this.prisma.invitation.findUnique({
            where: {
                id: invitationId
            }
        });

        if (!invitation) {
            throw new NotFoundException("Invitation does not exist!")
        }

        if (invitation.status !== "PENDING") {
            throw new BadRequestException("Invitation no longer active")
        }

        if (invitation.expiresAt < new Date()) {
            this.prisma.invitation.update({
                where: {
                    id: invitationId
                },
                data: {
                    status: "EXPIRED"
                }
            })
            throw new BadRequestException("Invitation has expired")
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new NotFoundException("User does not exist")
        }

        if (user.email !== invitation.email) {
            throw new ForbiddenException("This invitation does not belong to you!")
        }

        const membership = await this.prisma.membership.create({
            data: {
                userId,
                role: invitation.role,
                workspaceId: invitation.workspaceId
            }
        });

        const updatedInvitation = await this.prisma.invitation.update({
            where: {
                id: invitation.id
            },
            data: {
                status: "ACCEPTED"
            }
        });

        const workspace = await this.prisma.workspace.findUnique({
            where: { id: invitation.workspaceId }
        });

        if (workspace) {
            await this.notificationsService.createNotification(
                workspace.createdById,
                NotificationType.MEMBER_ADDED,
                'New Member Joined',
                `${user.firstName} ${user.lastName} has joined the workspace "${workspace.name}"`,
                userId,
                undefined,
                invitation.workspaceId
            );
        }

        return {
            success: true,
            message: "Invitation accepted successfully",
            data: {
                invitation: updatedInvitation,
            },
        };
    }
    async rejectInvitation(invitationId: string, userId: string) {
        const invitation = await this.prisma.invitation.findUnique({
            where: {
                id: invitationId
            }
        });

        if (!invitation) {
            throw new NotFoundException("Invitation does not exist!")
        }

        if (invitation.status !== "PENDING") {
            throw new BadRequestException("Invitation no longer active")
        }

        if (invitation.expiresAt < new Date()) {
            this.prisma.invitation.update({
                where: {
                    id: invitationId
                },
                data: {
                    status: "EXPIRED"
                }
            })
            throw new BadRequestException("Invitation has expired")
        }

        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new NotFoundException("User does not exist")
        }

        if (user.email !== invitation.email) {
            throw new ForbiddenException("You can't reject this invitation!")
        }

        const updatedInvitation = await this.prisma.invitation.update({
            where: {
                id: invitationId
            },
            data: {
                status: "REJECTED"
            }
        });

        return {
            success: true,
            message: "Invitation rejected successfully",
            data: {
                invitation: updatedInvitation,
            },
        };
    }
}
