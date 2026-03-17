import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../portal/user.entity";
import { Repository } from "typeorm";
import * as md5 from "md5";
import { AuthDTO } from "./DTO/auth.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly _user: Repository<User>,
  ) {}

  async login(authDTO: AuthDTO) {
    const { username, password } = authDTO;

    const login = await this._user.findOne({
      where: {
        username: username,
        status_user: 1,
      },
    });

    if (!login) {
      throw new UnauthorizedException("Invalid username or password");
    }

    // Sesuaikan password check dengan yang ada di database
    const hashedPassword = md5(password);
    if (login.password !== hashedPassword) {
      throw new UnauthorizedException("Invalid username or password");
    }

    const payload = { id_user: login.id_user };
    const token = this.jwtService.sign(payload);

    return {
      success: true,
      token: token,
      user: {
        id: login.id_user,
        full_name: login.full_name,
        permissions: [],
      },
    };
  }
}