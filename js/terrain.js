import * as THREE from 'three';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class Terrain {
  constructor(scene, physics) {
    this.scene = scene;
    this.physics = physics;
    this.zones = [];

    this.geoMat = new THREE.MeshStandardMaterial({
      color: 0x18202b,
      roughness: 0.85,
      metalness: 0.15
    });

    this.boxMat = new THREE.MeshStandardMaterial({
      color: 0x334455
    });

    this.createGround();
    this.createZoneBumps(new CANNON.Vec3(0, 0, 50));
    this.createRamp(new CANNON.Vec3(100, 0, 0));
    this.createRocks(new CANNON.Vec3(-100, 0, 0));
    this.createJump(new CANNON.Vec3(0, 0, -100));
    this.createObstacles(new CANNON.Vec3(50, 0, -50));
  }

  createGround() {
    const groundBody = new CANNON.Body({
      mass: 0,
      material: this.physics.groundMaterial
    });

    groundBody.addShape(new CANNON.Plane());
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    this.physics.world.addBody(groundBody);

    const loader = new THREE.TextureLoader();

    const colorMap = loader.load('./assets/textures/color.png');
    const normalMap = loader.load('./assets/textures/color.png');
    const roughnessMap = loader.load('./assets/textures/color.png');

    colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
    normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
    roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

    colorMap.repeat.set(400, 400);
    normalMap.repeat.set(400, 400);
    roughnessMap.repeat.set(400, 400);

    const groundMat = new THREE.MeshStandardMaterial({
      map: colorMap,
      normalMap: normalMap,
      roughnessMap: roughnessMap,
      roughness: 1.0,
      metalness: 0.0
    });

    const groundGeo = new THREE.PlaneGeometry(1000, 1000);
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);
  }

  createBox(extents, position, mat, quat = null) {
    const shape = new CANNON.Box(
      new CANNON.Vec3(extents.x / 2, extents.y / 2, extents.z / 2)
    );

    const body = new CANNON.Body({
      mass: 0,
      material: this.physics.groundMaterial
    });

    body.addShape(shape);
    body.position.copy(position);

    if (quat) body.quaternion.copy(quat);

    this.physics.world.addBody(body);

    const geo = new THREE.BoxGeometry(extents.x, extents.y, extents.z);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(position.x, position.y, position.z);

    if (quat) {
      mesh.quaternion.set(quat.x, quat.y, quat.z, quat.w);
    }

    mesh.castShadow = true;
    this.scene.add(mesh);
  }

  createDynamicBox(extents, position, mat, mass = 10) {
    const shape = new CANNON.Box(new CANNON.Vec3(extents.x / 2, extents.y / 2, extents.z / 2));
    const body = new CANNON.Body({ mass, material: this.physics.groundMaterial });
    body.addShape(shape);
    body.position.copy(position);
    this.physics.world.addBody(body);

    const geo = new THREE.BoxGeometry(extents.x, extents.y, extents.z);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Link for update
    this.physics.world.addEventListener('postStep', () => {
      mesh.position.copy(body.position);
      mesh.quaternion.copy(body.quaternion);
    });
  }

  createZoneBumps(pos) {
    this.zones.push({ name: 'BUMPS TEST', center: pos, radius: 40 });

    for (let i = 0; i < 8; i++) {
      const z = pos.z - 24 + i * 7;

      this.createBox(
        new CANNON.Vec3(12, 0.35, 2.5),
        new CANNON.Vec3(pos.x, 0.175, z),
        this.geoMat
      );
    }
  }

  createRamp(pos) {
    this.zones.push({ name: 'SLOPE TEST', center: pos, radius: 40 });

    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 10);

    this.createBox(
      new CANNON.Vec3(20, 1, 30),
      new CANNON.Vec3(pos.x, 2.6, pos.z),
      this.geoMat,
      q
    );

    this.createBox(
      new CANNON.Vec3(20, 1, 12),
      new CANNON.Vec3(pos.x, 5.2, pos.z - 18),
      this.geoMat
    );
  }

  createRocks(pos) {
    this.zones.push({ name: 'ROCKY AREA', center: pos, radius: 40 });

    for (let i = 0; i < 20; i++) {
      const sx = 1.5 + Math.random() * 2;
      const sy = 0.8 + Math.random() * 1.2;
      const sz = 1.5 + Math.random() * 2;

      const x = pos.x + (Math.random() - 0.5) * 36;
      const z = pos.z + (Math.random() - 0.5) * 36;

      const q = new CANNON.Quaternion();
      q.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.random() * Math.PI);

      this.createBox(
        new CANNON.Vec3(sx, sy, sz),
        new CANNON.Vec3(x, sy / 2, z),
        this.boxMat,
        q
      );
    }
  }

  createJump(pos) {
    this.zones.push({ name: 'JUMP ZONE', center: pos, radius: 40 });

    const q = new CANNON.Quaternion();
    q.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 12);

    this.createBox(
      new CANNON.Vec3(10, 1, 14),
      new CANNON.Vec3(pos.x, 1.45, pos.z),
      this.geoMat,
      q
    );
  }

  getCurrentZone(pos) {
    let closest = 'MAIN TRACK';
    let minDist = 40;

    for (const z of this.zones) {
      const dx = pos.x - z.center.x;
      const dz = pos.z - z.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < minDist && dist < z.radius) {
        minDist = dist;
        closest = z.name;
      }
    }

    return closest;
  }

  createObstacles(pos) {
    this.zones.push({ name: 'OBSTACLES', center: pos, radius: 30 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    for (let i = 0; i < 15; i++) {
      const x = pos.x + (Math.random() - 0.5) * 20;
      const z = pos.z + (Math.random() - 0.5) * 20;
      this.createDynamicBox(new CANNON.Vec3(1, 1, 1), new CANNON.Vec3(x, 1, z), crateMat, 10);
    }
  }
}