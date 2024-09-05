/// BLOCK FUNCTIONS
import {USER_STATUS} from "./config.js";

export function is_invited(user,friend_id )
{
    try{
        return user.datas.invitations_sent.find(id => id == friend_id) !== undefined;
    }catch (e){
        //console.log('fetch error')
    }
}

export function is_blocked(user, friend_id)
{
    try{
        return user.datas.blocks.find(id => id == friend_id) !== undefined;
    }catch (e){
        //console.log('fetch error')
    }
}

export function is_blocked_by(user, friend_id)
{
    try{
        return user.datas.blocked_by.find(id => id == friend_id) !== undefined;
    }catch (e){
        //console.log('fetch error')
    }
}

export function is_followed(user, friend_id)
{
    try{
        return user.datas.follows.find(id => id == friend_id) !== undefined;
    }catch (e){
        //console.log('fetch error')
    }
}


export async function block(user, friend_id, action)
{
    try{
    let response = await user.request.get(`/api/users/${action}/${friend_id}/`)
    if (response.status == 200)
    {
        if((action == "block") && (!user.datas.blocks.includes(friend_id)))
        {
            user.datas.blocks.push(friend_id);
        } else if (action == "unblock"){
            user.datas.blocks = user.datas.blocks.filter(id => id !== friend_id);
        }
        user.saveDatasToLocalStorage();
        let profile_cards = document.querySelectorAll(`.profile_card[data-friend-id="${friend_id}"] .block`);
        profile_cards.forEach(dom => {
            dom.innerHTML = (action == 'block') ? 'unblock' : 'block';
        });
        update_profile_cards_text(user, friend_id)
        if ((action == "block" || action == "unblock") && (location.pathname == '/chatroom/' + friend_id)){
            user.router.navigateTo('/chatroom/' + friend_id, user);
        }
    }
    }catch (e){
        //console.log('fetch error')
    }
}

export async function invite(user, friend_id, action)
{
    try{
    let response = await user.request.post(`/api/match/invite/${action}/${friend_id}/`)
    if (response.status == 200)
    {
        if (action == 'send'){
            user.datas.status = USER_STATUS["WAITING_FRIEND"]
            if (!user.datas.invitations_sent.includes(friend_id))
                user.datas.invitations_sent.push(friend_id)

        }else if (action == 'cancel'){
            user.datas.status = USER_STATUS["ONLINE"]
            user.datas.invitations_sent = user.datas.invitations_sent.filter(id => id !== friend_id);

        }else if (action == 'deny' || action == 'accept' ){
			user.datas.received_invitations = user.datas.received_invitations.filter(id => id !== friend_id);
        }
        if(action == 'accept')
        {
            user.datas.status = USER_STATUS["PLAYING"]
        }
        user.saveDatasToLocalStorage();
        update_profile_cards_text(user)
        if ((action != "accept") && (location.pathname == '/home')){
            user.router.router(user);
        }
        if (action == 'accept')
        {
            let JSONresponse = await response.json();
            user.router.navigateTo('/play/' + JSONresponse.match_id, user);
        }
    }
    }catch (e){
        //console.log('fetch error')
    }
}

export async function follow(user, friend_id, action)
{
    try{
    let response = await user.request.get(`/api/users/${action}/${friend_id}/`)
    if (response.status == 200)
    {
        // UPDATE LOCAL STORAGE
        if((action == "follow") && (!user.datas.follows.includes(friend_id)))
        {
            user.datas.follows.push(friend_id);
        } else if (action == "unfollow"){
            user.datas.follows = user.datas.follows.filter(id => id !== friend_id);
        }
        user.saveDatasToLocalStorage();
        update_profile_cards_text(user, friend_id)

       

        let profile_card = document.querySelector(`aside .profile_card[data-friend-id="${friend_id}"]`);
        let followed_div = document.querySelector(`aside .followed ul.userList`);
        let test = followed_div.querySelector(`aside .profile_card[data-friend-id="${friend_id}"]`)
        if (action =='follow' && !test && profile_card)
            followed_div.append(profile_card.cloneNode(true))
        else if (action =='unfollow' && test)
            test.remove()
    }
    }catch (e){
        //console.log('fetch error')
    }
}

export async function update_block_text(user, profile_card, friend_id) {
    try{
    let dom;
    let check = is_blocked(user, friend_id);
    dom = profile_card.querySelector('.block');
    if (dom)
        dom.innerHTML = (check) ? 'unblock' : 'block';
    }catch (e){
        //console.log('fetch error')
    }
}

