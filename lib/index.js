module.exports = function (permits = 128) {
    var resolvers = [];
    var count = 0;

    return {
        acquire: function () {
            if (count < permits) {
                count++;
                return;
            }

            return new Promise((resolve, reject) => resolvers.push(resolve));
        },
        release: function () {
            if (resolvers.length)
                resolvers.shift()();
            else if (count > 0)
                count--;
            else
                throw new Error("Semaphore released too many times");
        }
    };
}
