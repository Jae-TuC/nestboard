import { Body, Controller, HttpStatus, Post, HttpCode, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { TokenBlacklistService } from './token-blacklist.service';
import { ExtractJwt } from 'passport-jwt';
import { Public } from './decorators/public.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private blacklistService: TokenBlacklistService
    ) { }

    @HttpCode(HttpStatus.OK)
    @Public()
    @Post('login')
    async login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }
    
    @Public()
    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }
   
    @ApiBearerAuth('token')
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    async logout(@Request() req) {
        const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
        if (token && req.user?.exp) {
            this.blacklistService.add(token, req.user.exp);
        }
        return {
            success: true,
            message: 'Logged out successfully',
            data: null,
        };
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('forgot-password')
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.forgotPassword(dto);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('verify-account')
    async verifyAccount(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyAccount(dto);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('resend-otp')
    async resendOtp(@Body() dto: ResendOtpDto) {
        return this.authService.resendOtp(dto);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('verify-otp')
    async verifyOTP(@Body() dto: VerifyOtpDto) {
        return this.authService.verifyOTP(dto);
    }

    @Public()
    @HttpCode(HttpStatus.OK)
    @Post('reset-password')
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPassword(dto);
    }
}