export async function update_follow_text(user, profile_card, friend_id) {
    try{
    let dom;
    let check = is_followed(user, friend_id);
    dom = profile_card.querySelector('.follow');
    if (dom)
        dom.innerHTML = (check) ? 'unfollow' : 'follow';
    }catch (e){
        //console.log('fetch error')
    }
}

export async function update_chat_text(user, profile_card, friend_id) {
    try{
    let dom;
    let check_is_blocked = is_blocked(user, friend_id);
    let check_is_blocked_by = is_blocked_by(user, friend_id);
    let friend_status = profile_card.getAttribute('data-friend-status');
    dom = profile_card.querySelector('.chat');
    if (!dom)
        return ;
    if (check_is_blocked || check_is_blocked_by||  friend_status == USER_STATUS["OFFLINE"])
        dom.classList.add('d-none')
    else
        dom.classList.remove('d-none')
    dom.innerHTML = (!check_is_blocked && !check_is_blocked_by) ? 'send a message' : 'unblock to send a message';
    }catch (e){
        //console.log('fetch error')
    }
}


export async function update_invite_text(user, profile_card, friend_id) {
    try{
    let dom = profile_card.querySelector('.invite');
    if (!dom)
        return;
    let check = is_invited(user, friend_id)
    if (!check)
        dom.innerHTML = 'invite to play';
    else
        dom.innerHTML = 'cancel invitation';
    }catch (e){
        //console.log('fetch error')
    }
}


export async function add_block_event(user, profile_card, friend_id) {
    try{
        
    let dom;
    dom = profile_card.querySelector('.block');
    if (!dom)
        return
    dom.removeEventListener('click', async (e) => {})
    dom.addEventListener('click', async (e) => {
        e.preventDefault();
        block(user, friend_id, e.target.innerHTML)
    });
}catch (e){
    //console.log('fetch error')
}
}
export async function add_follow_event(user, profile_card, friend_id) {
    try{
    let dom = profile_card.querySelector('.follow');
    if (!dom)
        return
    dom.removeEventListener('click',async (e) => {})
    dom.addEventListener('click', async (e) => {
        e.preventDefault();
        follow(user, friend_id, e.target.innerHTML)
    });
}catch (e){
    //console.log('fetch error')
}
}
export async function add_profile_event(user, profile_card, friend_id) {
    try{
        let profile_url = null
    let dom = profile_card.querySelector('.profile');
    if (!dom)
        return
    if (friend_id)
        profile_url = "/profile/" + friend_id
    dom.removeEventListener('click',async (e) => {})
    dom.addEventListener('click', async (e) => {
        e.preventDefault();
        user.router.navigateTo(profile_url, user);
    });
    profile_card.querySelector(".avatar").removeEventListener('click',async (e) => {})
    profile_card.querySelector(".avatar").addEventListener('click', async (e) =>  {
        e.preventDefault();
        if (profile_url)
            user.router.navigateTo(profile_url, user);
    });
}catch (e){
    //console.log('fetch error')
}
}

export async function add_chat_event(user, profile_card, friend_id) {
	try{
    let dom = profile_card.querySelector('.chat');
	if (!dom)
		return
	dom.removeEventListener('click',async (e) => {})
	dom.addEventListener('click', async (e) => {
		e.preventDefault();
		let chat_url = "/chatroom/" + friend_id
		user.router.navigateTo(chat_url, user);
	});
}catch (e){
    //console.log('fetch error')
}
}


export async function add_invite_event(user, profile_card, profile_id)
{
    try{
    let dom = profile_card.querySelector('.invite');
    if (!dom)
        return
    dom.removeEventListener('click',async (e) => {})
    dom.addEventListener('click', async (e) => {
        e.preventDefault();
        let action = (e.target.innerHTML == 'invite to play') ? 'send' : 'cancel'
        invite(user, profile_id, action)
    });
}catch (e){
    //console.log('fetch error')
}
}

