import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { inviteMemberDtoType } from './dto/invite-member.dto';
import { UpdateRoleDto } from './dto/update-member.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../generated/prisma/enums';

@Injectable()
export class MembersService {

    constructor(private prisma: PrismaService, private notificationsService: NotificationService) { }
    async getWorkspaceMembers(userId: string, workspaceId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new NotFoundException("User not found!")
        }

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
                'You are not a member of this workspace!',
            );
        }

        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace not found!")
        }

        const members = await this.prisma.membership.findMany({
            where: {
                workspaceId
            },

            include: {
                user: {
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
            message: "Members fetched successfully",
            data: {
                members,
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
    // GET / api / workspaces /: workspaceId / members /: memberId
    async getWorkspaceMemberById(userId: string, workspaceId: string, memberId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new NotFoundException("User does not exist!")
        }

        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exist")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                id: memberId
            }
        });

        if (!membership) {
            throw new NotFoundException("Member does not exist in this workspace")
        }

        const member = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            },
            select: {
                user: true
            }
        });

        return {
            success: true,
            message: "Member fetched successfully",
            data: {
                member: member ? member.user : null,
            },
        };
    }
    // PATCH / api / workspaces /: workspaceId / members /: memberId / role
    async updateWorkspaceMemberRole(userId: string, workspaceId: string, memberId: string, dto: UpdateRoleDto) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new NotFoundException("User does not exist!")
        }

        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace does not exist")
        }

        const requesterMembership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!requesterMembership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                id: memberId,
                workspaceId
            }
        });

        if (!membership) {
            throw new NotFoundException("Member does not exist in this workspace")
        }

        if (membership.role === "OWNER") {
            throw new ForbiddenException("The workspace owner cannot be changed!")
        }

        // Admin cannot modify another admin
        if (
            requesterMembership.role === 'ADMIN' &&
            membership.role === 'ADMIN'
        ) {
            throw new ForbiddenException(
                'Admins cannot change another admin role',
            );
        }

        const updatedMembership = await this.prisma.membership.update({
            where: {
                id: membership.id
            },
            data: {
                role: dto.role
            },
            include: {
                user: {
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

        await this.notificationsService.createNotification(
            membership.userId,
            NotificationType.MEMBER_ROLE_UPDATED,
            'Workspace Role Updated',
            `Your role in the workspace "${workspace.name}" has been updated to ${dto.role}`,
            userId,
            undefined,
            workspaceId
        );

        return {
            success: true,
            message: 'Member role updated successfully',
            data: {
                membership: updatedMembership,
            },
        };

    }
    // DELETE / api / workspaces /: workspaceId / members /: memberId
    async removeMemberFromWorkspace(userId: string, workspaceId: string, memberId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })


        if (!workspace) {
            throw new ForbiddenException("Workspace does not exist")
        }

        const requesterMembership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId
                }
            }
        });

        if (!requesterMembership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                id: memberId,
                workspaceId
            }
        });

        if (!membership) {
            throw new NotFoundException("Member does not exist in this workspace")
        }


        if (membership.role === "OWNER") {
            throw new ForbiddenException("The owner cannot be removed!")
        }

        // Admin cannot modify another admin
        if (
            requesterMembership.role === 'ADMIN' &&
            membership.role === 'ADMIN'
        ) {
            throw new ForbiddenException(
                'Admins cannot remove another admin role',
            );
        }

        await this.notificationsService.createNotification(
            membership.userId,
            NotificationType.MEMBER_REMOVED,
            'Removed from Workspace',
            `You have been removed from the workspace "${workspace.name}"`,
            userId,
            undefined,
            workspaceId
        );

        await this.prisma.membership.delete({
            where: {
                id: membership.id
            },
        })

        return {
            success: true,
            message: 'Member removed from workspace successfully',
            data: null,
        };
    }
    // POST / api / workspaces /: workspaceId / leave
    async leaveWorkspace(userId: string, workspaceId: string) {
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            throw new NotFoundException("User does not exist!")
        }

        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        })

        if (!workspace) {
            throw new NotFoundException("Workspace does not exist!")
        }

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId, userId
                }
            }
        });

        if (!membership) {
            throw new ForbiddenException("You are not a member of this workspace")
        }

        if (membership.role === "OWNER") {
            throw new ForbiddenException("You cannot leave a workspace as a owner")
        }

        await this.prisma.membership.delete({
            where: {
                id: membership.id
            }
        })

        return {
            success: true,
            message: `Successfully left ${workspace.name} workspace`,
            data: null,
        };

    }
}
