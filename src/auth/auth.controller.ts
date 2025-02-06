import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('auth.register.user')
  register() {
    return 'Register user authms';
  }

  @MessagePattern('auth.login.user')
  login() {
    return 'Login user authms';
  }

  @MessagePattern('auth.verify.user')
  verifyToken() {
    return 'Verify token authms';
  }
}
