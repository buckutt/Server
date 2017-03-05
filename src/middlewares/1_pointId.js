const APIError = require('../errors/APIError');

/**
 * Retrieve the point id from the SSL certificate fingerprint
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = (connector) => {
    const Device = connector.models.Device;

    let device;

    Device
        .getAll(connector.fingerprint, {
            index: 'fingerprint'
        })
        .getJoin({
            periodPoints: {
                period: {
                    event: true
                },
                point: true
            }
        })
        .run()
        .then((devices) => {
            /* istanbul ignore if */
            if (devices.length === 0 || devices[0].periodPoints.length === 0) {
                return connector.next(new APIError(404, 'Device not found', { fingerprint: connector.fingerprint }));
            }

            device = devices[0];

            const periodPoints = device.periodPoints;

            let minPeriod = Infinity;

            periodPoints.forEach((periodPoint) => {
                const diff = periodPoint.period.end - periodPoint.period.start;

                if (diff < minPeriod) {
                    connector.Point_id = periodPoint.Point_id;
                    connector.Event_id = periodPoint.period.Event_id;
                    minPeriod          = diff;

                    connector.device = device;
                    connector.point  = periodPoint.point;
                    connector.event  = periodPoint.period.event;
                }
            })

            connector.header('event', connector.Event_id);
            connector.header('eventName', connector.event.name);
            connector.header('point', connector.Point_id);
            connector.header('pointName', connector.point.name);
            connector.header('device', device.id);

            return connector.next();
        })
        .catch((err) => {
            /* istanbul ignore next */
            connector.next(new APIError(500, 'Unknown error', err));
        });
};
