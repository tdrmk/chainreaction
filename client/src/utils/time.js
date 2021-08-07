import debug from "debug";

export function wait(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

export class Deferred {
  constructor(name = "default") {
    this.prevtask = Promise.resolve();
    // for debugging purposes only
    this.count = 0;
    this.debug = debug(`chainreaction:deferred:${name}`);
  }

  chain(callback, delay = 0) {
    const count = this.count++;
    this.debug(`Scheduling the task ${count}`);
    this.prevtask = this.prevtask.then(async () => {
      return new Promise((resolve) =>
        setTimeout(async () => {
          this.debug(`Running the task ${count}`);
          await callback();
          await wait(delay);
          this.debug(`Task complete ${count}`);
          resolve();
        }, 0)
      );
    });
    return this;
  }
}
