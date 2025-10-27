import { Controller, Get, Post, Put, Delete, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { RequestService } from './request.service';
import { RequestEntity } from './request.entity';
import { ServerSideDTO } from 'DTO/dto.serverside';
import { JwtAuthGuard } from 'jwt-auth.guard';

@Controller('requests')
@ApiBearerAuth('access-token')
export class RequestController {
  constructor(private readonly requestService: RequestService) { }

  // GET all requests 
  @Get()
  async findAll(@Query() queryDto: ServerSideDTO) {
    return await this.requestService.findAll(); // Bisa diganti serverSideList jika queryDto dipakai
  }

  // GET single request
  @Get(':id')
  findOne(@Param('id') id: number): Promise<RequestEntity> {
    return this.requestService.findOne(id);
  }

  // POST create request
  @Post('/create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: Partial<RequestEntity>, @Req() req): Promise<RequestEntity> {
    const userId = req.user.id_user;
    return this.requestService.create(data, userId);
  }

  // PUT update request
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

  // DELETE request
  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.requestService.remove(id);
  }
  // POST server-side list
  @Post('/serverside_list')
  async serverSideList(@Query() queryDto: ServerSideDTO) {
    return await this.requestService.serverSideList(queryDto);
  }
}
