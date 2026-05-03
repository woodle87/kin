import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';

export class Physics {
  constructor() {
    this.world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0)
    });

    this.world.broadphase = new CANNON.SAPBroadphase(this.world);
    this.world.allowSleep = false;

    this.world.solver.iterations = 10;
    this.world.solver.tolerance = 0.001;

    this.world.defaultContactMaterial.friction = 0.4;
    this.world.defaultContactMaterial.restitution = 0.0;

    // Materials
    this.groundMaterial = new CANNON.Material('ground');
    this.wheelMaterial = new CANNON.Material('wheel');
    this.chassisMaterial = new CANNON.Material('chassis');

    // Wheel <-> Ground
    const wheelGroundContactMaterial = new CANNON.ContactMaterial(
      this.wheelMaterial,
      this.groundMaterial,
      {
        friction: 0.9,
        restitution: 0.0,
        contactEquationStiffness: 5000,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(wheelGroundContactMaterial);

    // Chassis <-> Ground
    const chassisGroundContactMaterial = new CANNON.ContactMaterial(
      this.chassisMaterial,
      this.groundMaterial,
      {
        friction: 0.4,
        restitution: 0.0,
        contactEquationStiffness: 5000,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(chassisGroundContactMaterial);
  }

  step(dt) {
    this.world.step(1 / 60, dt, 3);
  }
}