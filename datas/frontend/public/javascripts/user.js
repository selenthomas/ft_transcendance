import Request from "./request.js";
import Websockets from "./websockets.js";

export default class User {
    constructor(RequestInstance) {
        this.isConnected = false;
        this.request = RequestInstance;
		this.websockets = null;
    }
    set isConnected(n)
    {
        this._isConnected = n;
    }
    get isConnected()
    {
        return this._isConnected;
    }
	
    set view(n)
    {
        this._view = n;
    }
    get view()
    {
        return this._view;
    }
    set datas(n)
    {
        this._datas = n;
    }
    get datas()
    {
        return this._datas;
    }


    async getTemplates() {
        let tpl_url = '/template/profile_card';
        let response = await fetch(tpl_url);
        let html = await response.text();
        let parser = new DOMParser();
        let doc = parser.parseFromString(html, 'text/html');
        this.DOMProfileCard = doc.querySelector('.profile_card');

        tpl_url = '/template/mpchat_message';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.DOMMpChatMessage = doc.querySelector('.chat_message');

        tpl_url = '/template/home';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateHome = doc.querySelector('.home');

        tpl_url = '/template/profile';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateProfile = doc.querySelector('.profile');

        tpl_url = '/template/profile_profile';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateProfile_profile = doc.querySelector('.profile_profile .tab-pane');

        tpl_url = '/template/profile_followed';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateProfile_followed = doc.querySelector('.profile_followed .tab-pane');

        tpl_url = '/template/profile_history';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateProfile_history = doc.querySelector('.profile_history .tab-pane');

        tpl_url = '/template/tournament';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateTournament = doc.querySelector('#app.tournament');

        tpl_url = '/template/profile_stats';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateProfile_stats = doc.querySelector('.profile_stats .tab-pane');

        tpl_url = '/template/play';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplatePlay = doc.querySelector('#app.template_play');


        tpl_url = '/template/mpchat';
        response = await fetch(tpl_url);
        html = await response.text();
        parser = new DOMParser();
        doc = parser.parseFromString(html, 'text/html');
        this.TemplateChat = doc.querySelector('#app.template_chat');


    }

    async login(userName, passWord) {
        let RQ_Body = {username: userName, password: passWord};
        let response = await this.request.post('/api/users/login/', RQ_Body);
        let response_copy = response.clone();
        if (response_copy.ok) {
            let jsonData = await response_copy.json();
            this.setLocalDatas(jsonData.user);
            this.request.setJWTtoken(jsonData.access, jsonData.refresh);
            this.isConnected = true;			
            this.websockets = new Websockets(this)
            document.querySelector('aside .followed ul').innerHTML = '';
            document.querySelector('aside .online ul').innerHTML = '';
            await this.view.printHeader();
            await this.view.printAside();
            return true;
        } else  {
            return response;
        }
    }

    checkLocalStorage = async() => {
        this.datas = this.getLocalDatas();
        if (this.datas !== null)
        {
            let TockenCheck = await this.request.checkJWTtoken();
            if (TockenCheck == true)
            {
                this._isConnected = true;
                this.websockets = new Websockets(this)

            }
            else
            {
                this.rmLocalDatas();
                this.request.rmJWTtoken();
                this._isConnected = false;
            }
        }
        else
        {
            this._isConnected = false;
        }
        return this._isConnected;
    }

    getLocalDatas = () =>
    {
        let datas = window.localStorage.getItem("LocalDatas");
        this.datas = datas
        return JSON.parse(datas)
    }
    rmLocalDatas = () =>
    {
        this.datas = null
        localStorage.removeItem("LocalDatas");
    }

    setLocalDatas = (jsonData) =>
    {
        this.datas = jsonData;
        window.localStorage.setItem("LocalDatas", JSON.stringify(jsonData));
        //this.token = jsonData;
        // TODO enregistrer un cookie pour plus de securite
    }

    RefreshLocalDatas = async () =>
    {
        if (!this.datas)
            return ;
        let response = await this.request.get('/api/users/profile/'+this.datas.id+'/')
        if (response.ok)
        {
            let jsonData = await response.json();
            window.localStorage.setItem("LocalDatas", JSON.stringify(jsonData));
            this.datas = jsonData;
            return true
        }
        else
            return false
        //this.token = jsonData;
        // TODO enregistrer un cookie pour plus de securite
    }

    saveDatasToLocalStorage = async () =>{
        window.localStorage.setItem("LocalDatas", JSON.stringify(this.datas));
    }

    logout = async() =>{
        let RQ_Body = await this.request.getJWTtoken();
        if (RQ_Body)
        {
            let response = await this.request.post('/api/users/logout/', RQ_Body)
            if (response.ok) {
                this.rmLocalDatas();
                this.request.rmJWTtoken();
                this.request.rmCsrfToken();
                this._isConnected = false;
                this.websockets.notifySocket.close();
                await this.view.printHeader();
                await this.view.printAside();
                this.router.navigateTo('/', this);
            }
        }
    }
}