const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const XHTML_NAMESPACE = "http://www.w3.org/1999/xhtml";
const PNG_TYPE = "image/png";
const OPAQUE_CARD_BACKGROUND = "#0a2b25";
const MAX_WEBKIT_IMAGE_DIMENSION = 8_192;
const MAX_WEBKIT_IMAGE_AREA = 8_192 * 8_192;

const isSafeImageSize = (width: number, height: number, scale: number) => {
  const outputWidth = Math.ceil(width * scale);
  const outputHeight = Math.ceil(height * scale);
  return (
    outputWidth <= MAX_WEBKIT_IMAGE_DIMENSION &&
    outputHeight <= MAX_WEBKIT_IMAGE_DIMENSION &&
    outputWidth * outputHeight <= MAX_WEBKIT_IMAGE_AREA
  );
};

export function planPayoutImageScale(element: HTMLElement) {
  const width = Math.ceil(element.getBoundingClientRect().width);
  const height = Math.ceil(element.scrollHeight);

  if (isSafeImageSize(width, height, 2)) return 2;
  if (isSafeImageSize(width, height, 1)) return 1;
  return null;
}

const copyComputedStyles = (source: Element, target: Element) => {
  const computed = getComputedStyle(source);
  const targetElement = target as HTMLElement;

  for (const property of computed) {
    targetElement.style.setProperty(
      property,
      computed.getPropertyValue(property),
      computed.getPropertyPriority(property),
    );
  }

  const sourceChildren = Array.from(source.children);
  const targetChildren = Array.from(target.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) copyComputedStyles(child, targetChild);
  });
};

const loadSvgImage = (svgMarkup: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The payout schedule image could not be rendered."));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
  });

const encodePng = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("The payout schedule image could not be encoded."));
    }, PNG_TYPE);
  });

export async function renderPayoutScheduleImage(
  element: HTMLElement,
  scale: number,
) {
  await document.fonts?.ready;

  const bounds = element.getBoundingClientRect();
  const width = Math.ceil(bounds.width);
  const height = Math.ceil(element.scrollHeight);
  const clone = element.cloneNode(true) as HTMLElement;
  copyComputedStyles(element, clone);
  clone.style.margin = "0";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgMarkup = `<svg xmlns="${SVG_NAMESPACE}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%"><div xmlns="${XHTML_NAMESPACE}">${serialized}</div></foreignObject></svg>`;
  const image = await loadSvgImage(svgMarkup);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width * scale);
  canvas.height = Math.ceil(height * scale);
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("The payout schedule image could not be created.");
  }

  context.fillStyle = OPAQUE_CARD_BACKGROUND;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.scale(scale, scale);
  context.drawImage(image, 0, 0, width, height);
  return encodePng(canvas);
}
