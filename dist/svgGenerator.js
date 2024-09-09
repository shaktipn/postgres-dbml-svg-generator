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
exports.generateSvg = generateSvg;
const child_process_1 = require("child_process");
const util_1 = require("util");
const logger_1 = require("./logger");
const execPromise = (0, util_1.promisify)(child_process_1.exec);
/**
 * Generates corresponding SVG for a DBML file.
 * @param dbmlPath The full path to the dbml file for which the SVG needs to be generated.
 * @param svgPath The full path for the SVG file which is to be generated.
 */
function generateSvg(dbmlPath, svgPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            logger_1.logger.info('Installing dbml-renderer...');
            yield execPromise('npm install -g @softwaretechnik-berlin/dbml-renderer');
            logger_1.logger.info('Generating SVG file from DBML data...');
            yield execPromise(`dbml-renderer ${dbmlPath} -o ${svgPath}`);
            logger_1.logger.info('SVG file generation completed...!');
        }
        catch (error) {
            logger_1.logger.error(`Error during SVG diagram generation: ${error}`);
            throw new Error('Failed to generate SVG file.');
        }
    });
}
