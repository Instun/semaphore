module.exports = function (permits = 128) {
    if (!Number.isInteger(permits) || permits <= 0) {
        throw new Error('Permits must be a positive integer');
    }

    var resolvers = [];
    var count = 0;

    return {
        acquire: function (timeout) {
            if (count < permits) {
                count++;
                return Promise.resolve();
            }

            return new Promise((resolve, reject) => {
                const resolver = () => resolve();
                resolvers.push(resolver);

                if (timeout) {
                    setTimeout(() => {
                        const index = resolvers.indexOf(resolver);
                        if (index !== -1) {
                            resolvers.splice(index, 1);
                            reject(new Error('Acquire timeout'));
                        }
                    }, timeout);
                }
            });
        },
        release: function () {
            if (resolvers.length) {
                resolvers.shift()();
            } else if (count > 0) {
                count--;
            } else {
                throw new Error('Semaphore released too many times: current count is 0');
            }
        },
        availablePermits: function() {
            return permits - count;
        },
        getQueueLength: function() {
            return resolvers.length;
        }
    };
}
