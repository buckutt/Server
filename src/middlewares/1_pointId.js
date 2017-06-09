const APIError = require('../errors/APIError');

/**
 * Retrieve the point id from the SSL certificate fingerprint
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = (connector) => {
    const Device = connector.models.Device;

    let device;

    return Device
        .getAll(connector.fingerprint, {
            index: 'fingerprint'
        })
        .filter({ isRemoved: false })
        .embed({
            points: {
                _through: {
                    period: {
                        event: true
                    }
                }
            }
        })
        .run()
        .then((devices) => {
            /* istanbul ignore if */
            if (devices.length === 0 || devices[0].points.length === 0) {
                return Promise.reject(new APIError(404, 'Device not found', { fingerprint: connector.fingerprint }));
            }

            device = devices[0];

            let minPeriod = Infinity;

            device.points.forEach((point) => {
                const diff = point._through.period.end - point._through.period.start;

                if (diff < minPeriod) {
                    connector.Point_id = point.id;
                    connector.Event_id = point._through.period.event.id;
                    minPeriod          = diff;

                    connector.device = device;
                    connector.point  = point;
                    connector.event  = point._through.period.event;

                    connector.details = {
                        device: connector.device.name,
                        event : connector.event.name,
                        point : connector.point.name,
                        path  : connector.path,
                        method: connector.method
                    };
                }
            });

            connector.header('event', connector.Event_id);
            connector.header('eventName', connector.event.name);
            connector.header('point', connector.Point_id);
            connector.header('pointName', connector.point.name);
            connector.header('device', device.id);

            return Promise.resolve();
        });
};
