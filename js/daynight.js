import * as THREE from 'three';

const DAY_LENGTH = 300;

const SKY_COLORS = {
  dawn: new THREE.Color(0xffa050),
  day: new THREE.Color(0x87ceeb),
  dusk: new THREE.Color(0xff6030),
  night: new THREE.Color(0x0a0a2e),
};

export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    this.time = 0.25;
    this.enabled = true;
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.sunLight.position.set(50, 100, 50);
    scene.add(this.sunLight);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(this.ambientLight);

    this.skyColor = new THREE.Color(0x87ceeb);
    scene.background = this.skyColor;
    scene.fog = new THREE.FogExp2(0x87ceeb, 0.015);
  }

  setFixedColor(sky, sunColor) {
    this.skyColor.set(sky);
    this.scene.background = this.skyColor;
    if (this.scene.fog) this.scene.fog.color.set(sky);
    this.sunLight.color.set(sunColor);
    this.sunLight.intensity = 0.8;
    this.ambientLight.intensity = 0.5;
    this.sunLight.position.set(50, 80, 50);
  }

  update(dt) {
    if (!this.enabled) return;
    this.time += dt / DAY_LENGTH;
    if (this.time > 1) this.time -= 1;

    const sunAngle = this.time * Math.PI * 2;
    this.sunLight.position.set(
      Math.cos(sunAngle) * 100,
      Math.sin(sunAngle) * 100,
      50
    );

    const height = Math.sin(sunAngle);
    let targetColor;
    if (this.time < 0.2) {
      targetColor = SKY_COLORS.night.clone().lerp(SKY_COLORS.dawn, this.time / 0.2);
    } else if (this.time < 0.3) {
      targetColor = SKY_COLORS.dawn.clone().lerp(SKY_COLORS.day, (this.time - 0.2) / 0.1);
    } else if (this.time < 0.7) {
      targetColor = SKY_COLORS.day.clone();
    } else if (this.time < 0.8) {
      targetColor = SKY_COLORS.day.clone().lerp(SKY_COLORS.dusk, (this.time - 0.7) / 0.1);
    } else if (this.time < 0.9) {
      targetColor = SKY_COLORS.dusk.clone().lerp(SKY_COLORS.night, (this.time - 0.8) / 0.1);
    } else {
      targetColor = SKY_COLORS.night.clone();
    }

    this.skyColor.copy(targetColor);
    this.scene.background = this.skyColor;
    if (this.scene.fog) this.scene.fog.color.copy(this.skyColor);

    const sunIntensity = Math.max(0, height) * 1.2;
    const ambientIntensity = 0.15 + Math.max(0, height) * 0.45;

    this.sunLight.intensity = sunIntensity;
    this.ambientLight.intensity = ambientIntensity;

    const sunColor = new THREE.Color().lerpColors(
      new THREE.Color(0xff8844),
      new THREE.Color(0xffffff),
      Math.max(0, height)
    );
    this.sunLight.color.copy(sunColor);
  }
}
