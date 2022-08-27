class FlockParams {
  constructor() {
    this.maxForce = 0.08;
    this.maxSpeed = 3.7;
    this.perceptionRadius = 100;
    this.alignAmp = 1;
    this.cohesionAmp = 1;
    this.separationAmp = 1;
  }
}

let flockParams = new FlockParams();
const gui = new dat.GUI();
gui.add(flockParams, "alignAmp", 0.5, 2);
gui.add(flockParams, "cohesionAmp", 0.5, 2);
gui.add(flockParams, "separationAmp", 0.5, 2);
gui.add(flockParams, "maxSpeed", 2, 6);
gui.add(flockParams, "maxForce", 0.05, 3);
gui.add(flockParams, "perceptionRadius", 20, 300);

const shadowColor = "rgba(0,0,0,0.05)";

/*==================
Koi
===================*/

const koiColors = ["#E95D0C", "#EEA237", "#E02D28"];

class Koi {
  constructor(x, y, koiColor) {
    this.color = color(koiColor);
    this.offsetX = random(-100, 100);
    this.offsetY = random(-100, 100);
    this.position = createVector(x + this.offsetX, y + this.offsetY);
    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(2, 10));
    this.acceleration = createVector();
    this.maxForce = flockParams.maxForce;
    this.maxSpeed = flockParams.maxSpeed;
    this.baseSize = int(random(15, 20));
    this.bodyLength = this.baseSize * 2;
    this.body = new Array(this.bodyLength).fill({ ...this.position });
  }

  calculateDesiredSteeringForce(kois, factorType) {
    let steering = createVector();
    let total = 0;
    for (let other of kois) {
      let d = dist(
        this.position.x,
        this.position.y,
        other.position.x,
        other.position.y
      );
      if (d < flockParams.perceptionRadius && other != this) {
        switch (factorType) {
          case "align":
            steering.add(other.velocity);
            break;
          case "cohesion":
            steering.add(other.position);
            break;
          case "separation":
            let diff = p5.Vector.sub(this.position, other.position);
            diff.div(d);
            steering.add(diff);
            break;
          default:
            break;
        }
        total++;
      }
    }

    if (total > 0) {
      steering.div(total);
      if (factorType === "cohesion") steering.sub(this.position);
      steering.setMag(flockParams.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(flockParams.maxForce);
    }
    return steering;
  }

  align = (kois) => this.calculateDesiredSteeringForce(kois, "align");

  cohesion = (kois) => this.calculateDesiredSteeringForce(kois, "cohesion");

  separation = (kois) => this.calculateDesiredSteeringForce(kois, "separation");

  avoid(obstacle) {
    let steering = createVector();
    let d = dist(this.position.x, this.position.y, obstacle.x, obstacle.y);
    if (d < flockParams.perceptionRadius) {
      let diff = p5.Vector.sub(this.position, obstacle);
      diff.div(d);
      steering.add(diff);
      steering.setMag(flockParams.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(flockParams.maxForce);
    }
    return steering;
  }

  edges() {
    if (this.position.x > width + 50) {
      this.position.x = -50;
    } else if (this.position.x < -50) {
      this.position.x = width + 50;
    }
    if (this.position.y > height + 50) {
      this.position.y = -50;
    } else if (this.position.y < -50) {
      this.position.y = height + 50;
    }
  }

  flock(kois) {
    this.acceleration.mult(0);
    let alignment = this.align(kois);
    let cohesion = this.cohesion(kois);
    let separation = this.separation(kois);

    let mouseObstacle = createVector(mouseX, mouseY);
    let avoid = this.avoid(mouseObstacle);

    alignment.mult(flockParams.alignAmp);
    cohesion.mult(flockParams.cohesionAmp);
    separation.mult(flockParams.separationAmp);

    this.acceleration.add(avoid);
    this.acceleration.add(separation);
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);

    this.acceleration.add(p5.Vector.random2D().mult(0.05));
  }

  updateBody() {
    this.body.unshift({ ...this.position });
    this.body.pop();
  }

  show() {
    noStroke();
    this.body.forEach((b, index) => {
      let size;
      if (index < this.bodyLength / 6) {
        size = this.baseSize + index * 1.8;
      } else {
        size = this.baseSize * 2 - index;
      }
      this.color.setAlpha(this.bodyLength - index);
      fill(this.color);
      ellipse(b.x, b.y, size, size);
    });
  }

  showShadow() {
    noStroke();
    this.body.forEach((b, index) => {
      let size;
      if (index < this.bodyLength / 6) {
        size = this.baseSize + index * 1.8;
      } else {
        // fill(255, 255, 255, 50 - index)
        size = this.baseSize * 1.8 - index;
      }

      fill(200, 200, 200, 20);
      ellipse(b.x + 50, b.y + 50, size, size);
    });
  }

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(flockParams.maxSpeed);
    this.updateBody();
  }
}

/*==================
Sketch: setup, draw, etc.
===================*/

const flock = [];
const koiNumber = 20;

function setup() {
  createCanvas(windowWidth, windowHeight);
  const centerX = random(width - 200, 200);
  const centerY = random(height - 200, 200);

  const color = random(koiColors);
  new Array(koiNumber)
    .fill(1)
    .map((_) => flock.push(new Koi(centerX, centerY, color)));
}

function draw() {
  background(230);
  // shadow
  flock.forEach((koi) => {
    koi.showShadow();
  });

  flock.forEach((koi) => {
    koi.edges();
    koi.flock(flock);
    koi.update();
    koi.show();
  });
}

function windowResized() {
  // this function executes everytime the window size changes

  // set the sketch width and height to the 5 pixels less than
  // windowWidth and windowHeight. This gets rid of the scroll bars.
  resizeCanvas(windowWidth, windowHeight);
  // set background to light-gray
  background(230);
}
