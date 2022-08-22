import React from "react";
import Sketch from "react-p5";

let ripples = [{
	x: 100,
	y: 100,
}];

export default (props) => {
	const setup = (p5, canvasParentRef) => {
		let cnv = p5.createCanvas(500, 500).parent(canvasParentRef);
	};

	const draw = (p5) => {
		p5.background(0);
		for (let i = 0; i < ripples.length; i++) {
			p5.ellipse(ripples[i].x, ripples[i].y, 70, 70);
		}
	};

	const mousePressed = (p5) => {
		console.log(p5.mouseX, p5.mouseY);
		ripples.push({
			x: p5.mouseX,
			y: p5.mouseY,
		});
	};

	return <Sketch setup={setup} draw={draw} mousePressed={mousePressed} />;
};
