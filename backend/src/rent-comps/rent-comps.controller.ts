import { Controller, Get, Post, Body, Patch, Param, Delete, Put } from '@nestjs/common';
import { RentCompsService } from './rent-comps.service';
import { CreateRentCompDto } from './dto/create-rent-comp.dto';
import { UpdateRentCompDto } from './dto/update-rent-comp.dto';

@Controller()
export class RentCompsController {
    constructor(private readonly rentCompsService: RentCompsService) { }

    @Post('sites/:id/rent-comps')
    create(@Param('id') siteId: string, @Body() createRentCompDto: CreateRentCompDto) {
        return this.rentCompsService.create(siteId, createRentCompDto);
    }

    @Get('sites/:id/rent-comps')
    findAll(@Param('id') siteId: string) {
        return this.rentCompsService.findAll(siteId);
    }

    @Put('rent-comps/:id')
    update(@Param('id') id: string, @Body() updateRentCompDto: UpdateRentCompDto) {
        return this.rentCompsService.update(id, updateRentCompDto);
    }

    @Delete('rent-comps/:id')
    remove(@Param('id') id: string) {
        return this.rentCompsService.remove(id);
    }

    @Post('rent-comps/:id/summarize')
    summarize(@Param('id') id: string) {
        return this.rentCompsService.summarize(id);
    }
}
