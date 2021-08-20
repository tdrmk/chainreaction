export function ignoreErr(func) {
  try {
    return func();
  } catch (err) {
    // caught by `unhandledrejection` at window
    Promise.reject(err);
    return null;
  }
}
