/* istanbul ignore next */
function delay(ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
};

module.exports = function retry(
    promise = new Promise(),
    maxTries = 5,
    interval = 3000,
    onTrying) {

    let retriedPromise = promise();

    for (let i = 0; i < maxTries; i = i + 1) {
      /* istanbul ignore next */
      retriedPromise = retriedPromise
        .catch(() => {
          return delay(interval).then(() => {
            if (typeof onTrying === 'function') {
              onTrying(i + 1);
            }

            return promise();
          });
        });
    }

    return retriedPromise;
};
