import './server';
import { runtime } from './runtime';
import { ChromeLaunchService } from '../main/services/chrome';

before(async () => {
    await runtime.app.beforeStart();
    await runtime.app.container.get(ChromeLaunchService).launch();
});
