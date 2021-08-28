export default function copyToClipboard(text) {
  const textarea = document.createElement("textarea");
  document.body.appendChild(textarea);

  textarea.value = text;

  textarea.focus();
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}
