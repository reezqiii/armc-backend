import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards, Patch, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { RequestEntity } from './request.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { JwtAuthGuard } from 'jwt-auth.guard';
import { AesEcbService } from '../crypto/aes-ecb.service';
import { UserService } from '../portal_user_db/user.service';
import { Public } from 'auth/public.decorator';
import { UpdateReturnedRequestDto } from './DTO/update-returned-request.dto';

@Controller('requests')
@ApiBearerAuth('access-token')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly userService: UserService,
    private readonly aesEcb: AesEcbService,
  ) { }

  @Get('hods')
  @UseGuards(JwtAuthGuard)
  async getAllHods() {
    return this.requestService.getAllHods();
  }

  @Get('employee/:badge')
  @UseGuards(JwtAuthGuard)
  async getEmployeeByBadge(@Param('badge') badge: number) {
    return this.requestService.getEmployeeByBadge(badge);
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: Partial<RequestEntity>, @Req() req): Promise<RequestEntity> {
    const userId = req.user.id_user;
    return this.requestService.create(data, userId);
  }

  @Post(':id/return')
  async return(
    @Param('id') encryptedId: string,
    @Req() req: any
  ) {
    const id = Number(this.aesEcb.decryptBase64Url(encryptedId));
    return this.requestService.return(id, req.user);
  }

  @Put(':id/return')
  async updateReturned(
    @Param('id') encryptedId: string,
    @Body() dto: UpdateReturnedRequestDto
  ) {
    const id = Number(this.aesEcb.decryptBase64Url(encryptedId));
    return this.requestService.updateReturnedRequest(id, dto);
  }

  @Public()
  @Post('public/create')
  async createPublic(@Body() data: Partial<RequestEntity>) {
    return this.requestService.createPublic(data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() data: Partial<RequestEntity>,
    @Req() req
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));

    if (data.status_active === 0) {
      data.canceled_by = req.user?.id_user;
    }

    return this.requestService.update(decId, data);
  }

  @Put('cancel/:id')
  @UseGuards(JwtAuthGuard)
  async cancelRequest(@Param('id') id: string, @Req() req) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    const userId = req.user.id_user;
    return this.requestService.cancelRequest(decId, userId);
  }

  @Put(':id/hod-approval')
  @UseGuards(JwtAuthGuard)
  async hodApproval(
    @Param('id') id: string,
    @Body() body: { action: string; remarks?: string },
    @Req() req
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    if (isNaN(decId)) throw new BadRequestException('Invalid request ID');

    const userId = req.user.id_user;
    return this.requestService.hodApproval(decId, body.action, body.remarks, userId);
  }

  @Put('hod-approval/bulk')
  @UseGuards(JwtAuthGuard)
  async hodApprovalBulk(
    @Body()
    body: {
      ids: number[];
      action: string;
      remarks?: string;
    },
    @Req() req
  ) {
    const userId = req.user.id_user;
    return this.requestService.hodApprovalBulk(body.ids, body.action, body.remarks, userId);
  }

  @Put(':id/submit-to-hod')
  async submitToHodRequest(
    @Param('id') encryptedId: string,
    @Req() req: any
  ) {
    const userId = req.user?.id;
    return await this.requestService.submitToHod(encryptedId, userId);
  }

  @Put(':id/lead-it-approval')
  async leadItApproval(
    @Param('id') id: string,
    @Body() body,
    @Req() req,
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    const userId = req.user.id_user;

    return this.requestService.leadItApproval(
      decId,
      body.action,
      body.remarks,
      userId,
    );
  }

  @Put(':id/it-approval')
  @UseGuards(JwtAuthGuard)
  async itApproval(
    @Param('id') id: string,
    @Body() body: { action: string; remarks?: string },
    @Req() req
  ) {
    const decId = Number(this.aesEcb.decryptBase64Url(id));
    const userId = req.user.id_user;

    return this.requestService.itApproval(decId, body.action, body.remarks, userId);
  }

  // @Post('assign-permission')
  // @UseGuards(JwtAuthGuard)
  // async assignPermission(
  //   @Body() body: { id_user: number; permission_id: number; created_by: number }
  // ) {
  //   return this.requestService.assignPermissionToUser(
  //     body.id_user,
  //     body.permission_id,
  //     body.created_by
  //   );
  // }

  // @Get('permissions/:id_user')
  // getAssignedPermission(
  //   @Param('id_user') id_user: number,
  // ) {
  //   return this.requestService.getAssignedPermissions(id_user);
  // }

  @Patch(':id/admin-status')
  @UseGuards(JwtAuthGuard)
  async updateAdminStatus(
    @Param('id') id_request: number,
    @Body('request_admin') request_admin: number,
  ): Promise<{ message: string }> {
    await this.requestService.updateAdminStatus(id_request, request_admin);
    return { message: 'Admin status updated successfully' };
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.requestService.remove(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    let numericId: number;
    try {
      numericId = Number(this.aesEcb.decryptBase64Url(id));
      if (isNaN(numericId)) throw new Error();
    } catch {
      throw new BadRequestException('Invalid request ID');
    }
    return this.requestService.findOne(numericId);
  }

  @Post('/serverside_list')
  @UseGuards(JwtAuthGuard)
  async serverSideList(
    @Query() query: any,
    @Req() req: any
  ) {
    if (query.sort_by) {
      query.sort = `${query.sort_by},${(query.sort_order || 'ASC').toUpperCase()}`;
    }

    const dto: ServerSideDTO = query;
    return this.requestService.serverSideList(dto, req.user);
  }
}
