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

    let device;

    Device
        .getAll(fingerprint, {
            index: 'fingerprint'
        })
        .getJoin({
            periodPoints: {
                period: {
                    event: true
                }
            }
        })
        .run()
        .then(devices => {
            /* istanbul ignore if */
            if (devices.length === 0 || devices[0].periodPoints.length === 0) {
                return next(new APIError(404, 'Device not found', fingerprint));
            }

            device = devices[0];

            const periodPoints = device.periodPoints;

            let minPeriod = Infinity;

            periodPoints.forEach(periodPoint => {
                const diff = periodPoint.period.end - periodPoint.period.start;

                if (diff < minPeriod) {
                    req.Point_id = periodPoint.Point_id;
                    req.Event_id = periodPoint.Event_id;
                    minPeriod    = diff;

                    req.device = device;
                    req.point  = periodPoint.period;
                    req.event  = periodPoint.period.event;
                }
            });

            res.header('event', req.Event_id);
            res.header('point', req.Point_id);
            res.header('device', device.id);

            return next();
        });
}
