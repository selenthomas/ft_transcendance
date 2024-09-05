import User from "./user.js";
import Request from "./request.js";
import * as router from "./router.js";
import * as friends_utils from "./utils_friends.js"

document.addEventListener("DOMContentLoaded", async() => {

    let RequestInstance = await Request.create();
    const user = new User(RequestInstance);
    const result = await user.checkLocalStorage();
    
    document.body.addEventListener("click", e => {
        if (e.target.matches("[data-link]")) {
            e.preventDefault();
            router.navigateTo(e.target.href, user);
        }
        if (e.target.matches("[logout]")) {
            e.preventDefault();
            (async () => {
                await user.logout();
                router.navigateTo("/login", user);
            })();
            
        }
    });
    await user.getTemplates();

    user.router = router
    router.router(user);

    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.page) {
            router.router(user)
        } else {
            // Gérer l'état null ou une URL non reconnue
            router.navigateTo("/home", user)
        }
    });

    let observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            // Parcourez les nœuds ajoutés
            mutation.addedNodes.forEach(function(node) {
                // Vérifiez si le nœud ajouté est une div avec la classe profile_card
                if (node instanceof HTMLElement && node.classList.contains('profile_card')) {
                    friends_utils.update_profile_cards(user, node);
                }
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
    await user.view.printHeader();
    await user.view.printAside();

});