export class UI {
  constructor() {
    this.els = {
      speed: document.getElementById('hud-speed'),
      gear: document.getElementById('hud-gear'),
      suspension: document.getElementById('hud-suspension'),
      camera: document.getElementById('hud-camera'),
      zone: document.getElementById('hud-zone'),
      loading: document.getElementById('loading-screen'),
      stability: document.getElementById('hud-stability'),
      timer: document.getElementById('hud-timer')
    };
  }

  hideLoading() {
    this.els.loading.style.opacity = '0';
    setTimeout(() => {
      this.els.loading.style.display = 'none';
    }, 500);
  }

  updateTelemetry(speed, reverse, rpmRatio, suspLoad) {
    const spdStr = Math.round(speed).toString();
    this.els.speed.innerHTML = `${spdStr} <small>km/h</small>`;

    // Gear logic approx
    if (speed < 1 && !reverse) {
      this.els.gear.textContent = 'N';
    } else if (reverse) {
      this.els.gear.textContent = 'R';
    } else {
      let gearNum = Math.min(5, Math.max(1, Math.ceil(speed / 40)));
      this.els.gear.textContent = gearNum.toString();
    }

    // Suspension load 0 to 100%
    const loadPercent = Math.min(100, Math.max(0, suspLoad * 100));
    this.els.suspension.style.width = `${loadPercent}%`;
    if (loadPercent > 80) {
      this.els.suspension.style.background = 'var(--error)';
    } else {
      this.els.suspension.style.background = 'var(--accent)';
    }
  }

  updateCameraName(name) {
    this.els.camera.textContent = name.toUpperCase();
  }

  updateTrackZone(zoneName) {
    this.els.zone.textContent = zoneName.toUpperCase();
  }

  updateExtraData(stability, time) {
    this.els.stability.textContent = Math.round(stability) + '°';
    
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    this.els.timer.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Warn if stability is low (high angle)
    if (Math.abs(stability) > 45) {
      this.els.stability.style.color = 'var(--error)';
    } else {
      this.els.stability.style.color = '#fff';
    }
  }
}
