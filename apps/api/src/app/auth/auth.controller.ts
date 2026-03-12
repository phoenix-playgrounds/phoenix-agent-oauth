import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { LoginDto } from './dto/login.dto';
import { handleLogin } from './auth-login.handler';

@Controller('auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  @Post('login')
  login(@Body() body: LoginDto): { success: true; message?: string; token?: string } {
    return handleLogin(body, () => this.config.getAgentPassword());
  }
}
