import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repositories/auth.repository';
import { config } from '../../../common/config';
import { LoginDto, RegisterDto } from '../types';

export class AuthService {
  private repository: AuthRepository;

  constructor() {
    this.repository = new AuthRepository();
  }

  async register(data: RegisterDto) {
    const existingUser = await this.repository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.repository.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(data: LoginDto) {
    const user = await this.repository.findByEmail(data.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordMatch = await bcrypt.compare(data.password, user.password);
    if (!isPasswordMatch) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwt.secret as string,
      { expiresIn: config.jwt.expiresIn as any }
    );

    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      token,
    };
  }
}
