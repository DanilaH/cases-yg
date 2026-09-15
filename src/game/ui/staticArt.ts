import Phaser from 'phaser';

const getViewportBoundsInContainer = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
): { left: number; top: number; right: number; bottom: number } => {
  const matrix = root.getWorldTransformMatrix();
  const corners = [
    matrix.applyInverse(0, 0),
    matrix.applyInverse(scene.scale.width, 0),
    matrix.applyInverse(0, scene.scale.height),
    matrix.applyInverse(scene.scale.width, scene.scale.height),
  ];

  return {
    left: Math.min(...corners.map(({ x }) => x)),
    top: Math.min(...corners.map(({ y }) => y)),
    right: Math.max(...corners.map(({ x }) => x)),
    bottom: Math.max(...corners.map(({ y }) => y)),
  };
};

export const addCoverArt = (
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  textureKey: string,
  width: number,
  height: number,
): Phaser.GameObjects.Image | null => {
  if (!scene.textures.exists(textureKey)) return null;

  // Gameplay chrome intentionally lives on a capped logical surface, but cover
  // art must never inherit that cap and expose side bars on extra-wide screens.
  // Resolve the real canvas rectangle back into this container's local space,
  // then cover the union of that viewport and the authored logical surface.
  const viewport = getViewportBoundsInContainer(scene, root);
  const left = Math.min(0, viewport.left);
  const top = Math.min(0, viewport.top);
  const right = Math.max(width, viewport.right);
  const bottom = Math.max(height, viewport.bottom);
  const coverWidth = Math.max(1, right - left);
  const coverHeight = Math.max(1, bottom - top);

  const image = scene.add
    .image(left + coverWidth / 2, top + coverHeight / 2, textureKey)
    .setOrigin(0.5);
  const scale = Math.max(
    coverWidth / Math.max(1, image.width),
    coverHeight / Math.max(1, image.height),
  );
  image.setScale(scale);
  root.add(image);
  return image;
};
