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
exports.generateDbml = generateDbml;
const pg_1 = require("pg");
const promises_1 = require("fs/promises");
const logger_1 = require("./logger");
/**
 * Generates a DBML file based on the database configuration.
 * @param config The database configuration which is to be used to get the details of the relevant schema to generate the DBML.
 * @param outputLocation The full path to where the DMBL is to be generated.
 */
function generateDbml(config, outputLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new pg_1.Client({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password
        });
        try {
            logger_1.logger.info('Attempting to connect to database...');
            yield client.connect();
            logger_1.logger.info('Connected to database.');
            const tables = yield getTables(client, config.schema);
            logger_1.logger.warn(tables.toString()); // debug
            let dbmlContent = "Project {\n  database_type: 'PostgreSQL'\n}\n\n";
            for (const table of tables) {
                const columns = yield getColumns(client, config.schema, table);
                //debug
                columns.map((col) => {
                    logger_1.logger.warn(`${col.columnName} | ${col.dataType} | ${col.columnDefault} | ${col.columnDefault}`);
                });
                const primaryKeys = yield getPrimaryKeys(client, config.schema, table);
                logger_1.logger.warn(primaryKeys.toString()); //debug
                dbmlContent += generateTableDbml(table, columns, primaryKeys);
            }
            const foreignKeys = yield getForeignKeys(client, config.schema);
            dbmlContent += generateForeignKeyDbml(foreignKeys);
            dbmlContent = `
        Table users {
            id integer
            username varchar
            role varchar
            created_at timestamp
        }

        Table posts {
            id integer [primary key]
            title varchar
            body text [note: 'Content of the post']
            user_id integer
            created_at timestamp
        }

        Ref: posts.user_id > users.id
        `.trimStart();
            yield (0, promises_1.writeFile)(outputLocation, dbmlContent);
            logger_1.logger.info(dbmlContent);
            logger_1.logger.info('DBML content has been written to file.');
        }
        catch (error) {
            logger_1.logger.error(`Error during DBML file generation: ${error}`);
            throw new Error('Failed to generate DBML file.');
        }
        finally {
            yield client.end();
            logger_1.logger.info('Database connection is now closed.');
        }
    });
}
function getTables(client, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE';
  `;
        const result = yield client.query(query, [schema]);
        return result.rows.map((row) => row.table_name);
    });
}
function getColumns(client, schema, table) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name = $2
    ORDER BY ordinal_position;
  `;
        const result = yield client.query(query, [schema, table]);
        return result.rows;
    });
}
function getPrimaryKeys(client, schema, table) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    SELECT c.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage AS ccu USING (constraint_schema, constraint_name)
    JOIN information_schema.columns AS c ON c.table_schema = tc.constraint_schema
      AND tc.table_name = c.table_name AND ccu.column_name = c.column_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = $1 AND tc.table_name = $2;
  `;
        const result = yield client.query(query, [schema, table]);
        return result.rows.map((row) => row.column_name);
    });
}
function getForeignKeys(client, schema) {
    return __awaiter(this, void 0, void 0, function* () {
        const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = $1;
  `;
        const result = yield client.query(query, [schema]);
        return result.rows;
    });
}
function generateTableDbml(table, columns, primaryKeys) {
    let dbml = `Table ${table} {\n`;
    for (const column of columns) {
        let columnDef = `  ${column.columnName} ${column.dataType}`;
        if (column.isNullable === 'NO') {
            columnDef += ' [not null]';
        }
        if (column.columnDefault) {
            columnDef += ` [default: ${column.columnDefault}]`;
        }
        dbml += columnDef + '\n';
    }
    if (primaryKeys.length > 0) {
        dbml += `\n  indexes {\n    (${primaryKeys.join(', ')}) [pk]\n  }\n`;
    }
    dbml += '}\n\n';
    return dbml;
}
function generateForeignKeyDbml(foreignKeys) {
    return foreignKeys
        .map((fk) => `Ref: ${fk.tableName}.${fk.columnName} > ${fk.foreignTableName}.${fk.foreignColumnName}\n`)
        .join('');
}
