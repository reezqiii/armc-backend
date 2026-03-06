import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../portal/user.entity";
import { Repository } from "typeorm";
import * as md5 from "md5";
import { AuthDTO } from "./DTO/auth.dto";
import { AesEcbService } from "../crypto/aes-ecb.service";
import { PortalUserPermissionService } from "portal_user_permission/user_permission.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly _user: Repository<User>,
    private readonly aesEcb: AesEcbService,
    private readonly userPermService: PortalUserPermissionService,
  ) {}

  async login(authDTO: AuthDTO) {
    const { username, password } = authDTO;

    const user = await this._user.findOne({
      where: {
        username: username,
        status_user: 1,
      },
    });

    // Gunakan Exception agar ditangkap oleh catch di frontend
    if (!user) {
      throw new NotFoundException("User tidak ditemukan atau tidak aktif");
    }

    // Hash MD5 sudah sesuai dengan gambar DB kamu
    if (user.password !== md5(password)) {
      throw new UnauthorizedException("Password yang anda masukkan salah");
    }

    // ... sisa logic (generate token & permissions)
    const token = this.jwtService.sign({ id_user: user.id_user });

    return {
      success: true,
      token: token,
      user: { id: user.id_user, full_name: user.full_name },
    };
  }
}
