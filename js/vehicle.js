import * as THREE from 'three';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const carConfigs = {
  'ambulance.glb': { mass: 1400, force: 3200, brake: 90, scale: 1.15, offset: -0.5, steer: 0.32, hw: 0.8, fz: 1.55, rz: -1.45, wy: -0.15, wr: 0.42 },
  'delivery.glb': { mass: 1600, force: 2800, brake: 100, scale: 1.2, offset: -0.45, steer: 0.3, hw: 0.9, fz: 1.5, rz: -1.4, wy: -0.1, wr: 0.4 },
  'firetruck.glb': { mass: 2500, force: 4500, brake: 150, scale: 1.3, offset: -0.48, steer: 0.25, hw: 1.05, fz: 1.8, rz: -1.7, wy: -0.2, wr: 0.45 },
  'police.glb': { mass: 1200, force: 4500, brake: 80, scale: 1.0, offset: -0.48, steer: 0.38, hw: 0.8, fz: 1.35, rz: -1.3, wy: -0.1, wr: 0.35 },
  'sedan.glb': { mass: 1100, force: 3800, brake: 70, scale: 1.0, offset: -0.48, steer: 0.38, hw: 0.7, fz: 1.35, rz: -1.3, wy: -0.1, wr: 0.35 },
  'suv.glb': { mass: 1500, force: 4000, brake: 90, scale: 1.1, offset: -0.3, steer: 0.35, hw: 0.8, fz: 1.45, rz: -1.4, wy: -0.15, wr: 0.4 },
  'taxi.glb': { mass: 1150, force: 3500, brake: 75, scale: 1.0, offset: -0.48, steer: 0.38, hw: 0.8, fz: 1.35, rz: -1.3, wy: -0.1, wr: 0.35 },
  'tractor-police.glb': { mass: 2000, force: 3800, brake: 100, scale: 1.2, offset: -0.15, steer: 0.3, hw: 1.0, fz: 1.2, rz: -1.2, wy: 0.0, wr: 0.5 },
  'tractor.glb': { mass: 2000, force: 3800, brake: 100, scale: 1.2, offset: -0.15, steer: 0.3, hw: 1.0, fz: 1.2, rz: -1.2, wy: 0.0, wr: 0.5 },
  'truck.glb': { mass: 2200, force: 4000, brake: 120, scale: 1.25, offset: -0.45, steer: 0.28, hw: 1.0, fz: 1.6, rz: -1.5, wy: -0.15, wr: 0.42 },
  'van.glb': { mass: 1500, force: 3000, brake: 90, scale: 1.1, offset: -0.35, steer: 0.3, hw: 0.9, fz: 1.4, rz: -1.4, wy: -0.15, wr: 0.38 }
};

export class Vehicle {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;

    this.wheelMeshes = [];
    this.carModel = null;
    this.carModelOffset = new THREE.Vector3(0, -0.35, 0);
    this.carModelRotationOffset = new THREE.Quaternion();
    this.currentConfig = carConfigs['ambulance.glb'];

    this.wheelVisualRotation = new THREE.Quaternion();
    this.wheelVisualRotation.setFromEuler(new THREE.Euler(0, 0, Math.PI / 2));

