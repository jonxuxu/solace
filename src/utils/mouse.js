// Make sure not to send updates too frequently
const UPDATE_INTERVAL = 150;	// milliseconds
// if the mouse is released after CLICK_TIME milliseconds, it is considered a click
// otherwise it is a hold/drag
const CLICK_TIME = 200;	// milliseconds
const DEBOUNCE_DELAY = 20;	// milliseconds

export default class MouseTracker {
	canvasScale = 1;
	xTranslate = 0;
	yTranslate = 0;

	lastPress = 0;
	lastEvent = 0;
	startHold_id = null;

	constructor(awareness, selfClick, selfHoldStart, selfHoldEnd, selfMouseMove, selfBurst) {
		this.awareness = awareness;
		this.selfClick = sc;
		this.selfHoldStart = shs;
		this.selfHoldEnd = she;
		this.selfMouseMove = smm;
		this.selfBurst = sb;
		this.myClientID = this.awareness.clientID;
	}

	setupReceivers = (p5, otherClick, otherHoldStart, otherHoldEnd, otherMouseMove, otherBurst) => {
		this.otherClick = (clientID, mouseInfo) => {
			if (otherClick) {
				otherClick(p5, clientID, mouseInfo);
			}
		};
		this.otherHoldStart = (clientID, mouseInfo) => {
			if (otherHoldStart) {
				otherHoldStart(p5, clientID, mouseInfo);
			}
		}
		this.otherHoldEnd = (clientID, mouseInfo) => {
			if (otherHoldEnd) {
				otherHoldEnd(p5, clientID, mouseInfo);
			}
		}
		this.otherMouseMove = (clientID, mouseInfo) => {
			if (otherMouseMove) {
				otherMouseMove(p5, clientID, mouseInfo);
			}
		}
		this.otherBurst = (clientID, mouseInfo) => {
			if (otherBurst) {
				otherBurst(p5, clientID, mouseInfo);
			}
		}
		this.otherMouseInfo = {};

		this.awareness.on("change", ({ updated, removed }) => {
			const states = this.awareness.getStates();
			updated.forEach((clientID) => {
				if (clientID === this.myClientID) {
					return;
				}
				if (!this.otherMouseInfo[clientID]) {
					this.otherMouseInfo[clientID] = [];
				}
				const mouseInfo = states.get(clientID).mouse;
				if (mouseInfo) {
					const infoList = this.otherMouseInfo[clientID];
					if (infoList.length == 0 || mouseInfo.timestamp > infoList[infoList.length - 1].timestamp) {
						this.otherMouseInfo[clientID].push(mouseInfo);
						if (mouseInfo.click) {
							this.otherClick(clientID, mouseInfo);
						} else if (mouseInfo.holdStart) {
							this.otherHoldStart(clientID, mouseInfo);
						} else if (mouseInfo.holdEnd) {
							this.otherHoldEnd(clientID, mouseInfo);
						} else if (mouseInfo.burst) {
							this.otherBurst(clientID, mouseInfo);
						} else {
							this.otherMouseMove(clientID, mouseInfo);
						}	
					}
				}
			});
		});

	}

	resizeCanvas = (canvasScale, xTranslate, yTranslate) => {
		this.canvasScale = canvasScale;
		this.xTranslate = xTranslate;
		this.yTranslate = yTranslate;
	}

	mousePressed = (p5) => {
		console.log("mousePressed");
		const now = Date.now();
		if (now - this.lastPress < DEBOUNCE_DELAY) {
			return;
		}
		this.lastPress = now;
		this.lastEvent = now;

		this.startHold_id = setTimeout(() => {
			let mouseInfo = {
				x: p5.mouseX * this.canvasScale + this.xTranslate,
				y: p5.mouseY * this.canvasScale + this.yTranslate,
				click: false,
				holdStart: true,
				holdEnd: false,
				burst: false,
				timestamp: now,
			};

			if (this.selfHoldStart) {
				this.selfHoldStart(p5, this.myClientID, mouseInfo);
			}
			this.awareness.setLocalStateField("mouse", mouseInfo);
		}, CLICK_TIME);
	}

	mouseReleased = (p5) => {
		console.log("mouseReleased");
		clearTimeout(this.startHold_id);
		const now = Date.now();
		this.lastEvent = now;

		let mouseInfo = {
			x: p5.mouseX * this.canvasScale + this.xTranslate,
			y: p5.mouseY * this.canvasScale + this.yTranslate,
			click: false,
			holdStart: false,
			holdEnd: false,
			burst: false,
			timestamp: now,
		};

		if (now - this.lastPress < CLICK_TIME) {
			mouseInfo.click = true;
			if (this.selfClick) {
				this.selfClick(p5, this.myClientID, mouseInfo);
			}
		} else {
			mouseInfo.holdEnd = true;
			if (this.selfHoldEnd) {
				this.selfHoldEnd(p5, this.myClientID, mouseInfo);
			}
		}
		this.awareness.setLocalStateField("mouse", mouseInfo);
	}

	mouseMoved = (p5) => {
		console.log("mouseMoved");
		const now = Date.now();
		let mouseInfo = {
			x: p5.mouseX * this.canvasScale + this.xTranslate,
			y: p5.mouseY * this.canvasScale + this.yTranslate,
			click: false,
			holdStart: false,
			holdEnd: false,
			burst: false,
			timestamp: now,
		};

		if (this.selfMouseMove) {
			this.selfMouseMove(p5, this.myClientID, mouseInfo);
		}
		if (now - this.lastEvent < UPDATE_INTERVAL) {
			return;
		}
		this.lastEvent = now;
		this.awareness.setLocalStateField("mouse", mouseInfo);
	}

	onBurst = (p5) => {
		console.log("onBurst");
		const now = Date.now();
		this.lastEvent = now;

		let mouseInfo = {
			x: p5.mouseX * this.canvasScale + this.xTranslate,
			y: p5.mouseY * this.canvasScale + this.yTranslate,
			click: false,
			holdStart: false,
			holdEnd: false,
			burst: true,
			timestamp: now,
		};
		
		if (this.selfBurst) {
			this.selfBurst(p5, this.myClientID, mouseInfo);
		}
		this.awareness.setLocalStateField("burst", true);
	}
}
