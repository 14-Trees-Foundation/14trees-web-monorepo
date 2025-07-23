import async from "async";

export type Task<T> = () => Promise<T>;

/**
 * Runs tasks with limited concurrency using the async library.
 * @param tasks Array of task functions (functions that return promises).
 * @param concurrency Number of tasks to run concurrently.
 * @returns A promise that resolves with the results of all tasks.
 */
async function runWithConcurrency<T>(tasks: Task<T>[], concurrency: number): Promise<T[]> {
  return new Promise((resolve, reject) => {
    // Wrap tasks in the async.parallelLimit format
    const wrappedTasks = tasks.map(task => {
      return async () => {
        return await task();
      };
    });

    // Run tasks with limited concurrency
    async.parallelLimit(wrappedTasks, concurrency, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results as T[]);
      }
    });
  });
}

export default runWithConcurrency;
