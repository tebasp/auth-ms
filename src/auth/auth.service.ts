import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { LoginUserDto, RegisterUserDto } from './dto';
import { SignJwtInterface } from './interfaces/sign-jwt.interface';
import { envs } from '../config/envs';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private logger = new Logger('AuthService');

  constructor(private readonly _jwtService: JwtService) {
    super();
  }

  onModuleInit(): any {
    this.$connect();
    this.logger.log('Connected to the database');
  }

  async registerUser(registerUSerDto: RegisterUserDto) {
    try {
      const user = await this.user.findUnique({
        where: {
          email: registerUSerDto?.email,
        },
      });

      if (user) {
        throw new Error('User already exists');
      }

      const newUser = await this.user.create({
        data: {
          name: registerUSerDto?.name,
          email: registerUSerDto?.email,
          password: bcrypt.hashSync(registerUSerDto?.password, 10),
        },
      });

      const { password: __, ...restUser } = newUser;

      return {
        user: restUser,
        token: await this.signJWT(restUser),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException({ status: 400, message: error?.message });
    }
  }

  async login(loginUSerDto: LoginUserDto) {
    try {
      const user = await this.user.findUnique({
        where: {
          email: loginUSerDto?.email,
        },
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      const isValidPassword = bcrypt.compareSync(
        loginUSerDto?.password,
        user?.password,
      );

      if (!isValidPassword) {
        throw new Error('Invalid credentials');
      }

      const { password: __, ...restUser } = user;

      return {
        user: restUser,
        token: this.signJWT(restUser),
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException({ status: 400, message: error?.message });
    }
  }

  signJWT(payload: SignJwtInterface) {
    return this._jwtService.sign(payload);
  }

  verifyToken(token: string) {
    try {
      const { sub, iat, exp, ...user } = this._jwtService.verify(token, {
        secret: envs.JWT_SECRET,
      });

      const newToken = this.signJWT(user);

      return {
        user,
        token: newToken,
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new RpcException({ status: 401, message: error?.message });
    }
  }
}
