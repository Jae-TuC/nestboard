import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { comparePassword, hashPassword } from '../common/utils/bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { generateOTP } from '../common/utils/otp';
import { PrismaService } from '../prisma/prisma.service';
import { OtpType } from '../generated/prisma/enums';

@Injectable()
export class AuthService {
    constructor(
        private userService: UserService,
        private jwtService: JwtService,
        private workspaceService: WorkspacesService,
        private prisma: PrismaService
    ) { }

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.userService.findOneByEmail(email);
        const hashedPassword = await comparePassword(password, user?.password || '');
        if (user && hashedPassword) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(dto: LoginDto) {
        const existingUser = await this.userService.findOneByEmail(dto.email);

        if (!existingUser) {
            throw new ConflictException('Invalid credentials');
        }

        const matchedPassword = await comparePassword(dto.password, existingUser.password);

        if (!matchedPassword) {
            throw new ConflictException('Password Invalid');
        }

        if (!existingUser.isVerified) {
            throw new BadRequestException({
                message: 'Please verify your account before logging in',
                code: 'UNVERIFIED_ACCOUNT',
            });
        }

        const payload = { email: existingUser.email, sub: existingUser.id };
        const [token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET,
            }),
            this.jwtService.signAsync(payload, {
                secret: process.env.REFRESH_SECRET
            })
        ])
        const { password, ...user } = existingUser;

        // return { user, token, refresh_token };
        return {
            success: true,
            message: "Login successful",
            data: { user, token, refresh_token }
        }
    }

    async register(dto: RegisterDto) {
        const existingUser = await this.userService.findOneByEmail(dto.email);

        if (existingUser) {
            throw new ConflictException(
                'User with this email already exists',
            );
        }

        // 1. Generate and guarantee unique workspace slug
        const emailPrefix = dto.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        let randomString = Math.random().toString(36).substring(2, 7);
        let slug = `${emailPrefix}-workspace-${randomString}`;

        let isUnique = false;
        while (!isUnique) {
            const existingWorkspace = await this.prisma.workspace.findUnique({
                where: { slug }
            });
            if (!existingWorkspace) {
                isUnique = true;
            } else {
                randomString = Math.random().toString(36).substring(2, 7);
                slug = `${emailPrefix}-workspace-${randomString}`;
            }
        }

        // 2. Perform user and workspace creation in a single transaction
        const { user } = await this.prisma.$transaction(async (tx) => {
            const hashedPassword = await hashPassword(dto.password);

            const newUser = await tx.user.create({
                data: {
                    firstName: dto.firstName,
                    lastName: dto.lastName,
                    email: dto.email,
                    password: hashedPassword,
                    isVerified: false
                }
            });

            await tx.workspace.create({
                data: {
                    name: `${dto.firstName}'s Workspace`,
                    slug,
                    description: "default workspace",
                    createdBy: {
                        connect: {
                            id: newUser.id
                        }
                    },
                    members: {
                        create: {
                            userId: newUser.id,
                            role: "OWNER"
                        }
                    },
                }
            });

            return { user: newUser };
        });

        // 3. Generate Account Verification OTP
        const otp = generateOTP(6);
        await this.prisma.otp.upsert({
            where: {
                userId_type: {
                    userId: user.id,
                    type: OtpType.ACCOUNT_VERIFICATION
                }
            },
            update: {
                code: otp,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
            },
            create: {
                code: otp,
                type: OtpType.ACCOUNT_VERIFICATION,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                userId: user.id
            }
        });

        console.log(`[OTP] Account Verification OTP for ${dto.email}: ${otp}`);

        const { password, ...result } = user;
        return {
            user: result,
            otp, // Returned directly for easy developer testing
            message: 'User registered successfully. Please verify your account using the OTP.'
        };
    }

    async verifyAccount(dto: VerifyOtpDto) {
        const user = await this.userService.findOneByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const otpRecord = await this.prisma.otp.findFirst({
            where: {
                userId: user.id,
                type: OtpType.ACCOUNT_VERIFICATION,
                code: dto.otp
            }
        });

        if (!otpRecord) {
            throw new BadRequestException('OTP has expired or is invalid');
        }

        if (otpRecord.expiresAt < new Date()) {
            await this.prisma.otp.delete({ where: { id: otpRecord.id } });
            throw new BadRequestException('OTP has expired or is invalid');
        }

        await this.userService.updateUser(user.id, { isVerified: true });
        await this.prisma.otp.delete({ where: { id: otpRecord.id } });

        return {
            success: true,
            message: 'Account verified successfully',
        };
    }

    async resendOtp(dto: ResendOtpDto) {
        const user = await this.userService.findOneByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('User with this email does not exist');
        }

        const otp = generateOTP(6);
        const expiresAt = dto.type === OtpType.ACCOUNT_VERIFICATION
            ? new Date(Date.now() + 24 * 60 * 60 * 1000)
            : new Date(Date.now() + 10 * 60 * 1000);

        await this.prisma.otp.upsert({
            where: {
                userId_type: {
                    userId: user.id,
                    type: dto.type as OtpType
                }
            },
            update: {
                code: otp,
                expiresAt
            },
            create: {
                code: otp,
                type: dto.type as OtpType,
                expiresAt,
                userId: user.id
            }
        });

        console.log(`[OTP] Resent ${dto.type} OTP for ${dto.email}: ${otp}`);

        return {
            success: true,
            message: 'OTP resent successfully',
            otp,
        };
    }

    async forgotPassword(dto: ForgotPasswordDto) {
        const user = await this.userService.findOneByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('User with this email does not exist');
        }

        const otp = generateOTP(6);
        await this.prisma.otp.upsert({
            where: {
                userId_type: {
                    userId: user.id,
                    type: OtpType.PASSWORD_RESET
                }
            },
            update: {
                code: otp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000)
            },
            create: {
                code: otp,
                type: OtpType.PASSWORD_RESET,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                userId: user.id
            }
        });

        console.log(`[OTP] Password Reset OTP for ${dto.email}: ${otp}`);

        return {
            success: true,
            message: 'Password reset OTP has been sent successfully',
            otp,
        };
    }

    async verifyOTP(dto: VerifyOtpDto) {
        const user = await this.userService.findOneByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('User with this email does not exist');
        }

        const otpRecord = await this.prisma.otp.findFirst({
            where: {
                userId: user.id,
                type: OtpType.PASSWORD_RESET,
                code: dto.otp
            }
        });

        if (!otpRecord) {
            throw new BadRequestException('OTP has expired or is invalid');
        }

        if (otpRecord.expiresAt < new Date()) {
            await this.prisma.otp.delete({ where: { id: otpRecord.id } });
            throw new BadRequestException('OTP has expired or is invalid');
        }

        return {
            success: true,
            message: 'OTP verified successfully',
        };
    }

    async resetPassword(dto: ResetPasswordDto) {
        const user = await this.userService.findOneByEmail(dto.email);
        if (!user) {
            throw new NotFoundException('User with this email does not exist');
        }

        const otpRecord = await this.prisma.otp.findFirst({
            where: {
                userId: user.id,
                type: OtpType.PASSWORD_RESET,
                code: dto.otp
            }
        });

        if (!otpRecord) {
            throw new BadRequestException('OTP has expired or is invalid');
        }

        if (otpRecord.expiresAt < new Date()) {
            await this.prisma.otp.delete({ where: { id: otpRecord.id } });
            throw new BadRequestException('OTP has expired or is invalid');
        }

        const hashedPassword = await hashPassword(dto.password);
        await this.userService.updateUser(user.id, { password: hashedPassword });

        await this.prisma.otp.delete({ where: { id: otpRecord.id } });

        return {
            success: true,
            message: 'Password reset successfully',
        };
    }
}
