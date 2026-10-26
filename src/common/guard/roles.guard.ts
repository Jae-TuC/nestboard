import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { ROLES_KEY } from "../decorators/roles.decorators";
import { RolePermissions } from "../constants/role-permissions";
import { Role } from "../../generated/prisma/enums";


@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [
                context.getHandler(),
                context.getClass()
            ]
        )

        if (!requiredRoles) {
            return true
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user

        const workspaceId = request.params.workspaceId;

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: user.sub
                }
            }
        })

        if (!membership) {
            throw new ForbiddenException('You are not a member of this workspace')
        }

        const hasRole = requiredRoles.includes(
            membership.role as Role,
        );

        if (!hasRole) {
            throw new ForbiddenException(
                `Only ${requiredRoles.join(', ')} can perform this action`,
            );
        }
        
        return true
    }
}