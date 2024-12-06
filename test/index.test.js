const test = require('node:test');
const assert = require('node:assert');
const Semaphore = require('../lib/index.js');

test.describe('Semaphore basic functionality', async () => {
    await test.it('should create with default permits', () => {
        const sem = Semaphore();
        assert.equal(sem.availablePermits(), 128);
        assert.equal(sem.getQueueLength(), 0);
    });

    await test.it('should create with custom permits', () => {
        const sem = Semaphore(3);
        assert.equal(sem.availablePermits(), 3);
    });

    await test.it('should throw on invalid permits', () => {
        assert.throws(() => Semaphore(0), /Permits must be a positive integer/);
        assert.throws(() => Semaphore(-1), /Permits must be a positive integer/);
        assert.throws(() => Semaphore(1.5), /Permits must be a positive integer/);
    });

    await test.it('should handle large number of permits', () => {
        const sem = Semaphore(1000000);
        assert.equal(sem.availablePermits(), 1000000);
    });
});

test.describe('Semaphore acquire and release', async () => {
    await test.it('should acquire and release correctly', async () => {
        const sem = Semaphore(2);
        
        await sem.acquire();
        assert.equal(sem.availablePermits(), 1);
        
        await sem.acquire();
        assert.equal(sem.availablePermits(), 0);
        
        sem.release();
        assert.equal(sem.availablePermits(), 1);
    });

    await test.it('should handle queue correctly', async () => {
        const sem = Semaphore(1);
        await sem.acquire();
        
        // This acquire will be queued
        const acquirePromise = sem.acquire();
        assert.equal(sem.getQueueLength(), 1);
        
        sem.release();
        await acquirePromise; // Should resolve now
        assert.equal(sem.getQueueLength(), 0);
    });

    await test.it('should timeout on acquire', async () => {
        const sem = Semaphore(1);
        await sem.acquire();
        
        await assert.rejects(
            sem.acquire(100), // 100ms timeout
            /Acquire timeout/
        );
    });

    await test.it('should throw on excess release', () => {
        const sem = Semaphore(1);
        assert.throws(() => sem.release(), /Semaphore released too many times/);
    });

    await test.it('should handle multiple timeouts correctly', async () => {
        const sem = Semaphore(1);
        await sem.acquire();
        
        const promises = [
            sem.acquire(50),  // 50ms timeout
            sem.acquire(100), // 100ms timeout
            sem.acquire(150)  // 150ms timeout
        ];
        
        await Promise.allSettled(promises).then(results => {
            assert.equal(results.filter(r => r.status === 'rejected').length, 3);
            assert.equal(sem.getQueueLength(), 0);
        });
    });
});

test.describe('Semaphore concurrent operations', async () => {
    await test.it('should handle multiple concurrent operations', async () => {
        const sem = Semaphore(2);
        const results = [];

        // Create 5 concurrent operations
        const operations = Array(5).fill().map(async (_, i) => {
            await sem.acquire();
            results.push(`start-${i}`);
            
            // Simulate some async work
            await new Promise(resolve => setTimeout(resolve, 50));
            
            results.push(`end-${i}`);
            sem.release();
        });

        await Promise.all(operations);

        // Verify that at most 2 operations ran concurrently
        let concurrent = 0;
        let maxConcurrent = 0;
        
        results.forEach(r => {
            if (r.startsWith('start')) concurrent++;
            if (r.startsWith('end')) concurrent--;
            maxConcurrent = Math.max(maxConcurrent, concurrent);
        });

        assert.equal(maxConcurrent, 2);
    });

    await test.it('should handle rapid acquire/release cycles', async () => {
        const sem = Semaphore(1);
        const cycles = 100;
        
        const rapidCycles = async () => {
            for (let i = 0; i < cycles; i++) {
                await sem.acquire();
                sem.release();
            }
        };

        // Run multiple rapid cycles concurrently
        await Promise.all([
            rapidCycles(),
            rapidCycles(),
            rapidCycles()
        ]);

        assert.equal(sem.availablePermits(), 1);
        assert.equal(sem.getQueueLength(), 0);
    });

    await test.it('should maintain FIFO order in queue', async () => {
        const sem = Semaphore(1);
        const order = [];
        
        await sem.acquire();

        // Queue up several acquires
        const promises = Array(3).fill().map((_, i) => {
            return sem.acquire().then(() => {
                order.push(i);
                sem.release();
            });
        });

        // Release after small delay to allow queuing
        setTimeout(() => sem.release(), 50);

        await Promise.all(promises);
        
        // Check if order is maintained
        assert.deepEqual(order, [0, 1, 2]);
    });
});
