import 'reflect-metadata';
import { WorkerProductionApp } from '../main';

process.env.ENGINE_ENV = 'worker';

const app = new WorkerProductionApp();

main().catch(error => {
    app.logger.error('Failed to start', { error });
    process.exit(1);
});

async function main() {
    await app.start();
}
