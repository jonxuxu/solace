import React from "react";
import Sketch from "react-p5";
import * as Y from 'yjs'

let smallRipples = [];

const rippleSpeed = 0.1;
const bigRippleMaxSize = 300;
const smallRippleMaxSize = 80;

function Canvas(props) {
	const bigRipples = props.doc.getArray('bigRipples');
	bigRipples.observe(event => {
	  console.log('changes', event.changes.keys)
	});

	const setup = (p5, canvasParentRef) => {
		let cnv = p5.createCanvas(500, 500).parent(canvasParentRef);
	};

	const draw = (p5) => {
		const now = Date.now();
		p5.background(0);

		p5.fill(0, 0);
		p5.strokeWeight(3);
		for (let i = bigRipples.length - 1; i >= 0; i--) {
			let ripple = bigRipples.get(i);
			let time = now - ripple.startTime;
			if (time > 0) {
				let keep = drawBigRipple(p5, ripple, time);
				if (!keep) {
					bigRipples.delete(i, 1);
				}
			}
		}

		p5.strokeWeight(2);
		for (let i = smallRipples.length - 1; i >= 0; i--) {
			let time = now - smallRipples[i].startTime;
			if (time > 0) {
				let keep = drawSmallRipple(p5, smallRipples[i], time);
				if (!keep) {
					smallRipples.splice(i, 1);
				}
			}
		}

	};

	const mousePressed = (p5) => {
		let x = p5.mouseX;
		let y = p5.mouseY;
		let now = Date.now();

		bigRipples.push([
			{ x: x, y: y, startTime: now, },
			{ x: x, y: y, startTime: now + 200, },
			{ x: x, y: y, startTime: now + 400, },
		]);

		/*
		smallRipples.push(
			{ x: x, y: y, startTime: now, },
		);
		*/
	};

	const drawBigRipple = (p5, ripple, time) => {
		let radius = time * rippleSpeed;
		if (radius < bigRippleMaxSize) {
			let alpha = (bigRippleMaxSize - radius) * 0.5;
			p5.stroke(255, alpha);
			p5.ellipse(ripple.x, ripple.y, radius);
			return true;
		}
		return false;
	}

	const drawSmallRipple = (p5, ripple, time) => {
		let radius = time * rippleSpeed + 5;
		if (radius < smallRippleMaxSize) {
			let alpha = (smallRippleMaxSize - radius) * 2.0;
			p5.stroke(255, alpha);
			p5.ellipse(ripple.x, ripple.y, radius);
			return true;
		}
		return false;
	}

	return <Sketch setup={setup} draw={draw} mousePressed={mousePressed} />;
};

export default Canvas;
