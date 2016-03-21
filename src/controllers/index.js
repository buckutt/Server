import path         from 'path';
import { Router }   from 'express';
import { walkSync } from 'fs-walk';
import middlewares  from '../middlewares';

const router = new Router('/');

/**
 * Use every middlewares
 */
Object.keys(middlewares).forEach(key => router.use(middlewares[key]));

/**
 * Recursively use every subrouters
 */
walkSync(__dirname, (basedir, f) => {
    if (!(f.slice(0, -3) !== 'index' && f.slice(-3) === '.js')) {
        return;
    }

    router.use(require(path.join(basedir, f)).default);
});

export default router;
