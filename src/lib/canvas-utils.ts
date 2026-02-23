// 根据图片 URL 创建一个 HTMLImageElement，并封装成 Promise，方便在 async/await 中使用
// 加上 crossOrigin="anonymous" 可以避免部分跨域图片在绘制到 canvas 后导致“画布被污染”
export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    // 加载成功时返回 image 实例
    image.addEventListener("load", () => resolve(image));
    // 加载失败时将错误抛给 Promise 调用方
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

// 给定原始宽高和旋转角度，计算图片旋转之后所占用的包围盒尺寸
// 例如：一张 w*h 的图旋转 45° 后，为了完全容纳它，需要一个更大的宽高
export function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

// 核心裁剪函数
// 参数说明：
// - imageSrc: 原始图片的 URL（通常是 URL.createObjectURL 得到的本地预览地址）
// - pixelCrop: 像素级裁剪区域 { x, y, width, height }，通常来自 react-easy-crop 的 croppedAreaPixels
// - rotation: 旋转角度（单位：度），默认 0
// - flip: 是否水平/垂直翻转，默认都为 false
// 返回值：
// - 成功：返回裁剪后图片对应的 Blob URL（可直接用于 img/src 或 next/image 的 src）
// - 失败：返回 null
export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        resolve(null);
      }
    }, "image/jpeg");
  });
}

export default async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<string | null> {
  const blob = await getCroppedBlob(imageSrc, pixelCrop, rotation, flip);
  return blob ? URL.createObjectURL(blob) : null;
}
