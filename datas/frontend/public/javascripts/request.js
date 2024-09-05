
export default class Request {
    constructor(url_backend, url_origin, url_wss, host, api42_url) {

        this.url_origin = url_origin
        this.url_backend = url_backend
        this.url_wss = url_wss
        this.host = host
        this.api42_url = api42_url
    }

    static async create() {

        let tpl_url = '/get_env';
        let response = await fetch(tpl_url);
        let textResponse = await response.text(); // Get the response as text

        try {
            let JSONResponse = JSON.parse(textResponse); // Parse the response manually
            return new Request(JSONResponse['URL_BACK'], JSONResponse['URL_FRONT'], JSONResponse['URL_WSS'], JSONResponse['HOST'], JSONResponse['API42_URL']);
        } catch (e) {
            //console.log("Failed to parse JSON:", e); // Log any JSON parsing errors
            throw e; // Re-throw the error after logging it
        }



    }

    async get_request_header(){

        let request_headers = 
        {
            'Accept': 'application/json, text/plain, */*',
            'Origin': this.url_origin,
            'Content-Type': 'application/json',
        }
        request_headers['X-CSRFToken'] = await this.getCsrfToken()
        const JWTtoken = this.getJWTtoken()
        if (JWTtoken)
            request_headers['Authorization'] = `Bearer ${JWTtoken.access}`
        return request_headers
    }

    async post(RQ_url, RQ_body) {
        try {
            const response = await fetch( this.url_backend + RQ_url, {
                method: 'POST',
                headers: await this.get_request_header(),
                body: JSON.stringify(RQ_body),
                credentials: 'include'
            });

            if (response.headers.has('X-CSRFToken'))
                this.setCsrfToken(response.headers.get('X-CSRFToken'))
            if(response.headers.has('csrftoken'))
                this.setCookie('csrftoken', 'Strict', response.headers.get('csrftoken'), 1)
 
            if (response.status === 241 && RQ_url != '/api/users/login/refresh/')
            {
                let response_copy = response.clone()
                let jsonData = await response_copy.json();
                if (jsonData.code === 'token_not_valid')
                {
                    let RefreshResponse = await this.refreshJWTtoken();
                    if (RefreshResponse.ok)
                        return await this.post(RQ_url, RQ_body);
                }
            }
            else if (response.status == 403 && response.statusText == "Forbidden")
            {
                this.rmCsrfToken()
                let RefreshResponse = await this.refreshCsrftoken();
                //if (RefreshResponse.ok)
                    //return await this.post(RQ_url);
            }
            return response;
        } catch (error) {
            //console.log('request.js post error :', error);
            throw error;
        }
    }

    async put(RQ_url, RQ_body) {

       try {
            const response = await fetch(this.url_backend + RQ_url, {
                method: 'PUT',
                headers: await this.get_request_header(),
                body: JSON.stringify(RQ_body),
                credentials: 'include'
            });
            if (response.status === 241 && RQ_url != '/api/users/login/refresh/')
            {
                let jsonData = await response.json();
                if (jsonData.code === "user_not_found")
                {
                    throw "user not found"
                }

                let RefreshResponse = await this.refreshJWTtoken();
                if (RefreshResponse.ok)
                    return await this.put(RQ_url, RQ_body);
                else
                    return response;
            }
            else
                return response;
        } catch (error) {
            //console.log('request.js put error :', error);
            throw error;
        }
    }

    // Pas besoin d'inclure le csrftoken
    async get(RQ_url) {
        try {
            const response = await fetch(this.url_backend + RQ_url, {
                method: 'GET',
                headers: await this.get_request_header(),
            });

            if (response.headers.has('X-CSRFToken'))
            {
                this.setCsrfToken(response.headers.get('X-CSRFToken'))

            }
            if(response.headers.has('csrftoken'))
            {

                this.setCookie('csrftoken', 'Strict', response.headers.get('csrftoken'), 1)
            }
 
            if (response.status === 241 && RQ_url != '/api/users/login/refresh/')
            {
                try {
                    let jsonData = await response.json();

                    if (jsonData.code === "user_not_found")
                    {
                        //throw "user not found"
                    }
                    if (jsonData.code === 'token_not_valid')
                    {
                        let RefreshResponse = await this.refreshJWTtoken();
                        if (RefreshResponse.ok)
                            return await this.get(RQ_url);
                        //else
                          //  return response;
                    }
                } catch (e) {
                    //console.log("Failed to parse JSON:", e); // Log any JSON parsing errors
                    throw e; // Re-throw the error after logging it
                }
        

            }
            else
            {
                return response;
            }
        } catch (error) {
            //console.log('request.js get error :', error);
            throw error;
        }
    }

    async refreshJWTtoken()
    {
        let response = await this.post('/api/users/login/refresh/', this.getJWTtoken());
		if (response.ok)
		{
			let jsonData = await response.json();
			this.JWTtoken = jsonData;
			this.setJWTtoken(jsonData.access, jsonData.refresh);
		}
        else
            this.rmJWTtoken()
        return response;
    }

    async refreshCsrftoken()
    {
        let response = await this.get('/api/users/refresh_csrftoken/');
		if (response.ok)
		{
            if (response.headers.has('X-CSRFToken'))
                {
                    this.setCsrfToken(response.headers.get('X-CSRFToken'))
                }
 		}
        return response;
    }

    rmJWTtoken()
    {
        this.rmCookie("JWTtoken")
    }
    getJWTtoken()
    {
        let tmp = this.getCookie("JWTtoken")
        //let tmp = window.localStorage.getItem("JWTtoken");
        return JSON.parse(tmp);
    }

    setJWTtoken(tk_access, tk_refresh)
    {
        this.JWTtoken =
        {
            access: tk_access,
            refresh: tk_refresh,
        }
        this.setCookie("JWTtoken", "Strict", JSON.stringify(this.JWTtoken), 1);
        //window.localStorage.setItem("JWTtoken", JSON.stringify(this.JWTtoken));

    }

    async checkJWTtoken()
    {
        let response = await this.get("/api/users/checktoken/")
        //console.log('checkJWTtoken', response)
        if(response.status == 502)
            window.location.href = '/internal_server_error.html';
        if (response && response.ok)
            return true;
        else
        {
            this.rmCsrfToken()
            this.rmJWTtoken()
            return false;
        }
    }

    getCookie = (name) =>
    {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    rmCookie = (name) =>
    {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC ; SameSite=None; Secure ; path=/";
    }

    setCookie(name, SameSite, value, days = 1) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; SameSite="+ SameSite +"; Secure ; path=/";
    }

    async getCsrfToken() {
        const csrfCookie = this.getCookie('X-CSRFToken')
        if (csrfCookie)
            return csrfCookie
        return null;
    }

    async setCsrfToken(csrftoken)
    {
        this.setCookie('X-CSRFToken', 'Strict', csrftoken, 1)
        //this.setCookie('csrftoken', 'Strict', csrftoken, 1)
    }

    async rmCsrfToken(csrftoken)
    {
        this.rmCookie('X-CSRFToken')
    }


}