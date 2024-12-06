# @instun/semaphore

@instun/semaphore is an asynchronous semaphore module designed for use in fibjs, Node.js, browser, and React Native environments. It allows you to control access to a limited resource by multiple asynchronous operations.

## Installation

You can install the module using npm:

```sh
fibjs --install @instun/semaphore
```

## Usage

### Creating a Semaphore

To create a semaphore, require the module and initialize it with the desired number of permits:

```js
const createSemaphore = require('@instun/semaphore');
const semaphore = createSemaphore(128); // Default is 128 permits
```

The permits parameter must be a positive integer. An error will be thrown if an invalid value is provided.

### Acquiring a Permit

To acquire a permit, call the `acquire` method. If a permit is available, it will be granted immediately. Otherwise, the method will return a promise that resolves when a permit becomes available.

```js
async function task() {
    await semaphore.acquire();
    try {
        // Perform your task here
    } finally {
        semaphore.release();
    }
}
```

You can also specify a timeout for the acquire operation:

```js
try {
    await semaphore.acquire(1000); // Wait up to 1000ms
    // Permit acquired
} catch (err) {
    // Timeout occurred
}
```

### Releasing a Permit

To release a permit, call the `release` method. This will either resolve a pending promise or increase the count of available permits.

```js
semaphore.release();
```

An error will be thrown if you try to release more permits than were acquired.

### Checking Semaphore State

The semaphore provides methods to check its current state:

```js
// Get the number of available permits
const available = semaphore.availablePermits();

// Get the number of tasks waiting in queue
const queueLength = semaphore.getQueueLength();
```

## API

### acquire([timeout])

```js
semaphore.acquire();
// or
semaphore.acquire(timeoutMs);
```

Acquires a permit. If a permit is available, it is granted immediately. Otherwise, it returns a promise that resolves when a permit becomes available.

- `timeout` (optional): Maximum time to wait in milliseconds. If the timeout is reached before a permit is acquired, the promise is rejected with a timeout error.

### release()

```js
semaphore.release();
```

Releases a permit. If there are any pending promises, the first one in the queue is resolved (FIFO order). If no promises are pending, the count of available permits is increased.

Throws an error if called more times than `acquire()`.

### availablePermits()

```js
const available = semaphore.availablePermits();
```

Returns the current number of available permits.

### getQueueLength()

```js
const queueLength = semaphore.getQueueLength();
```

Returns the current number of tasks waiting to acquire a permit.

## Examples

### Basic Usage

```js
const createSemaphore = require('@instun/semaphore');
const semaphore = createSemaphore(3); // Allow up to 3 concurrent tasks

async function performTask(taskId) {
    await semaphore.acquire();
    try {
        console.log(`Task ${taskId} is running`);
        // Simulate an asynchronous operation
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Task ${taskId} is completed`);
    } finally {
        semaphore.release();
    }
}

// Create multiple tasks
for (let i = 1; i <= 10; i++) {
    performTask(i);
}
```

### With Timeout

```js
const semaphore = createSemaphore(1);

async function timeoutTask() {
    try {
        await semaphore.acquire(1000); // Wait up to 1 second
        // Do something with the resource
        semaphore.release();
    } catch (err) {
        console.log('Failed to acquire permit within timeout');
    }
}
```

### Resource Pool

```js
const semaphore = createSemaphore(5); // Pool of 5 resources

async function useResource() {
    await semaphore.acquire();
    try {
        console.log(`Resource acquired. ${semaphore.availablePermits()} remaining`);
        // Use the resource
        await someAsyncOperation();
    } finally {
        semaphore.release();
        console.log(`Resource released. Queue length: ${semaphore.getQueueLength()}`);
    }
}
```

## Error Handling

Handling errors is crucial when using semaphores. Always ensure that permits are correctly released even if an error occurs during task execution:

```js
async function taskWithErrorHandling() {
    await semaphore.acquire();
    try {
        // Perform a task that might throw an error
        await riskyOperation();
    } catch (error) {
        // Handle the error
        console.error('Operation failed:', error);
    } finally {
        // Always release the permit
        semaphore.release();
    }
}
```

## Best Practices

1. Always use try/finally to ensure permits are released
2. Consider using timeouts for acquire operations to prevent deadlocks
3. Monitor queue length to detect potential bottlenecks
4. Use appropriate permit counts based on your resource constraints
5. Keep critical sections (code between acquire and release) as short as possible

## License

This project is licensed under the MIT License. See the LICENSE file for details.
