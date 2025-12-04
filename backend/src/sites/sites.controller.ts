import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { QuerySitesDto } from './dto/query-sites.dto';

@Controller('sites')
export class SitesController {
    constructor(private readonly sitesService: SitesService) { }

    @Get()
    findAll(@Query(ValidationPipe) query: QuerySitesDto) {
        return this.sitesService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.sitesService.findOne(id);
    }

    @Post()
    create(@Body() createSiteDto: CreateSiteDto) {
        return this.sitesService.create(createSiteDto);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSiteDto: UpdateSiteDto) {
        return this.sitesService.update(id, updateSiteDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.sitesService.remove(id);
    }
}
