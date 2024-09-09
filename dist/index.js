"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const dbmlGenerator_1 = require("./dbmlGenerator");
const svgGenerator_1 = require("./svgGenerator");
const logger_1 = require("./logger");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Starting DBML and SVG generation process');
            const dbConfig = {
                host: (0, core_1.getInput)('DB_HOST', { required: true }),
                port: parseInt((0, core_1.getInput)('DB_PORT') || '5432'),
                database: (0, core_1.getInput)('DB_NAME', { required: true }),
                schema: (0, core_1.getInput)('DB_SCHEMA_NAME') || 'public',
                user: (0, core_1.getInput)('DB_USERNAME', { required: true }),
                password: (0, core_1.getInput)('DB_PASSWORD', { required: true })
            };
            const dbmlOutputLocation = (0, core_1.getInput)('DBML_OUTPUT_LOCATION', {
                required: true
            });
            const svgOutputLocation = dbmlOutputLocation.replace('.dbml', '.svg');
            yield (0, dbmlGenerator_1.generateDbml)(dbConfig, dbmlOutputLocation);
            logger_1.logger.info(`DBML file generated at: ${dbmlOutputLocation}`);
            yield (0, svgGenerator_1.generateSvg)(dbmlOutputLocation, svgOutputLocation);
            logger_1.logger.info(`SVG file generated at: ${svgOutputLocation}`);
            logger_1.logger.info('DBML and SVG generation process completed successfully!');
        }
        catch (error) {
            if (error instanceof Error) {
                logger_1.logger.error(`Error occurred: ${error}`);
                (0, core_1.setFailed)(error.message);
            }
            else {
                logger_1.logger.error('Unknown error occurred...');
                (0, core_1.setFailed)('Unknown error occurred...');
            }
        }
    });
}
run();
