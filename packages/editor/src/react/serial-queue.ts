/**
 * Runs async tasks strictly one after another, even when an earlier task fails.
 * The editor is a singleton: creating the next one must wait until the previous one has finished
 * saving and releasing its resources.
 */
export function createSerialQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const next = tail.then(task, task);
    tail = next.catch(() => {});
    return next;
  };
}
