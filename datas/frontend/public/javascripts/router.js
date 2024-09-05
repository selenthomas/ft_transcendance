import login from "./views/login.js";
import login42 from "./views/login42.js";
import login2FA from "./views/login2FA.js";
import home from "./views/home.js";
import tournament from "./views/tournament.js";
import play from "./views/play.js";
import profile from "./views/profile.js";
import register from "./views/register.js";
import mpchat from "./views/mpchat.js";


export const pathToRegex = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

export const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map(result => result[1]);

    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};


export const navigateTo = (url, user) => {
    if(user.view){
        window.removeEventListener("keydown", user.view.preventDefaultKeyDown, false);
        window.removeEventListener("keydown", user.view.keyupHandler)
        window.removeEventListener("keyup", user.view.keydownHandler)
    }
    if(user.view && user.view.chatSocket != null){
        user.view.chatSocket.close()
        user.view.chatSocket = null
    }
    if(user.view && user.view.PongSocket != null){
        user.view.PongSocket.close()
        user.view.PongSocket = null
    }
    history.pushState({ page: url }, null, url);
    router(user);
};

export const router = async (user) => {
    const routes = [
        { id:0, path: "/", view: login },
        { id:1, path: "/login", view: login },
        { id:2, path: "/login42", view: login42 },
        { id:3, path: "/login2FA", view: login2FA },
        { id:4, path: "/register", view: register },
        { id:5, path: "/home", view: home },
        { id:6, path: "/profile/:user_id/:tab", view: profile },
        { id:7, path: "/profile/:user_id", view: profile },
        { id:8, path: "/profile", view: profile },
        { id:9, path: "/tournament", view: tournament },
        { id:10, path: "/tournament/:tournament_id", view: tournament },
		{ id:11, path: "/chatroom/:friend_id", view: mpchat},
        { id:12, path: "/play/:match_id", view: play },
        { id:13, path: "/play", view: play }
    ];

    // Test each route for potential match
    const potentialMatches = routes.map(route => {
        return {
            route: route,
            result: location.pathname.match(pathToRegex(route.path))
        };
    });

    let match = potentialMatches.find(potentialMatch => potentialMatch.result !== null);
    if (!match) {
        match = {
            route: routes[0],
            result: [location.pathname]
        };
    }
    if (match.length > 1)
    {
        match = match[0]
    }
        
    let path = location.pathname;
    let isConnected = user.isConnected;
    if (user.request.getJWTtoken() == null)
    {
        user.isConnected = false
    }
    if (match.route.id > 4 && !isConnected)
    {
        navigateTo("/login", user);
        return;
    }
        if (match.route.id < 5 && isConnected)
            {
                navigateTo("/home", user);
                return;
            }
    
    user.view = new match.route.view(getParams(match));
    user.view.user = user;
    try{
        await user.view.getHtml(document.querySelector("#app"));
        await user.view.fillHtml();
        await user.view.addEvents();
    }catch (e){
        //console.log('fetch error')
    }
    return;
};
