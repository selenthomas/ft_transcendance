import AbstractView from "./AbstractView.js";
import * as utils from "../utils_form.js"
import * as router from "../router.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Sign mainUp Transcendance");
    }

    async getHtml(DOM) {
        await fetch('/template/register').then(function (response) {
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

    addEvents () {
        this.user.logout()
        document.querySelectorAll('form input[type="text"]').forEach(input => {
            input.addEventListener("focusout", utils.checkBlankField);
        });
        document.querySelector('form #email').addEventListener("focusout", utils.checkEmail);
        document.querySelector('form #password').addEventListener("focusout", this.checkPassword);
        document.querySelector('form #repeat-password').addEventListener("focusout", this.checkRepeatPassword);
    
        document.getElementById("submit_form").addEventListener('click', async (event) =>  {
            event.preventDefault();
            this.register();
        })
    }

    register = () => {
        if (!this.checkAllFields())
            return false;
        let RQ_BODY =
        {
            "avatar": "/avatars/default.png",
            "username": document.getElementById("username").value,
            "first_name": document.getElementById("first_name").value,
            "last_name": document.getElementById("last_name").value,
            "email": document.getElementById("email").value,
            "password": document.getElementById("password").value
        }

        this.user.request.post('/api/users/register/', RQ_BODY)
        .then((response) =>
        {
            if (response.ok || response.status == 400)
                return Promise.all([response.json(), response.ok, response.status]);
            else
                throw new Error('Network response was not ok.');
        })
        .then(async ([jsonData, ok, status]) => {
            if (!ok)
            {
                for (const key in jsonData) {
                    if (Object.hasOwnProperty.call(jsonData, key))
                        utils.printError(key, 1, jsonData[key])
                }
                return "An error occured ! Please check fields below ..."
            }
            else
            {
                let username = document.getElementById("username").value
                let password = document.getElementById("password").value
                let response = await this.user.login(username, password);
                return response;
            }
        })
        .then(result => {
            if (result === true)
                router.navigateTo("/home", this.user)
            else
            {
                let errDiv = document.querySelector("#registerForm #errorFeedback");
                errDiv.classList.remove("d-none")
                errDiv.innerHTML = result;
            }
        })
        .catch((error) => {
            //console.log('There was a problem with the fetch operation:', error);
        });
    }

    checkPassword = () => {
            let pass1 = document.querySelector('form input#password').value

            if (!this.isPasswordStrong(pass1))
            {
                utils.printError("password", true, "The password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one digit, and one special character.")
                return false;
            }
            else 
            {
                utils.printError("password", false, "")
                return true
            }

        }
    checkRepeatPassword = () =>
    {
        let pass1 = document.querySelector('form input#password').value
        let pass2 = document.querySelector('form input#repeat-password').value

        if (!this.isPasswordStrong(pass1))
        {
            utils.printError("password", true, "The password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one digit, and one special character.")
            return false;
        }
        if (pass1 === pass2){
            utils.printError("repeat-password", false, "");
            return true;
        }
        else
        {
            utils.printError("repeat-password", true, "The passwords are not the same.");
            return false;
        }
    }

    isPasswordStrong = (password) =>
    {
            if (password.length < 8)
                return false;
            if (!/[A-Z]/.test(password))
                return false;
            if (!/[a-z]/.test(password))
                return false;        
            if (!/\d/.test(password))
                return false;
            if (!/[^A-Za-z0-9]/.test(password))
                return false;
        return true;
    }

    checkAllFields = () =>
    {
        // Récupérer tous les champs du formulaire
        let fields = document.querySelectorAll("form input[type='text']");

        // Vérifier chaque champ * de type text / ne dois pas etre vide.
        let isValid = true;
        fields.forEach(field => {
            if (!utils.checkBlankField({ target: field })) {
                isValid = false;
            }
        });

        let check_pass = this.checkPassword();
        let check_pass2 = this.checkRepeatPassword();
        let check_email = utils.checkEmail({ target: document.querySelector('form input#email') });
       
        if (isValid && check_pass && check_pass2 && check_email)
            return true;
        return false
    }
}