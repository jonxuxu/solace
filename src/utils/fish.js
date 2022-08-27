class FlockParams {
  constructor() {
    this.maxForce = 0.08;
    this.maxSpeed = 3;
    this.perceptionRadius = 100;
    this.alignAmp = 1;
    this.cohesionAmp = 1;
    this.separationAmp = 1.5;
  }
}

let flockParams = new FlockParams();

class Koi {
  constructor(p5) {
    const x = p5.random(1920 - 200, 200);
    const y = p5.random(1080 - 200, 200);

    this.color = p5.color(p5.random(koiColors));
    this.offsetX = p5.random(-100, 100);
    this.offsetY = p5.random(-100, 100);
    this.position = p5.createVector(x + this.offsetX, y + this.offsetY);
    // console.log("position", this.position);
    this.velocity = p5.constructor.Vector.random2D();
    // console.log("velocity", this.velocity);
    this.velocity.setMag(p5.random(2, 10));
    // console.log("velocity2", this.velocity);
    this.acceleration = p5.createVector();
    // console.log(this.velocity, this.acceleration);
    this.maxForce = flockParams.maxForce;
    this.maxSpeed = flockParams.maxSpeed;
    this.baseSize = p5.int(p5.random(5, 10));
    this.bodyLength = this.baseSize * 2;
    this.body = new Array(this.bodyLength).fill({ ...this.position });
    this.p5Ref = p5;
  }

  calculateDesiredSteeringForce(kois, factorType) {
    let steering = this.p5Ref.createVector();
    let total = 0;
    for (let other of kois) {
      let d = this.p5Ref.dist(
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
            let diff = this.p5Ref.constructor.Vector.sub(
              this.position,
              other.position
            );
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
    let steering = this.p5Ref.createVector();
    let d = this.p5Ref.dist(
      this.position.x,
      this.position.y,
      obstacle.x,
      obstacle.y
    );
    if (d < flockParams.perceptionRadius) {
      let diff = this.p5Ref.constructor.Vector.sub(this.position, obstacle);
      diff.div(d);
      steering.add(diff);
      steering.setMag(flockParams.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(flockParams.maxForce);
    }
    return steering;
  }

  edges() {
    if (this.position.x > 1920 + 50) {
      this.position.x = -50;
    } else if (this.position.x < -50) {
      this.position.x = 1920 + 50;
    }
    if (this.position.y > 1080 + 50) {
      this.position.y = -50;
    } else if (this.position.y < -50) {
      this.position.y = 1080 + 50;
    }
  }

  flock(kois) {
    this.acceleration.mult(0);
    let alignment = this.align(kois);
    let cohesion = this.cohesion(kois);
    let separation = this.separation(kois);
    let mouseObstacle = this.p5Ref.createVector(
      this.p5Ref.mouseX,
      this.p5Ref.mouseY
    );
    let avoid = this.avoid(mouseObstacle);
    alignment.mult(flockParams.alignAmp);
    cohesion.mult(flockParams.cohesionAmp);
    separation.mult(flockParams.separationAmp);
    this.acceleration.add(avoid * 2);
    this.acceleration.add(separation);
    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(this.p5Ref.constructor.Vector.random2D().mult(0.05));
  }

  updateBody() {
    this.body.unshift({ ...this.position });
    this.body.pop();
  }

  show() {
    this.body.forEach((b, index) => {
      let size;
      if (index < this.bodyLength / 6) {
        size = this.baseSize + index * 1.8;
      } else {
        size = this.baseSize * 2 - index;
      }
      this.color.setAlpha(this.bodyLength - index);
      this.p5Ref.fill(this.color);
      this.p5Ref.ellipse(b.x, b.y, size, size);
    });
  }

  showShadow() {
    this.body.forEach((b, index) => {
      let size;
      if (index < this.bodyLength / 6) {
        size = this.baseSize + index * 1.8;
      } else {
        // fill(255, 255, 255, 50 - index)
        size = this.baseSize * 1.8 - index;
      }
      this.p5Ref.fill(200, 200, 200, 20);
      this.p5Ref.ellipse(b.x + 50, b.y + 50, size, size);
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
  Koi
  ===================*/

const koiColors = ["#384863", "#EEA237", "#E02D28"];
/*==================
  Sketch: setup, draw, etc.
  ===================*/
export default class Flock {
  flock = [];
  koiNumber = 20;

  constructor(p5) {
    new Array(this.koiNumber).fill(1).map((_) => this.flock.push(new Koi(p5)));
  }

  draw() {
    // background(230);
    // shadow
    this.flock.forEach((koi) => {
      koi.showShadow();
    });

    this.flock.forEach((koi) => {
      koi.edges();
      koi.flock(this.flock);
      koi.update();
      koi.show();
    });
  }
}
