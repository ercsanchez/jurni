import { loadEnvConfig } from '@next/env';

import path from 'node:path';

// const rootDirPath = process.cwd()
// process.cwd() will produce dir path of the file which imported envConfig

const rootDirPath = path.resolve(`${__dirname}`, '..');
// console.log("rootDirPath", rootDirPath)

loadEnvConfig(rootDirPath);
