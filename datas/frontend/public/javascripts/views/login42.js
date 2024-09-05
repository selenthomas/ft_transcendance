import AbstractView from "./AbstractView.js";
import * as utils from "../utils_form.js"
import * as router from "../router.js";
import Websockets from "../websockets.js";

export default class extends AbstractView {
	constructor(params) {
		super(params);
		this.setTitle("Login 42");

	}


	async  addEvents () {
        this.user.logout()

		// CODE DANS l'URL
		var queryString = window.location.search;
		queryString = queryString.substring(1);
		var params = queryString.split('/');
		var paramsObj = {};
		params.forEach(function(param) {
			var keyValue = param.split('=');
			var key = decodeURIComponent(keyValue[0]);
			var value = decodeURIComponent(keyValue[1] || '');
			paramsObj[key] = value;
		});
		var code42 = paramsObj['code'];

		let data = {
			'code': code42,
		};
		let get_token_path = await this.user.request.post("/api/users/auth/intra_callback/", data);
		if (get_token_path.ok){
			const jsonData = await get_token_path.json();
			for (let key in jsonData.user) {
				if (jsonData.user.hasOwnProperty(key) && typeof jsonData.user[key] === 'string') {
					jsonData.user[key] = jsonData.user[key].replace(/[()',]/g, "");
				}
			}

			if (jsonData.error)
            {
                document.querySelector('#app').innerHTML =
                    `<h1>${jsonData.error}</h1>
                    <p>${jsonData.error_description}</p>`
            }
            else
            {
				this.user.setLocalDatas(jsonData.user)
				this.user.request.setJWTtoken(jsonData.access, jsonData.refresh)

				this.user.isConnected = true;
				await this.user.view.printHeader();
				await this.user.view.printAside();
				this.user.websockets = new Websockets(this.user)

				this.user.router.navigateTo('/profile/', this.user);
			}
			
			// return get_token_path;
		} else if (response.status === 241) {
			const jsonData = await response.json();
			return jsonData.detail;
		}
		

	}
}