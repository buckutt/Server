const APIError = require('../errors/APIError');

/**
 * Retrieve the point id from the SSL certificate fingerprint
 * @param {Object} connector HTTP/Socket.IO connector
 */
module.exports = connector => connector.models.Device
    .where({
        fingerprint: connector.fingerprint
    })
    .fetch({
        withRelated: [
            'wikets',
            'wikets.point',
            'wikets.period',
            'wikets.period.event'
        ]
    })
    .then(res => ((res) ? res.toJSON() : null))
    .then((device) => {
        /* istanbul ignore if */
        if (!device || (!device.isUser && device.wikets.length === 0)) {
            return Promise.reject(
                new APIError(module, 404, 'Device not found', { fingerprint: connector.fingerprint })
            );
        }

        let minPeriod = Infinity;

        let handled = false;

        // Filters: allow an empty point but not a deleted point
        device.wikets
            .filter(wiket => wiket.period.event && wiket.period.event.id
                && ((wiket.point_id && wiket.point.id) || !wiket.point_id))
            .forEach((wiket) => {
                const period = wiket.period;
                const point = wiket.point;

                const diff = period.end - period.start;

                if (period.start > connector.date || period.end < connector.date) {
                    return;
                }

                if (diff < minPeriod) {
                    connector.point_id = point.id;
                    connector.event_id = period.event.id;
                    minPeriod          = diff;

                    connector.device = device;
                    connector.point  = point;
                    connector.event  = period.event;

                    connector.details = {
                        device: connector.device.name,
                        event : connector.event.name,
                        point : connector.point.name,
                        path  : connector.path,
                        method: connector.method
                    };

                    handled = true;
                }
            });

        if (!handled) {
            return Promise.reject(new APIError(module, 404, 'No assigned points'));
        }

        connector.header('event', connector.event_id);
        connector.header('eventName', connector.event.name);
        connector.header('point', connector.point_id);
        connector.header('pointName', connector.point.name);
        connector.header('device', device.id);

        return Promise.resolve();
    });
