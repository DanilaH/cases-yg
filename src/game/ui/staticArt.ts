import Phaser from 'phaser';

export const addCoverArt = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  textureKey: string,
  width: number,
  height: number,
): Phaser.GameObjects.Image | null => {
  if (!scene.textures.exists(textureKey)) return null;

  const image = scene.add.image(width / 2, height / 2, textureKey).setOrigin(0.5);
  const scale = Math.max(width / Math.max(1, image.width), height / Math.max(1, image.height));
  image.setScale(scale);
  root.add(image);
  return image;
};
