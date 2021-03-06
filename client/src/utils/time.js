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

export function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/*
  throttle limits the call to once per interval.
  If start is true, makes the call at the beginning of interval,
  otherwise makes the call at the end of the interval.
*/
export function throttle(func, wait, start = false) {
  let timeout = null;
  return function (...args) {
    const context = this;
    if (timeout !== null) return;
    timeout = setTimeout(() => {
      if (!start) func.apply(context, args);
      timeout = null;
    }, wait);
    if (start) func.apply(context, args);
  };
}
