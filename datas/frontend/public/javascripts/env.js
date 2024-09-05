
let tpl_url = '/get_env';
let response = await fetch(tpl_url);
let JSONResponse = await response.json();


export const MY_ENV = {
    URL_BACK: JSONResponse['URL_BACK'],
    URL_FRONT: JSONResponse['URL_FRONT'],
    URL_FORTY_TWO: JSONResponse['URL_FORTY_TWO']
}
