import { Body, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

@Injectable()
export class WorkspacesService {
    constructor(private prisma: PrismaService) { }

    async createWorkspace(userId: string, @Body() dto: CreateWorkspaceDto) {
        const existing = await this.prisma.workspace.findUnique({
            where: {
                slug: dto.slug
            }
        });

        if (existing) {
            throw new ConflictException("Workspace slug is already taken");
        }

        const workspace = await this.prisma.workspace.create({
            data: {
                ...dto,

                createdBy: {
                    connect: {
                        id: userId
                    }
                },

                members: {
                    create: {
                        userId: userId,
                        role: "OWNER"
                    }
                },
            },
            include: {
                members: true
            }
        })

        return {
            success: true,
            message: "Workspace created successfully",
            data: {
                workspace,
            },
        };
    }

    async getWorkspaceById(workspaceId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            },
            include: {
                members: {
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
                }
            }
        })

        if (!workspace) {
            throw new NotFoundException("workspace not found")
        }

        return {
            success: true,
            message: "Workspace fetched successfully",
            data: {
                workspace,
            },
        };
    }

    async getWorkspaceBySlug(slug: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                slug: slug,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true
                            }
                        },
                    }
                },
                projects: true
            }
        })

        console.log(workspace)
        if (!workspace) {
            throw new NotFoundException("workspace not found")
        }

        return {
            success: true,
            message: "Workspace fetched successfully",
            data: {
                workspace,
            },
        };
    }
    
    async getUserWorkspacesId(userId: string) {
        const workspaces = await this.prisma.workspace.findMany({
            where: {
                members: {
                    some: {
                        userId
                    }
                }
            }
        });

        return {
            success: true,
            message: "Workspaces fetched successfully",
            data: {
                workspaces,
            },
        };
    }

    async updateWorkspace(workspaceId: string, dto: UpdateWorkspaceDto) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace not found!")
        }

        if (dto.slug && dto.slug !== workspace.slug) {
            const existing = await this.prisma.workspace.findUnique({
                where: {
                    slug: dto.slug
                }
            });

            if (existing) {
                throw new ConflictException("Workspace slug is already taken");
            }
        }

        await this.prisma.membership.deleteMany({
            where: {
                workspaceId: workspace.id
            }
        });

        const updatedWorkspace = await this.prisma.workspace.update({
            where: {
                id: workspaceId
            },
            data: dto
        });

        return {
            success: true,
            message: "Workspace updated successfully",
            data: {
                workspace: updatedWorkspace,
            },
        };
    }

    async deleteWorkspace(workspaceId: string) {
        const workspace = await this.prisma.workspace.findUnique({
            where: {
                id: workspaceId
            }
        });

        if (!workspace) {
            throw new NotFoundException("Workspace not found!")
        }

        await this.prisma.membership.deleteMany({
            where: {
                workspaceId
            },
        })
        await this.prisma.workspace.delete({
            where: {
                id: workspace.id,
            },
        })

        return {
            success: true,
            message: "Workspace deleted successfully",
            data: null,
        };
    }


    // probability
    async searchWorkspace() { }
    async transferWorkspace() { }
}