    this.createVehicle();
    this.loadCarModel('ambulance.glb');
  }

  createVehicle() {
    // Chassi físico
    const chassisShape = new CANNON.Box(new CANNON.Vec3(1.05, 0.55, 2.35));
    this.chassisBody = new CANNON.Body({
      mass: 1400,
      material: this.physics.chassisMaterial
    });

    this.chassisBody.addShape(chassisShape);
    this.chassisBody.position.set(0, 4, 0);
    this.chassisBody.angularDamping = 0.45;

    this.physics.world.addBody(this.chassisBody);

    // Veículo Raycast
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassisBody,
      indexForwardAxis: 2,
      indexRightAxis: 0,
      indexUpAxis: 1
    });

    const wheelOptions = {
      radius: 0.42,
      directionLocal: new CANNON.Vec3(0, -1, 0),
      suspensionStiffness: 22,
      suspensionRestLength: 0.3,
      frictionSlip: 3.8,
      dampingRelaxation: 2.0,
      dampingCompression: 3.2,
      maxSuspensionForce: 90000,
      rollInfluence: 0.08,
      axleLocal: new CANNON.Vec3(-1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(),
      maxSuspensionTravel: 0.22,
      customSlidingRotationalSpeed: -18,
      useCustomSlidingRotationalSpeed: true
    };

    // Largura e comprimento entre eixos ajustados para ambulância
    const halfTrack = 0.95;
    const axleFrontZ = 1.55;
    const axleRearZ = -1.45;
    const yOff = -0.15;

    const addWheel = (x, y, z) => {
      const opts = { ...wheelOptions };
      opts.chassisConnectionPointLocal = new CANNON.Vec3(x, y, z);
      this.vehicle.addWheel(opts);
    };

    // Frente direita, frente esquerda, trás direita, trás esquerda
    addWheel(halfTrack, yOff, axleFrontZ);
    addWheel(-halfTrack, yOff, axleFrontZ);
    addWheel(halfTrack, yOff, axleRearZ);
    addWheel(-halfTrack, yOff, axleRearZ);

    this.vehicle.addToWorld(this.physics.world);

    // Rodas visuais temporárias
    const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.32, 24);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.85,
      metalness: 0.1
    });

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      const wheelMesh = new THREE.Mesh(wheelGeo, wheelMat);
      wheelMesh.castShadow = true;
      wheelMesh.receiveShadow = true;
      this.scene.add(wheelMesh);
      this.wheelMeshes.push(wheelMesh);
    }

    this.reset();
  }

  loadCarModel(filename = 'ambulance.glb') {
    if (this.carModel) {
      this.scene.remove(this.carModel);
      this.carModel = null;
    }

    const config = carConfigs[filename] || carConfigs['ambulance.glb'];
    this.currentConfig = config;

    // Atualiza a física com as propriedades do novo veículo
    this.chassisBody.mass = config.mass;
    this.chassisBody.updateMassProperties();
    this.carModelOffset.set(0, config.offset, 0);

    const loader = new GLTFLoader();

    // Atualiza dimensões físicas e visuais das rodas
    if (this.vehicle) {
      const hw = config.hw || 0.95;
      const fz = config.fz || 1.55;
      const rz = config.rz || -1.45;
      const wy = config.wy || -0.15;
      const wr = config.wr || 0.42;

      // Frente Direita, Frente Esquerda, Atrás Direita, Atrás Esquerda
      this.vehicle.wheelInfos[0].chassisConnectionPointLocal.set(hw, wy, fz);
      this.vehicle.wheelInfos[1].chassisConnectionPointLocal.set(-hw, wy, fz);
      this.vehicle.wheelInfos[2].chassisConnectionPointLocal.set(hw, wy, rz);
      this.vehicle.wheelInfos[3].chassisConnectionPointLocal.set(-hw, wy, rz);

      for (let i = 0; i < 4; i++) {
        this.vehicle.wheelInfos[i].radius = wr;
        // Escala a roda visual, base original 0.42
        const sR = wr / 0.42;
        this.wheelMeshes[i].scale.set(sR, sR, sR);
        this.vehicle.updateWheelTransform(i);
      }
    }

    loader.load(
      './assets/models/' + filename,
      (gltf) => {
        this.carModel = gltf.scene;

        // Escala dinâmica pro veículo selecionado
        this.carModel.scale.set(config.scale, config.scale, config.scale);

        this.carModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              child.material.needsUpdate = true;
            }
          }
        });

        // Ajuste de orientação caso o modelo venha virado
        // Corrige a orientação do modelo 3D para alinhar com o chassi físico
        this.carModelRotationOffset.setFromEuler(new THREE.Euler(0, Math.PI, 0));

        this.scene.add(this.carModel);
      },
      undefined,
      (error) => {
        console.error('Erro ao carregar ' + filename + ':', error);
      }
    );
  }

  update(keys) {
    const maxSteerVal = this.currentConfig ? this.currentConfig.steer : 0.32;
    const maxForce = this.currentConfig ? this.currentConfig.force : 3200;
    const brakeForce = this.currentConfig ? this.currentConfig.brake : 90;
    const idleBrakeForce = 14;

    const forwardPressed = !!keys.w;
    const reversePressed = !!keys.s;
    const leftPressed = !!keys.a;
    const rightPressed = !!keys.d;
    const brakePressed = !!keys.space;

    let engineForce = 0;
    if (forwardPressed) engineForce = maxForce;
    if (reversePressed) engineForce = -maxForce;
    if (keys.shift && forwardPressed) engineForce *= 1.2;

    // Tração traseira para mais estabilidade
    this.vehicle.applyEngineForce(0, 0);
    this.vehicle.applyEngineForce(0, 1);
    this.vehicle.applyEngineForce(engineForce, 2);
    this.vehicle.applyEngineForce(engineForce, 3);

    const steerVal =
      (leftPressed ? -maxSteerVal : 0) +
      (rightPressed ? maxSteerVal : 0);

    this.vehicle.setSteeringValue(steerVal, 0);
    this.vehicle.setSteeringValue(steerVal, 1);

    const isIdle = !forwardPressed && !reversePressed;
    const appliedBrake = brakePressed ? brakeForce : (isIdle ? idleBrakeForce : 0);

    for (let i = 0; i < 4; i++) {
      this.vehicle.setBrake(appliedBrake, i);
    }

    // Elimina micro movimento residual
    const speedSq = this.chassisBody.velocity.lengthSquared();
    if (isIdle && speedSq < 0.0009) {
      this.chassisBody.velocity.set(0, 0, 0);
      this.chassisBody.angularVelocity.set(0, 0, 0);
    }

    // Atualiza rodas visuais
    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
      const t = this.vehicle.wheelInfos[i].worldTransform;

      this.wheelMeshes[i].position.set(
        t.position.x,
        t.position.y,
        t.position.z
      );

      const q = new THREE.Quaternion(
        t.quaternion.x,
        t.quaternion.y,
        t.quaternion.z,
        t.quaternion.w
      );

      this.wheelMeshes[i].quaternion.copy(q).multiply(this.wheelVisualRotation);
    }

    // Atualiza modelo 3D da ambulância
    if (this.carModel) {
      const bodyPos = this.chassisBody.position;
      const bodyQuat = this.chassisBody.quaternion;

      const baseQuat = new THREE.Quaternion(
        bodyQuat.x,
        bodyQuat.y,
        bodyQuat.z,
        bodyQuat.w
      );

      const finalQuat = baseQuat.clone().multiply(this.carModelRotationOffset);

      const rotatedOffset = this.carModelOffset.clone().applyQuaternion(baseQuat);

      this.carModel.position.set(
        bodyPos.x + rotatedOffset.x,
        bodyPos.y + rotatedOffset.y,
        bodyPos.z + rotatedOffset.z
      );

      this.carModel.quaternion.copy(finalQuat);
    }
  }

  reset(pos = new CANNON.Vec3(0, 4, 0)) {
    this.chassisBody.velocity.set(0, 0, 0);
    this.chassisBody.angularVelocity.set(0, 0, 0);
    this.chassisBody.force.set(0, 0, 0);
    this.chassisBody.torque.set(0, 0, 0);
    this.chassisBody.position.copy(pos);
    this.chassisBody.quaternion.set(0, 0, 0, 1);
    this.chassisBody.wakeUp();

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
    }
  }

  getSpeed() {
    const speed = this.chassisBody.velocity.length() * 3.6;
    return speed < 0.5 ? 0 : speed;
  }

  getSuspensionLoad() {
    let load = 0;
    for (let i = 0; i < 4; i++) {
      load += Math.abs(this.vehicle.wheelInfos[i].suspensionRelativeVelocity);
    }
    return load / 4.0;
  }
}