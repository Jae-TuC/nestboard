import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { PrismaService } from "src/prisma/prisma.service";
import { RolePermissions } from "../constants/role-permissions";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorators";


@Injectable()
export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector, private prisma: PrismaService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [
                context.getHandler(),
                context.getClass()
            ]
        )

        if (!requiredPermissions) {
            return true
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user

        const workspaceId = request.params.workspaceId;

        const membership = await this.prisma.membership.findUnique({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: user.id
                }
            }
        })

        if(!membership){
            throw new ForbiddenException('You are not a member of this workspace')
        }

        const userPermissions = RolePermissions[membership.role] 

        if(!userPermissions){
            throw new ForbiddenException("Permission denied")
        }

        return true
    }
}