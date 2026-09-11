import Phaser from 'phaser';

import { getRenderPixelRatio } from './renderDensity';

export const installSceneTextSharpness = (scene: Phaser.Scene): void => {
  const applyTextResolution = (gameObject: Phaser.GameObjects.GameObject): void => {
    if (gameObject instanceof Phaser.GameObjects.Text) {
      gameObject.setResolution(getRenderPixelRatio());
    }
  };

  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, applyTextResolution);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, applyTextResolution);
  });
};
