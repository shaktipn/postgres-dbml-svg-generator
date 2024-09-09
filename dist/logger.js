"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const core_1 = require("@actions/core");
exports.logger = {
    info: (message) => (0, core_1.info)(`INFO: ${message}`),
    warn: (message) => (0, core_1.warning)(`WARNING: ${message}`),
    error: (message) => (0, core_1.error)(`ERROR: ${message}`)
};
