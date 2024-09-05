import AbstractView from "./AbstractView.js";
import * as utils from "../utils_form.js"
import * as router from "../router.js";

export default class extends AbstractView {
	constructor(params) {
		super(params);
		this.setTitle("Login 2FA");

	}

	async getHtml(DOM) {
        await fetch('/template/login2FA').then(function (response) {
            // The API call was successful!
            return response.text();
        }).then(function (html) {
            // This is the HTML from our response as a text string
            let parser = new DOMParser();
            let doc = parser.parseFromString(html, 'text/html');
            let body = doc.querySelector('#app');
            DOM.innerHTML = body.innerHTML;

        }).catch(function (err) {
            // There was an error
            //console.log('Something went wrong.', err);
        });
    }

	async  addEvents () {
		this.user.logout()

		document.querySelector(".verify").classList.add("d-none");
		document.getElementById("send_code").addEventListener('click', async (event) =>  {
			event.preventDefault();
            this.login2FA();
        })
	}
	
	login2FA = async () => {
		let username = document.getElementById("username").value;
		let email = document.getElementById("email").value;
		let password = document.getElementById("password").value;
		let data = {
			'username': username,
			'email': email,
			'password': password,
		};
		const resp_2FA = await this.user.request.post('/api/users/auth/login2FA/', data);

		if (resp_2FA.ok){
			const jsonData = await resp_2FA.json();
			document.querySelector(".verify").classList.remove("d-none")
			if (jsonData.error)
			{
				let errDiv = document.getElementById("errorFeedback");
				errDiv.classList.remove("d-none")
				errDiv.innerHTML = "Bad input!";
				const jsonData = await resp_2FA.json();
				return jsonData.detail;
			}
			else
			{
				document.getElementById("verify2FA").addEventListener('click', async (event) =>  {
					event.preventDefault();
					this.verify2FA();
				})
			}
			
			// return resp_2FA;
		}
		else if (resp_2FA.status === 404) {
			let errDiv = document.getElementById("errorFeedback");
			errDiv.classList.remove("d-none")
			errDiv.innerHTML = 'The domain of your email is invalid';
			const jsonData = await resp_2FA.json();
			return jsonData.detail;
		}
		else if (resp_2FA.status === 400) {
			let errDiv = document.getElementById("errorFeedback");
			errDiv.classList.remove("d-none")
			errDiv.innerHTML = "Bad input!";
			const jsonData = await resp_2FA.json();
			return jsonData.detail;
		}

	}

	verify2FA = async () => {
		let username = document.getElementById("username").value;
		let email = document.getElementById("email").value;
		let password = document.getElementById("password").value;
		let verificationcode = document.getElementById("verificationcode").value;
		let data = {
			'username': username,
			'email': email,
			'password': password,
			'verificationcode': verificationcode,
		};
		const verif_2FA = await this.user.request.post('/api/users/auth/verify2FA/', data);
		if (verif_2FA.ok){
			const jsonData = await verif_2FA.json();
			if (jsonData.error)
			{
				
			}
			else
			{
				this.login();
			}
			
			// return resp_2FA;
		} else if (verif_2FA.status === 241) {
			let errDiv = document.getElementById("errorFeedback");
			errDiv.classList.remove("d-none")
			errDiv.innerHTML = "Bad verification code! Enter the code you received.";
			document.getElementById("verificationcode").value = "";
			const jsonData = await verif_2FA.json();
			return jsonData.detail;
		}
	
	}


    login = async () => { 
        let username =  document.getElementById("username").value;
        let password = document.getElementById("password").value;
        this.user.login(username, password)
        .then(async result => {
            if (result == true)
                router.navigateTo("/home", this.user)
            else
            {
                let errDiv = document.querySelector("#errorFeedback");
                errDiv.classList.remove("d-none")
                errDiv.innerHTML = 'An error occured ! Please check fields below ...';
                let jsonData = await result.json()
                for (const key in jsonData) {
                    if (Object.hasOwnProperty.call(jsonData, key))
                        utils.printError(key, 1, jsonData[key])
                }
            }
        })
        .catch(error => {
            //console.log('login.js (76) : There was a problem with the fetch operation:', error);
        });
    }
}