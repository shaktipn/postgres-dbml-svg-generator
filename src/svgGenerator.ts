import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from './logger';

const execPromise = promisify(exec);

/**
 * Generates corresponding SVG for a DBML file.
 * @param dbmlPath The full path to the dbml file for which the SVG needs to be generated.
 * @param svgPath The full path for the SVG file which is to be generated.
 */
export async function generateSvg(dbmlPath: string, svgPath: string): Promise<void> {
    try {
        logger.info('Installing dbml-renderer...');
        await execPromise('npm install @softwaretechnik/dbml-renderer');

        logger.info('Generating SVG file from DBML data...');
        await execPromise(`npx dbml-renderer ${dbmlPath} -o ${svgPath}`);

        logger.info('SVG file generation completed...!');
    } catch (error) {
        logger.error(`Error during SVG diagram generation: ${error}`);
        throw new Error('Failed to generate SVG file.');
    }
}
