import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async create(data: any) {
        return this.prisma.user.create({
            data,
        });
    }

    async findOneByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findOneById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const { password, ...result } = user;
        return result;
    }

    async updateUser(userId: string, dto: UpdateUserDto) {
        try {
            return await this.prisma.user.update({
                where: {
                    id: userId
                },
                data: dto
            })
        } catch (error) {
            throw new NotFoundException("User does not exist!")
        }

    }
}


