import APIError from '../errors/APIError';

/**
 * Retrieve the point id from the SSL certificate fingerprint
 * @param {Request}  req  Express request
 * @param {Response} res  Express response
 * @param {Function} next Next middleware
 */
export default function pointId (req, res, next) {
    const fingerprint = req.connection.getPeerCertificate().fingerprint.replace(/:/g, '').trim();

    const Device = req.app.locals.models.Device;
    const Period = req.app.locals.models.Period;

    let device;
    let chosenPoint = null;

    Device
        .getAll(fingerprint, {
            index: 'fingerprint'
        })
        .getJoin({
            periodPoints: true
        })
        .run()
        .then(devices => {
            /* istanbul ignore if */
            if (devices.length === 0) {
                return false;
            }

            device = devices[0];

            const periodPoints = device.periodPoints;

            let minPeriod = Infinity;

            const promises = periodPoints.map(periodPoint =>
                Period.get(periodPoint.Period_id).run().then(period => {
                    const diff = period.end - period.start;

                    if (diff < minPeriod) {
                        chosenPoint = periodPoint.Point_id;
                        minPeriod   = diff;
                    }
                })
            );

            return Promise.all(promises);
        })
        .then(ok => {
            /* istanbul ignore if */
            if (!ok) {
                return next(new APIError(404, 'Device not found', fingerprint));
            }

            req.Point_id = chosenPoint;

            res.header('point', req.Point_id);
            res.header('device', device.id);

            return next();
        });
}
