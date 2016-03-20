import fs      from 'fs';
import path    from 'path';
import { Router } from 'express';
import { walkSync } from 'fs-walk';

const router = new Router('/');

walkSync(__dirname, function(basedir, f) {
    if (!(f.slice(0, -3) !== 'index' && f.slice(-3) === '.js')) {
        return;
    }

    router.use(require(path.join(basedir, f)).default);
});

export default router;
