import AbstractView from "./AbstractView.js";
import * as utils from "../utils_form.js"
import * as router from "../router.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("Login too Transcendance");
    }

    async getHtml(DOM) {
        await fetch('/template/login').then(function (response) {
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

        document.querySelector('#createUsers').addEventListener("click", this.createUsers);
        document.querySelector('#login42Button').addEventListener("click", this.login42);
        document.querySelector('#login2FAButton').addEventListener("click", this.login2FA);
        document.querySelector("#loginForm #submit_form").addEventListener('click', async (event) =>  {
            event.preventDefault();
            this.login();
        })
    }


    login = async () => { 
        let username = document.querySelector("#loginForm #username").value;
        let password = document.querySelector("#loginForm #password").value;
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
            //console.log('There was a problem with the fetch operation:', error);
        });
    }

    login42 = async () => {
        // TODO Mettre dans l'ENV
        const url42 = `https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-32b19fff9e0bdc8b9a6274453ce546cef0f304df7e01d5b7d3be2cac715fa306&redirect_uri=https%3A%2F%2F${this.user.request.host}%3A8483%2Flogin42&response_type=code`
        //let url42 = this.user.request.api42_url
        //url42 = 'https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-32b19fff9e0bdc8b9a6274453ce546cef0f304df7e01d5b7d3be2cac715fa306&redirect_uri=https%3A%2F%2Fmade-f0br3s3.clusters.42paris.fr%3A8483%2Flogin42&response_type=code'
        window.open(url42, "_self");
    };
        // sur le post : code 429 = trop de requetes a la fois --> timer pour que ralentisse // ou spammer jusqu'a ce qu'il accepte
       
        // return response.json();
        // const authorizeUrl = 'https://api.intra.42.fr/oauth/authorize/';
    
        // // Paramètres requis pour l'autorisation (client_id, redirect_uri, etc. a ajouter : scope, state, etc.)
        // const clientId = 'client_id'; // The client ID you received from 42 when you registered.
        // const redirectUri = 'https://:3000/callback'; // Remplacez cela par votre propre URI de redirection
        // // Construire l'URL d'autorisation avec les paramètres requis
        // const formattedUrl = `${authorizeUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    
        // // Rediriger l'utilisateur vers l'URL d'autorisation
        // window.location.href = formattedUrl;
    // }
    
    login2FA = async () => { 
        this.user.router.navigateTo('/login2FA', this.user);
    }
    createUsers = async () => {
        let RQ_BODY
        let response
        RQ_BODY =
        {
            "avatar": "/avatars/avataaars_0.png",
            "username": 'edgar',
            "first_name": 'Edgar',
            "last_name": 'Thomas',
            "email": 'edgar@sethomas.com',
            "password": 'root'
        }
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_1.png'
        RQ_BODY.username = 'eugene'
        RQ_BODY.first_name = 'Eugene'
        RQ_BODY.last_name = 'Thomas'
        RQ_BODY.email = 'eugene@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_2.png'
        RQ_BODY.username = 'romain'
        RQ_BODY.first_name = 'Romain'
        RQ_BODY.last_name = 'Thomas'
        RQ_BODY.email = 'romain@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_3.png'
        RQ_BODY.username = 'alice'
        RQ_BODY.first_name = 'Alice'
        RQ_BODY.last_name = 'Vedrenne'
        RQ_BODY.email = 'alive@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_4.png'
        RQ_BODY.username = 'marieaimee'
        RQ_BODY.first_name = 'Marie Aimee'
        RQ_BODY.last_name = 'Rabourdin'
        RQ_BODY.email = 'marieaimee@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_5.png'
        RQ_BODY.username = 'selen'
        RQ_BODY.first_name = 'Selen'
        RQ_BODY.last_name = 'Thomas'
        RQ_BODY.email = 'selen@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_6.png'
        RQ_BODY.username = 'eric'
        RQ_BODY.first_name = 'Eric'
        RQ_BODY.last_name = 'Bremond'
        RQ_BODY.email = 'eric@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_7.png'
        RQ_BODY.username = 'salome'
        RQ_BODY.first_name = 'Salome'
        RQ_BODY.last_name = 'Danel'
        RQ_BODY.email = 'salome@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_8.png'
        RQ_BODY.username = 'thomas'
        RQ_BODY.first_name = 'Thomas'
        RQ_BODY.last_name = 'Michel V'
        RQ_BODY.email = 'thomas@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_9.png'
        RQ_BODY.username = 'audrey'
        RQ_BODY.first_name = 'Audrey'
        RQ_BODY.last_name = 'Coffignot'
        RQ_BODY.email = 'audrey@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)

        RQ_BODY.avatar = '/avatars/avataaars_10.png'
        RQ_BODY.username = 'arsene'
        RQ_BODY.first_name = 'Arsene'
        RQ_BODY.last_name = 'Monarcha'
        RQ_BODY.email = 'arsene@sethomas.com'
        response = await this.user.request.post('/api/users/register/', RQ_BODY)
    }
}
