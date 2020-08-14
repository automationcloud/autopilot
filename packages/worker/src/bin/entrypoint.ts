import 'reflect-metadata';
import { WorkerProductionApp } from '../main';
import { createUbioSymlink } from '@automationcloud/engine';

process.env.ENGINE_ENV = 'worker';
createUbioSymlink(`${__dirname}/../..`);

const app = new WorkerProductionApp();

main().catch(error => {
    app.logger.error('Failed to start', { error });
    process.exit(1);
});

async function main() {
    await app.start();
}
