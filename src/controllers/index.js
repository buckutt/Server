import fs      from 'fs';
import path    from 'path';
import { Router } from 'express';
import { walkSync } from 'fs-walk';

const router = new Router('/');

walkSync(__dirname, function(basedir, f) {
    if (!(f.slice(0, -3) !== 'index' && f.slice(-3) === '.js')) {
        return;
    }

	let URI = basedir.split(__dirname)[1] + '/' || '/';
    URI += f.slice(0, -3);

    console.log(URI);
    console.log(require(path.join(basedir, f)));

    router.use(URI, require(path.join(basedir, f)).default);
});

export default router;
