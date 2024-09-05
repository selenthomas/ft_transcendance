import AbstractView from "./AbstractView.js";
import * as friends_utils from "../utils_friends.js"
import { USER_STATUS } from "../config.js";

export default class extends AbstractView {
    constructor(params) {
        super(params);
        this.setTitle("home");
    }

    async getHtml(DOM) {
        DOM.innerHTML = this.user.TemplateHome.innerHTML;
    }

    async fillHtml(DOM) {   
        this.add_invitations_received()
        this.add_invitations_sent()
        await this.add_pending_matches()
    }

    async addEvents () {
        // WAITING_PLAYER
        let dom
        let response 


        // SUBSCRIBE
        dom = document.querySelector('.subscribe a')
        if (this.user.datas.status == USER_STATUS["WAITING_PLAYER"])
            dom.innerHTML = 'Unsubscribe from waiting list'
        else
            dom.innerHTML = 'Find a random oponent'
        dom.classList.remove('d-none')
        if (dom){
        dom.addEventListener('click',  async e => 
        {
            e.preventDefault();
            try{
            if (e.target.innerHTML == 'Find a random oponent')
            {
                response = await this.user.request.post('/api/match/subscribe/', {})
                if (response.status == 201)
                {
                    let JSONResponse = await response.json()
                    let match_id = JSONResponse['match_id']
                    this.user.router.navigateTo(`/play/${match_id}`, this.user)
                }else if (response.status == 200)
                {
                    e.target.innerHTML = 'Unsubscribe from waiting list'
                    this.user.datas.status = USER_STATUS["WAITING_PLAYER"];
                    this.user.saveDatasToLocalStorage()
                }
            }
            else
            {
                response = await this.user.request.post('/api/match/unsubscribe/', {})
                if (response.ok)
                {
                    e.target.innerHTML = 'Find a random oponent'
                    this.user.datas.status = USER_STATUS["ONLINE"];
                    this.user.saveDatasToLocalStorage()
                }
            }
        } catch (error) {
            //console.log("fetch error")
        }
    })
    }

        // TOURNAMENT MANAGEMENT 
        try{
        response = await this.user.request.get('/api/match/tournament/list/')
        let destination = document.querySelector('#app .tournament')
        let link
        let JSONResponse = await response.json()
        JSONResponse.forEach(tournament => {
            link = document.createElement('div');
            link.classList.add("mr-2", "btn", "btn-dark", "btn-lg");
            link.style.margin = "5px";
            link.innerHTML = tournament["name"];
            link.addEventListener('click',  async e => {
                e.preventDefault();
                this.user.router.navigateTo(`/tournament/${tournament["tournament_id"]}`, this.user)
            })
            destination.appendChild(link)
        }); 
        let create = destination.querySelector('.create .btn')
        create.addEventListener('click',  async e => {
            e.preventDefault();
            this.user.router.navigateTo('/tournament', this.user)
        })
        destination.classList.remove('d-none')
        }catch (e){
            //console.log('fetch error', e)
        }
    }

    async add_pending_matches ()
    {
        /* PENDING MATCHES */
        try{
            let dom = document.querySelector('#app .pending_matchs')
            let response = await this.user.request.post('/api/match/list/pending/')
            let JSONResponse = await response.json()
            JSONResponse.forEach(async match => {
                var newLi = document.createElement('li')
                newLi.classList.add('row', 'col-12');

                var nodePlayer1 = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null,  match['match_points'][0]['user_id'])
                if (nodePlayer1)
                {
                nodePlayer1.classList.remove('col-12')
                nodePlayer1.classList.add('col-md-4')
                nodePlayer1.querySelector(".dropdown").innerHTML = ''
                friends_utils.update_status_text(nodePlayer1)
                }
                var nodePlayer2 = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null,  match['match_points'][1]['user_id'])
                if (nodePlayer2)
                {
                nodePlayer2.classList.remove('col-12')
                nodePlayer2.classList.add('col-md-4')
                nodePlayer2.querySelector(".dropdown").innerHTML = ''
                friends_utils.update_status_text(nodePlayer2)
                }

                var VS = document.createElement('div')
                VS.classList.add('col-md-2', 'text-center')
                VS.innerHTML = '<h4>VS</h4>'
                var play_button = document.createElement('div')
                play_button.classList.add('col-md-2', 'text-center')
                play_button.innerHTML = '<a class="btn btn-primary btn-sm" role="button">play</a>'

                play_button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    this.user.router.navigateTo(`/play/${match['match_id']}`, this.user)
                });
                if(newLi && nodePlayer1 && nodePlayer2 )
                {
                newLi.appendChild(nodePlayer1);
                newLi.appendChild(VS);
                newLi.appendChild(nodePlayer2);
                newLi.appendChild(play_button);
            
                dom.querySelector('ul').appendChild(newLi);
                dom.classList.remove('d-none')
                }

            })
        }catch (e){
        //console.log('fetch error', e)
        }
    }


    /***  INVITATIONS RECEIVED ***/
    add_invitations_received (){
        let nodeCopy;
        let dom = document.querySelector(`#app .invitations_received`)
        const received_invitations = this.user.datas.received_invitations
            received_invitations.forEach(async invitation => {
                nodeCopy = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null, invitation)
                let friend_status = nodeCopy.getAttribute('data-friend-status');
                if (friend_status == USER_STATUS["OFFLINE"])
                    nodeCopy.querySelector(".dropdown").innerHTML = ''
                else
                {
                    let bt_accept = '<a class="accept btn btn-primary btn-sm" role="button">accept</a>'
                    let bt_deny = '<a class="deny btn btn-primary btn-sm" href="#" role="button">deny</a>'
                    
                    nodeCopy.querySelector(".dropdown").innerHTML = bt_accept + " " + bt_deny
                    bt_accept = nodeCopy.querySelector(".dropdown .accept")
                    bt_deny = nodeCopy.querySelector(".dropdown .deny")
                    bt_accept.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await friends_utils.invite(this.user, invitation, 'accept')
                    });
                    bt_deny.addEventListener('click', async (e) => {
                        e.preventDefault();
                        await friends_utils.invite(this.user, invitation, 'deny')
                    });
                }
                dom.querySelector(`ul`).append(nodeCopy);
                dom.classList.remove('d-none')
            });
    }



    /***  INVITATION SENT ***/
    add_invitations_sent (){
        let nodeCopy;
        let dom = document.querySelector(`#app .invitations_sent`)
        const invitations_sent = this.user.datas.invitations_sent
            invitations_sent.forEach(async invitation => {
                nodeCopy = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null, invitation)
                let bt_cancel = '<a class="cancel btn btn-primary btn-sm" role="button">cancel</a>'
                nodeCopy.querySelector(".dropdown").innerHTML = bt_cancel
                bt_cancel = nodeCopy.querySelector(".dropdown .cancel")
                bt_cancel.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await friends_utils.invite(this.user, invitation, 'cancel')
                });
                dom.querySelector(`ul`).append(nodeCopy);
                dom.classList.remove('d-none')
            })

    }

}