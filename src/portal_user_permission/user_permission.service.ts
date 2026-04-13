import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { PortalUserPermission } from "./user_permission.entity";
import { PortalPermission } from "../portal_permission/permission.entity";

@Injectable()
export class PortalUserPermissionService {
  constructor(
    @InjectRepository(PortalUserPermission)
    private userPermRepo: Repository<PortalUserPermission>,
    @InjectRepository(PortalPermission)
    private permissionRepo: Repository<PortalPermission>,
  ) {}

  async getUserPermissionsForApp(userId: number, appId: number) {
    const rows = await this.userPermRepo.find({
      select: ["permission_key"],
      where: {
        id_user: userId,
      },
    });

    return rows.map((r) => r.permission_key);
  }

  async syncUserPermissions(
    userId: number,
    permissionIds: number[],
    createdBy?: number,
  ) {
    const uid = Number(userId);
    if (!uid || isNaN(uid)) throw new BadRequestException(`Invalid userId`);

    // 1. Hapus semua permission lama milik user ini
    await this.userPermRepo.delete({ id_user: uid });

    if (!permissionIds || permissionIds.length === 0) return { count: 0 };

    // 2. Ambil detail permission yang baru dari tabel portal_permission
    const permissions = await this.permissionRepo.find({
      where: { id_permission: In(permissionIds) },
    });

    // 3. Insert yang baru (PERBAIKAN: Jangan diconvert ke String)
    const toInsert = permissions.map((p) =>
      this.userPermRepo.create({
        id_user: uid,
        id_portal_permission: p.id_permission as any, // Dibiarkan sebagai number
        permission_key: p.permission_key,
        create_by: createdBy ?? null,
        create_date: new Date(),
      }),
    );

    await this.userPermRepo.save(toInsert);
    return { message: "Synced", count: toInsert.length };
  }

  findAll() {
    return this.userPermRepo.find();
  }

  findOne(id: number) {
    return this.userPermRepo.findOne({ where: { id } });
  }

  create(data: Partial<PortalUserPermission>) {
    const newData = this.userPermRepo.create(data);
    return this.userPermRepo.save(newData);
  }

  async update(id: number, data: Partial<PortalUserPermission>) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException("User permission not found");
    await this.userPermRepo.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number) {
    const find = await this.findOne(id);
    if (!find) throw new NotFoundException("User permission not found");
    return this.userPermRepo.delete(id);
  }

  async getUserPermissionList(userId: number) {
    const uid = Number(userId);
    if (!uid || isNaN(uid)) {
      throw new BadRequestException(
        `Invalid userId: "${userId}". Pastikan menggunakan integer ID user, bukan badge_no atau field lain.`,
      );
    }

    // 1. Ambil semua permission yang aktif
    const allPermissions = await this.permissionRepo.find({
      where: { is_active: 1 },
      order: { permission_group: "ASC", permission_name: "ASC" },
    });

    // 2. Ambil permission apa saja yang sudah di-assign ke user ini
    const assignedRows = await this.userPermRepo.find({
      where: { id_user: uid },
    });

    // PERBAIKAN UTAMA: Pastikan kita menyimpan Set berupa Number, bukan campuran
    const assignedKeys = new Set(
      assignedRows.map((r) => Number(r.id_portal_permission)),
    );

    // 3. Mapping hasil akhir ke frontend
    return allPermissions.map((p) => ({
      id_permission: p.id_permission,
      permission_name: p.permission_name,
      permission_group: p.permission_group ?? "General",
      permission_key: p.permission_key,
      // PERBAIKAN KEDUA: Cek menggunakan Number agar JavaScript === match
      assigned: assignedKeys.has(Number(p.id_permission)),
    }));
  }
}
