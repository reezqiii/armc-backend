import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards, Patch, } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { RequestEntity } from './request.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { JwtAuthGuard } from 'jwt-auth.guard';
import { UserService } from '../portal_user_db/user.service';
@Controller('requests')
@ApiBearerAuth('access-token')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly userService: UserService,
  ) { }

  @Get('hods')
  @UseGuards(JwtAuthGuard)
  async getAllHods() {
    return this.requestService.getAllHods();
  }

  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.requestService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<RequestEntity> {
    return this.requestService.findOne(id);
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

  @Put(':id')
  async update(
    @Param('id') id_request: number,
    @Body() data: Partial<RequestEntity>,
    @Req() req
  ): Promise<RequestEntity> {
    if (data.status_active === 0) {
      data.canceled_by = req.user?.id;
    }

    return this.requestService.update(id_request, data);
  }

  @Put('cancel/:id')
  @UseGuards(JwtAuthGuard)
  async cancelRequest(@Param('id') id_request: number, @Req() req) {
    const userId = req.user.id_user;
    return this.requestService.cancelRequest(id_request, userId);
  }

  @Put(':id/hod-approval')
  @UseGuards(JwtAuthGuard)
  async hodApproval(
    @Param('id') id_request: number,
    @Body() body: { action: string; remarks?: string },
    @Req() req
  ) {
    const userId = req.user.id_user;
    return this.requestService.hodApproval(id_request, body.action, body.remarks, userId);
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
    @Param('id') id: number,
    @Req() req: any
  ) {
    return this.requestService.submitToHod(id);
  }

  @Put(':id/lead-it-approval')
  @UseGuards(JwtAuthGuard)
  async leadItApproval(
    @Param('id') id_request: number,
    @Body() body: { action: string; remarks?: string },
    @Req() req,
  ) {
    const userId = req.user.id_user;
    return this.requestService.leadItApproval(id_request, body.action, body.remarks, userId);
  }

  @Put(':id/it-approval')
  @UseGuards(JwtAuthGuard)
  async itApproval(
    @Param('id') id_request: number,
    @Body() body: { action: string; remarks?: string },
    @Req() req
  ) {
    const userId = req.user.id_user;
    return this.requestService.itApproval(id_request, body.action, body.remarks, userId);
  }

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

  @Post('/serverside_list')
  async serverSideList(
    @Query() query: any
  ) {
    if (query.sort_by) {
      query.sort = `${query.sort_by},${(query.sort_order || 'ASC').toUpperCase()}`;
    }

    const dto: ServerSideDTO = query;

    return this.requestService.serverSideList(dto);
  }
}
