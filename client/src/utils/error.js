export function ignoreErr(func) {
  try {
    return func();
  } catch (err) {
    console.error(err);
    return null;
  }
}
