import { Controller, Put, Body, Param } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { UpdateScenarioDto } from './dto/update-scenario.dto';

@Controller('scenarios')
export class ScenariosController {
    constructor(private readonly scenariosService: ScenariosService) { }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateScenarioDto: UpdateScenarioDto) {
        return this.scenariosService.updateScenario(id, updateScenarioDto);
    }
}