/// STATUS
export async function update_status_text(profile_card)
{
    try{
    let friend_status = profile_card.getAttribute('data-friend-status');
    let dom = profile_card.querySelector('.status span');
    if (!dom)
        return;
    let text, color
    switch (parseInt(friend_status))
    {
        case USER_STATUS['OFFLINE'] :
            text = 'offline'
            color = 'text-danger'
            break
        case USER_STATUS['PLAYING'] :
            text = 'playing ...'
            color = 'text-primary'
            break
        default:
        //case USER_STATUS['ONLINE'] :
            text = 'online'
            color = 'text-success'
            break
        //    text = 'waiting to play ...'
        //    color = 'text-primary'
        //    break
    }
    dom.innerHTML = text
    dom.removeAttribute('class')
    dom.classList.add(color)
}catch (e){
    //console.log('fetch error')
}
}
export async function create_anonymous_thumbnail(nodeToCopy, user, alias)
{
    try{
    const nodeCopy = nodeToCopy.cloneNode(true);
    nodeCopy.querySelector(".username").innerHTML = alias ? alias : "Anonymous"
    nodeCopy.querySelector(".status").remove()
    nodeCopy.querySelector("img.avatar").src = '/avatars/default.png'

    return nodeCopy;
    }catch (e){
        //console.log('fetch error')
    }
}

export async function create_thumbnail(nodeToCopy, user, friend, friend_id, alias="")
{
    try{
    if (!friend_id || friend_id == null)
        return create_anonymous_thumbnail(nodeToCopy, user, alias)
    let existing_thumbnail = document.querySelector(`aside .profile_card[data-friend-id="${friend_id}"]`)
    if (existing_thumbnail)
        return existing_thumbnail.cloneNode(true)
    if (friend == null && friend_id != null)
    {
        let response = await user.request.get(`/api/users/profile/${friend_id}/`)
        if (response.status === 200)
            friend = await response.json();
    }
    const nodeCopy = nodeToCopy.cloneNode(true);
    if (friend.id)
        await nodeCopy.setAttribute("data-friend-id", friend.id)
    if (friend.status)
        await nodeCopy.setAttribute("data-friend-status", friend.status)
    if (friend.username)
        nodeCopy.querySelector(".username").innerHTML = friend.username


    /// IMG Managment
    let avatar = (friend.avatar && friend.avatar != '') ? friend.avatar : '/avatars/default.png'
    try {
        if (friend.avatar instanceof Blob) {
            const blob = await friend.avatar;
            const objectURL = URL.createObjectURL(blob);
            nodeCopy.querySelector("img.avatar").src = objectURL;
        } else {
            const response = await fetch(avatar);
            if (response.ok) {
                const blob = await response.blob();
                const objectURL = URL.createObjectURL(blob);
                nodeCopy.querySelector("img.avatar").src = objectURL;
                nodeCopy.querySelector("img.avatar").setAttribute('img-src', avatar)
            }
        }
    } catch (error) {
        nodeCopy.querySelector("img.avatar").src = '/avatars/default.png'; // Image de secours en cas d'échec
    }


    if (friend.id && user.datas.id == friend.id)
    {
        nodeCopy.querySelector(".dropdown").innerHTML = ''
        return nodeCopy;
    }
    var dropdownToggle = nodeCopy.querySelector(".dropdown-toggle");
    var dropdown = new bootstrap.Dropdown(dropdownToggle);
    return nodeCopy;
    }catch (e){
        //console.log('fetch error')
    }
}

export function update_profile_cards_text(user, friend_id)
{
    try{
    let profile_cards
    if(friend_id)
        profile_cards = document.querySelectorAll(`.profile_card[data-friend-id="${friend_id}"]`);
    else
        profile_cards = document.querySelectorAll(`.profile_card`);

    profile_cards.forEach(profile_card => {
        let profile_id = profile_card.getAttribute('data-friend-id');
        update_block_text(user, profile_card, profile_id)
        update_follow_text(user, profile_card, profile_id)
        update_status_text(profile_card)
        update_invite_text(user, profile_card, profile_id)
        update_chat_text(user, profile_card, profile_id)
    });
}catch (e){
    //console.log('fetch error')
}
}

export function update_profile_cards(user, profile_card)
{
    try{
    let profile_id = profile_card.getAttribute('data-friend-id');
    update_block_text(user, profile_card, profile_id)
    update_follow_text(user, profile_card, profile_id)
    update_status_text(profile_card)
    update_invite_text(user, profile_card, profile_id)
    update_chat_text(user, profile_card, profile_id)
    
    add_follow_event(user, profile_card, profile_id)
    add_block_event(user, profile_card, profile_id)
    add_profile_event(user, profile_card, profile_id)
    add_invite_event(user, profile_card, profile_id)
    add_chat_event(user, profile_card, profile_id)
    }catch (e){
        //console.log('fetch error')
    }
}