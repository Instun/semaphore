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

### Releasing a Permit

To release a permit, call the `release` method. This will either resolve a pending promise or increase the count of available permits.

```js
semaphore.release();
```

## API

### acquire

```js
semaphore.acquire();
```

Acquires a permit. If a permit is available, it is granted immediately. Otherwise, it returns a promise that resolves when a permit becomes available.

### release

```js
semaphore.release();
```

Releases a permit. If there are any pending promises, the first one in the queue is resolved. If no promises are pending, the count of available permits is increased.

## Example

Here is a more detailed example demonstrating how to use the @instun/semaphore module in a real-world application:

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

In this example, we create a semaphore that allows up to 3 concurrent tasks. Then, we create 10 tasks, each of which runs after acquiring a permit and releases the permit upon completion. This ensures that at most 3 tasks are running at any given time.

## Error Handling

Handling errors is crucial when using semaphores. Ensure that permits are correctly released even if an error occurs during task execution. You can use a `try...finally` statement to ensure this:

```js
async function taskWithErrorHandling() {
    await semaphore.acquire();
    try {
        // Perform a task that might throw an error
        throw new Error('Something went wrong');
    } catch (error) {
        console.error('Error occurred:', error);
    } finally {
        semaphore.release();
    }
}
```

In this example, even if the task throws an error, the `semaphore.release()` in the `finally` block will still be executed, ensuring that the permit is correctly released.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
