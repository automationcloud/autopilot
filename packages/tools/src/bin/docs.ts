import { buildDocs } from '../main';

buildDocs().catch(err => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
});
