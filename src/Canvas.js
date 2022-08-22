import React from "react";
import Sketch from "react-p5";

let x = 50;
let y = 50;

export default (props) => {
	const setup = (p5, canvasParentRef) => {
		p5.createCanvas(500, 500).parent(canvasParentRef);
	};

	const draw = (p5) => {
		p5.background(0);
		p5.ellipse(x, y, 70, 70);
		x++;
	};

	return <Sketch setup={setup} draw={draw} />;
};
