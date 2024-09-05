import * as header from "../header.js";
import * as aside from "../aside.js";

export default class {
    constructor(params) {
        this.params = params;
        this.chatSocket = null
        this.PongSocket = null
    }

    async setTitle(title) {
        document.title = title;
    }

    set user(u) {
        this._user = u;
    }
    get user() {
        return this._user;
    }

    async getHtml() {
        return "";
    }
    async fillHtml() {
        return "";
    }

    addEvents () {

    }


    async printHeader()
    {
        await header.print(this.user);
    }
    async printAside()
    {
        await aside.print(this.user);
    }

	keyupHandler = (event) => {
		if (!this.pong.currentKeysDown.includes(event.key)) {
			this.pong.currentKeysDown.push(event.key);
		}
		this.pong.movePaddles();
	};
	
	keydownHandler = (event) => {
		this.pong.currentKeysDown.splice(this.pong.currentKeysDown.indexOf(event.key), 1);
		this.pong.movePaddles();
	};

	preventDefaultKeyDown = (e) => {
		if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
			e.preventDefault();
		}
	}
}

