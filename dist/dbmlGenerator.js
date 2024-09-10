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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDbml = generateDbml;
// import { Client } from 'pg';
const promises_1 = require("fs/promises");
const logger_1 = require("./logger");
const path_1 = __importDefault(require("path"));
const connector_1 = require("@dbml/connector");
const core_1 = require("@dbml/core");
/**
 * Generates a DBML file based on the database configuration.
 * @param config The database configuration which is to be used to get the details of the relevant schema to generate the DBML.
 * @param outputLocation The full path to where the DMBL is to be generated.
 */
function generateDbml(config, outputLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        // const client = new Client({
        //     host: config.host,
        //     port: config.port,
        //     database: config.database,
        //     user: config.user,
        //     password: config.password
        // });
        try {
            logger_1.logger.info('Attempting to connect to database...');
            // await client.connect();
            logger_1.logger.info('Connected to database.');
            const connection = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}?schemas=${config.schema}`; //"jdbc:postgresql://$dbHost:$dbPortNumber/$dbName"
            const databaseType = 'postgres';
            const schemaJson = yield connector_1.connector.fetchSchemaJson(connection, databaseType);
            const dbmlContent = core_1.importer.generateDbml(schemaJson);
            // const tables = await getTables(client, config.schema);
            // logger.warn(tables.toString()); // debug
            // let dbmlContent = "Project {\n  database_type: 'PostgreSQL'\n}\n\n";
            // for (const table of tables) {
            //     const columns = await getColumns(client, config.schema, table);
            //     //debug
            //     columns.map((col) => {
            //         logger.warn(
            //             `${col.columnName} | ${col.dataType} | ${col.isNullable} | ${col.default}`
            //         );
            //     });
            //     const primaryKeys = await getPrimaryKeys(client, config.schema, table);
            //     logger.warn(primaryKeys.toString()); //debug
            //     dbmlContent += generateTableDbml(table, columns, primaryKeys);
            // }
            // const foreignKeys = await getForeignKeys(client, config.schema);
            // dbmlContent += generateForeignKeyDbml(foreignKeys);
            // dbmlContent = dbmlContent.trim();
            yield (0, promises_1.writeFile)(outputLocation, dbmlContent);
            logger_1.logger.info(dbmlContent); //debug
            logger_1.logger.info(`DBML content has been written to file: ${path_1.default.resolve(outputLocation)}`);
        }
        catch (error) {
            logger_1.logger.error(`Error during DBML file generation: ${error}`);
            throw new Error('Failed to generate DBML file.');
        }
        finally {
            // await client.end();
            logger_1.logger.info('Database connection is now closed.');
        }
    });
}
// async function getTables(client: Client, schema: string): Promise<string[]> {
//     const query = `
//     SELECT table_name
//     FROM information_schema.tables
//     WHERE table_schema = $1 AND table_type = 'BASE TABLE';
//   `;
//     const result = await client.query(query, [schema]);
//     return result.rows.map((row) => row.table_name);
// }
// async function getColumns(client: Client, schema: string, table: string): Promise<ColumnInfo[]> {
//     const query = `
//     SELECT column_name, data_type, is_nullable, column_default
//     FROM information_schema.columns
//     WHERE table_schema = $1 AND table_name = $2
//     ORDER BY ordinal_position;
//   `;
//     const result = await client.query(query, [schema, table]);
//     return result.rows.map((row) => ({
//         columnName: row.column_name,
//         dataType: row.data_type,
//         isNullable: row.is_nullable,
//         default: row.column_default
//     }));
// }
// async function getPrimaryKeys(client: Client, schema: string, table: string): Promise<string[]> {
//     const query = `
//     SELECT c.column_name
//     FROM information_schema.table_constraints tc
//     JOIN information_schema.constraint_column_usage AS ccu
//     USING (constraint_schema, constraint_name)
//     JOIN information_schema.columns AS c
//     ON c.table_schema = tc.constraint_schema
//       AND tc.table_name = c.table_name
//       AND ccu.column_name = c.column_name
//     WHERE tc.constraint_type = 'PRIMARY KEY'
//     AND tc.table_schema = $1
//     AND tc.table_name = $2;
//   `;
//     const result = await client.query(query, [schema, table]);
//     return result.rows.map((row) => row.column_name);
// }
// async function getForeignKeys(client: Client, schema: string): Promise<ForeignKeyInfo[]> {
//     const query = `
//     SELECT
//       tc.table_name,
//       kcu.column_name,
//       ccu.table_name AS foreign_table_name,
//       ccu.column_name AS foreign_column_name
//     FROM information_schema.table_constraints AS tc
//     JOIN information_schema.key_column_usage AS kcu
//       ON tc.constraint_name = kcu.constraint_name
//       AND tc.table_schema = kcu.table_schema
//     JOIN information_schema.constraint_column_usage AS ccu
//       ON ccu.constraint_name = tc.constraint_name
//       AND ccu.table_schema = tc.table_schema
//     WHERE tc.constraint_type = 'FOREIGN KEY'
//     AND tc.table_schema = $1;
//   `;
//     const result = await client.query(query, [schema]);
//     return result.rows.map((row) => ({
//         tableName: row.table_name,
//         columnName: row.column_name,
//         foreignTableName: row.foreign_table_name,
//         foreignColumnName: row.foreign_column_name
//     }));
// }
// function generateTableDbml(table: string, columns: ColumnInfo[], primaryKeys: string[]): string {
//     let dbml = `Table ${table} {\n`;
//     for (const column of columns) {
//         let columnDef = `  ${column.columnName} ${column.dataType}`;
//         if (column.isNullable === 'NO') {
//             columnDef += ' [not null]';
//         }
//         if (column.default) {
//             columnDef += ` [default: ${column.default}]`;
//         }
//         dbml += columnDef + '\n';
//     }
//     if (primaryKeys.length > 0) {
//         dbml += `\n  indexes {\n    (${primaryKeys.join(', ')}) [pk]\n  }\n`;
//     }
//     dbml += '}\n\n';
//     return dbml;
// }
// function generateForeignKeyDbml(foreignKeys: ForeignKeyInfo[]): string {
//     return foreignKeys
//         .map(
//             (fk) =>
//                 `Ref: ${fk.tableName}.${fk.columnName} > ${fk.foreignTableName}.${fk.foreignColumnName}\n`
//         )
//         .join('');
// }
