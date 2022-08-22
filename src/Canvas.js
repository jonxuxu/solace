import React from "react";
import Sketch from "react-p5";

let ripples = [];
const rippleSpeed = 0.1;
const rippleMaxSize = 300;

export default (props) => {
	const setup = (p5, canvasParentRef) => {
		let cnv = p5.createCanvas(500, 500).parent(canvasParentRef);
	};

	const draw = (p5) => {
		const now = Date.now();
		p5.background(0);

		p5.fill(0, 0);
		p5.strokeWeight(3);
		for (let i = 0; i < ripples.length; i++) {
			let time = now - ripples[i].startTime;
			if (time > 0) {
				let keep = drawRipple(p5, ripples[i], time);
				if (!keep) {
					ripples.splice(i, 1);
					i--;
				}
			}
		}
	};

	const mousePressed = (p5) => {
		let x = p5.mouseX;
		let y = p5.mouseY;
		let now = Date.now();

		ripples.push(
			{ x: x, y: y, startTime: now, },
			{ x: x, y: y, startTime: now + 200, },
			{ x: x, y: y, startTime: now + 400, },
		);
	};

	const drawRipple = (p5, ripple, time) => {
		let radius = time * rippleSpeed;
		if (radius < rippleMaxSize) {
			let alpha = (rippleMaxSize - radius) * 0.5;
			p5.stroke(255, alpha);
			p5.ellipse(ripple.x, ripple.y, radius);
			return true;
		}
		return false;
	}

	return <Sketch setup={setup} draw={draw} mousePressed={mousePressed} />;
};
