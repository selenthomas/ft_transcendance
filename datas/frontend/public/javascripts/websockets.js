import * as router from "./router.js";
import * as friends_utils from "./utils_friends.js"
import * as checkIfBlock from "./views/mpchat.js"
import {USER_STATUS} from "./config.js";

export default class Websockets {
    constructor(user) {
		this.user = user
	
		this.reconnectAttempts = 0;

		this.count = 0;
		this.countnotif = document.querySelector(".countnotif");
		this.countnotif.textContent = this.count;

		this.setupWebSocket()
	}

    setupWebSocket() {
        this.notifySocket = new WebSocket(
            `${this.user.request.url_wss}/ws/notify/?token=${this.user.request.getJWTtoken()['access']}`
        );

        // on socket open
        this.notifySocket.onopen = (e) => {
            this.reconnectAttempts = 0;
            //console.log('WebSocket connection opened');
        };

        // on socket close
        this.notifySocket.onclose = (e) => {
            //console.log('WebSocket connection closed ....... ', e);

            this.attemptReconnect();
        };
		this.notifySocket.onmessage = (e) => 
		{
			this.treatMessage(e)
		};
    }

    attemptReconnect = () => {
        if (this.reconnectAttempts < 5 && this.user.isConnected) {
            setTimeout(() => {
                //console.log(`Attempting reconnect [${this.reconnectAttempts}]`);
                this.reconnectAttempts++;
                this.setupWebSocket();
            }, 100); // 0.5 second interval
        } else  if (this.user.isConnected){
            // Max attempts reached, redirect to another page
            //console.log("Max reconnect attempts reached. Redirecting...");
            window.location.href = '/internal_server_error.html';
        }
    }

	// on receiving message on group
	treatMessage = async (e) => {
			const data = JSON.parse(e.data);
			if(data.error && data.error == 'token_not_valid')
			{
				let RefreshResponse = await this.user.request.refreshJWTtoken();
				if (RefreshResponse.ok)
				{
					//console.log('token_not_valid')
					//this.notifySocket.close();
					//this.setupWebSocket();
					//this.user.websockets = this.notifySocket
				}
				return;
			}
			
			if (data.code_name == "STA")
				this.update_status(data)
			
			if (data.code_name == "INV")
				this.update_invitation(data)

			if (data.code_name == "MSG")
				this.update_msg_link(data)

			if (data.code_name == "BLK"){
				this.update_block(data)
			}

			if (data.code_name == "FLW"){
				this.update_follow(data)
			}

			if (data.code_name == "PFL"){
				this.update_profile(data)
			}

			if (data.message && data.code_name != "PFL")
			{
				this.print_notification(data)
				//router.router(this.user);
			}
			
		};
    

	
	update_profile = async (data) => {
		let friend_id = data.sender;
		let username = data.message.username;
		let avatar = data.message.avatar;
		let profile_cards = document.querySelectorAll(`.profile_card[data-friend-id="${friend_id}"]`);
		/// IMG Managment
		let avatar_url = null;
		if (avatar)
		{
			try {
				const response = await fetch(avatar);
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const blob = await response.blob();
				const objectURL = URL.createObjectURL(blob);
				avatar_url =  objectURL;
			} catch (error) {
				// an error occured
			}
		}

		profile_cards.forEach(profile_card => {
			if (avatar_url)
				profile_card.querySelector('.avatar').src = avatar_url;
			if (profile_card.querySelector('.username'))
				profile_card.querySelector('.username').innerHTML = username;
		});

		
		//this.user.saveDatasToLocalStorage()
		friends_utils.update_profile_cards_text(this.user)
		// this.user.router.navigateTo('/profile/' + friend_id, this.user);
	}

	update_follow = async (data) => {
		let friend_id = data.sender;
		if (data.code_value == 1) // following someone 
		{
			if (!this.user.datas.follows.includes(data.sender)){
				this.user.datas.followed_by.push(data.sender)
				document.querySelector(".follow").innerHTML = "unfollow"

			}
		}
		if (data.code_value == 2) // unfollowing someone
		{
			this.user.datas.followed_by = this.user.datas.followed_by.filter(id => id !== data.sender);
		}
		this.user.saveDatasToLocalStorage()
		friends_utils.update_profile_cards_text(this.user)
        if(location.pathname == `/profile/${friend_id}/followed`){
			// this.user.router.navigateTo('/profile/' + friend_id, this.user);
			this.user.router.navigateTo(`/profile/${friend_id}/followed`, this.user)
		}
		// this.user.router.navigateTo('/profile/' + friend_id, this.user);
		data.link = `/profile/${friend_id}/followed`;
	}

