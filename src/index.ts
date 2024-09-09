import { getInput, setFailed } from '@actions/core';
import { generateDbml } from './dbmlGenerator';
import { generateSvg } from './svgGenerator';
import { DBConfiguration } from './types';
import { logger } from './logger';

async function run(): Promise<void> {
    try {
        logger.info('Starting DBML and SVG generation process');

        const dbConfig: DBConfiguration = {
            host: getInput('DB_HOST', { required: true }),
            port: parseInt(getInput('DB_PORT') || '5432'),
            database: getInput('DB_NAME', { required: true }),
            schema: getInput('DB_SCHEMA_NAME') || 'public',
            user: getInput('DB_USERNAME', { required: true }),
            password: getInput('DB_PASSWORD', { required: true })
        };

        const dbmlOutputLocation = getInput('DBML_OUTPUT_LOCATION', {
            required: true
        });
        const svgOutputLocation = dbmlOutputLocation.replace('.dbml', '.svg');

        await generateDbml(dbConfig, dbmlOutputLocation);
        logger.info(`DBML file generated at: ${dbmlOutputLocation}`);

        await generateSvg(dbmlOutputLocation, svgOutputLocation);
        logger.info(`SVG file generated at: ${svgOutputLocation}`);

        logger.info('DBML and SVG generation process completed successfully!');
    } catch (error) {
        if (error instanceof Error) {
            logger.error(`Error occurred: ${error}`);
            setFailed(error.message);
        } else {
            logger.error('Unknown error occurred...');
            setFailed('Unknown error occurred...');
        }
    }
}

run();
