export function createTemplate(htmlcontents, hoststyles = null) {
  const template = document.createElement("template");
  template.innerHTML = htmlcontents;

  if (hoststyles) {
    const style = document.createElement("style");
    // stringify styles, if any specified
    style.textContent =
      ":host{" +
      Object.entries(hoststyles)
        .map(([prop, value]) => `${prop}:${value};`)
        .join("") +
      "}";
    template.content.prepend(style);
  }

  const link = document.head.querySelector("link[rel='stylesheet']");
  template.content.prepend(link.cloneNode(true));

  return template;
}