	update_block = async (data) => {
		let friend_id = data.sender;
		if (data.code_value == 1) // blocking someone 
		{
			if (!this.user.datas.blocked_by.includes(data.sender))
				this.user.datas.blocked_by.push(data.sender)
		}
		if (data.code_value == 2) // blocked by someone
		{
			this.user.datas.blocked_by = this.user.datas.blocked_by.filter(id => id !== data.sender);
		}
		this.user.saveDatasToLocalStorage()
		friends_utils.update_profile_cards_text(this.user)
        if(location.pathname == '/chatroom/' + friend_id){
			this.user.router.navigateTo('/chatroom/' + friend_id, this.user);
		}
		// this.user.router.navigateTo('/chatroom/' + friend_id, this.user);
		data.link = '/chatroom/' + friend_id;
	}
	update_msg_link = async (data) => {
		let friend_id = data.sender;
		data.link = "/chatroom/" + friend_id;
	}
	
	print_notification(data)
	{
		if (location.pathname === data.link){
			this.count = 0;
			return
		}
		this.count++;

		this.countnotif.textContent = this.count;

		let notif = document.querySelector(".notif ul");

		var newLi = document.createElement('li');
		var newAnchor = document.createElement('a');
		newAnchor.classList.add("dropdown-item")

		// newAnchor.className = 'dropdown-item text-wrap';
		newAnchor.textContent = data.message;
		newLi.appendChild(newAnchor);
		notif.insertBefore(newLi, notif.firstChild);
		// 

		newAnchor.addEventListener('click', async (e) => {
			e.preventDefault();
			this.user.router.navigateTo(data.link, this.user)
			this.count--;
			this.countnotif.textContent = this.count;
		});

		document.querySelector(".notifdropdown").addEventListener('click', async (e) => {
			this.count = 0;
			this.countnotif.textContent = this.count;
		});
		// 
		// var ulElement = document.getElementById('notify');
		//
	}


	update_invitation = async (data) => {
		if (data.code_value == 1) // invitation received
		{
			if (!this.user.datas.received_invitations.includes(data.sender))
				this.user.datas.received_invitations.push(data.sender)
		}
		if (data.code_value == 2) // invitation cancelled
		{
			this.user.datas.received_invitations = this.user.datas.received_invitations.filter(id => id !== data.sender);
		}
		if (data.code_value == 3 || data.code_value == 4) // invitation denied or accepted
		{
			this.user.datas.invitations_sent = this.user.datas.invitations_sent.filter(id => id !== data.sender);
		}

		this.user.saveDatasToLocalStorage()
		friends_utils.update_profile_cards_text(this.user)
        if(location.pathname == '/home'){
			this.user.router.navigateTo('/home', this.user);
		}
		if(location.pathname == '/chatroom/' + data.sender){
			let DOM = this.user.DOMMpChatMessage.cloneNode(true)
			let text = DOM.querySelector(".message");

			DOM.style.backgroundColor = '#75b798';

			text.classList.add('d-flex', 'flex-row', 'justify-content-center')
			let chatbox = document.querySelector("#app .overflow-scroll");

			text.innerHTML = data.message
	
			chatbox.scrollTop = document.querySelector(".endofscroll").offsetTop
			document.querySelector('#chat-message-input')
			document.querySelector("#app .overflow-scroll ul").appendChild(DOM)

		}
	}
	update_status = async (data) => {
	{
		try{
		let friend_id = data.sender
		let friend_status = data.code_value
		let profile_cards = document.querySelectorAll(`.profile_card[data-friend-id="${friend_id}"]`);

		profile_cards.forEach(profile_card => {
				profile_card.setAttribute('data-friend-status', friend_status);
		});

		friends_utils.update_profile_cards_text(this.user, friend_id)
		
		let existing_thumbnail = document.querySelector(`aside .online ul .profile_card[data-friend-id="${friend_id}"]`);
		if (existing_thumbnail && friend_status == USER_STATUS['OFFLINE'])
			existing_thumbnail.remove()

		if (!existing_thumbnail && friend_status == USER_STATUS['ONLINE'] && friend_id != this.user.datas.id)
		{			
			let nodeCopy = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null, friend_id)
			document.querySelector(`aside .online ul`).append(nodeCopy)
		}
	}catch(e){
		//console.log('fetch error')
	}
	}
}

}