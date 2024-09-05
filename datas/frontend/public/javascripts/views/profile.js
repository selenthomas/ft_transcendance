import AbstractView from "./AbstractView.js";
import * as form from "../utils_form.js"
import * as friends_utils from "../utils_friends.js"
import * as router from "../router.js"

export default class extends AbstractView {
	constructor(params) {
		super(params);
		this.setTitle("Profile");
		const UserDatas = null;
	}
	
	is_user_page()
	{
		if (this.params.user_id)
		{
			if (this.params.user_id == this.user.datas.id){
				return true
			}
			else
				return false
		}
		else
			return true
	}

	async getHtml(DOM) {

		DOM.innerHTML = this.user.TemplateProfile.cloneNode(true).innerHTML;
		let tabContent = DOM.querySelector('.tab-content')
		while (tabContent.firstChild) {
			tabContent.removeChild(tabContent.firstChild);
		}
		DOM.querySelector('.tab-content').append(this.user.TemplateProfile_profile.cloneNode(true));
		DOM.querySelector('.tab-content').append(this.user.TemplateProfile_stats.cloneNode(true));
		DOM.querySelector('.tab-content').append(this.user.TemplateProfile_history.cloneNode(true));

		if (!this.is_user_page())
		{
			DOM.querySelector('.tab-content .tab-pane.profile form button#submit_form').remove()
			DOM.querySelector('.tab-content').append(this.user.TemplateProfile_followed.cloneNode(true));
		}
		else
			document.querySelector('.nav.nav-tabs li[data-target="followed"]').remove()

		document.querySelectorAll('.nav.nav-tabs li a').forEach(element => {
			element.classList.remove('active');
		});
		document.querySelectorAll('.tab-content .tab-pane').forEach(element => {
			element.classList.remove('active');
		});
		document.querySelector('.tab-content .tab-pane.profile').classList.add('active')
		document.querySelector('.nav.nav-tabs li[data-target="profile"] a').classList.add('active')
		if (this.is_user_page())
			this.UserDatas = this.user.datas;
		else
		{
			let response = await this.user.request.get('/api/users/profile/'+this.user.datas.id+'/')
			if (response.ok)
				this.UserDatas = await response.json();

			var elements = document.querySelectorAll('input, textarea');
			elements.forEach(function(element) {
				element.setAttribute('readonly', 'readonly');
				element.classList.add('form-control-plaintext');
			});
			response = await this.user.request.get('/api/users/profile/'+this.params.user_id+'/')
			if (response.ok){
				this.UserDatas = await response.json();
			}
		}
	}

	async fillHtml(DOM) {
		
		if (this.UserDatas == undefined)
			return;
		this.fillProfile()
		this.fillFollowed()
		try{
		let URL = '/api/match/history/'+ this.UserDatas.id+'/';
		let response = await this.user.request.get(URL);
        if (response.ok)
        {
			
			let JSONResponse = await response.json();
			this.matches_stat = JSONResponse.matches_stat;
			this.matches_history = JSONResponse.matches_history;
			this.tournaments_history = JSONResponse.tournaments_history;
			this.fillStats()
			this.fillHistory()
		}
		}catch (e){
			//console.log('fetch error')
		}
	}

	async fillFollowed()
	{

			let dest_container = document.querySelector('main .followed ul')
			
			if (dest_container.hasChildNodes())
				return ;
			if(!this.UserDatas)
				return;
			const friends = this.UserDatas.follows;
			if (!friends)
				return
			friends.forEach(async friend_id => {
				const nodeCopy = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null, friend_id);
				dest_container.appendChild(nodeCopy);
			})


	}

	formatDate = (isoDate) => {
		// Créer un objet Date à partir de la chaîne de date ISO
		const date = new Date(isoDate);
	
		// Extraire les différentes parties de la date
		const day = String(date.getUTCDate()).padStart(2, '0'); // Jour (DD)
		const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mois (MM)
		const year = String(date.getUTCFullYear()).slice(2); // Année (YY)
		const hours = String(date.getUTCHours()).padStart(2, '0'); // Heure (HH)
		const minutes = String(date.getUTCMinutes()).padStart(2, '0'); // Minute (MM)
	
		// Formater la date selon le format souhaité
		let newDate = `${day}-${month}-${year} ${hours}:${minutes}`;
		return newDate;
	}

	async fillHistory()
	{
		try{
			let matchs = this.matches_history;
			let tbody = document.querySelector(".table.matches_history");
			matchs.forEach(async match => {
				
				let newMatch = document.createElement('tr');
				newMatch.classList.add('new-match');

				let matchDate = document.createElement('td');
				matchDate.classList.add('match-date');

				let player1 = document.createElement('td');
				player1.classList.add('player1');
				let player2 = document.createElement('td');
				player2.classList.add('player2');
				let winner = document.createElement('td');
				winner.classList.add('winner');
				let p1 = match.match_points[0].points;
				let p2 = match.match_points[1].points;

				matchDate.innerHTML = this.formatDate(match.created_at);
				player1.innerHTML = `${match.match_points[0].alias} [${match.match_points[0].points}]`;
				player2.innerHTML = `${match.match_points[1].alias} [${match.match_points[1].points}]`;
				if (p1 > p2){
					if (match.match_points[0].user_id == this.UserDatas.id){
						winner.classList.add('text-success');
					}
					else {
						winner.classList.add('text-danger');
					}
					winner.innerHTML = match.match_points[0].alias;
				}
				else{
					if (match.match_points[1].user_id == this.UserDatas.id){
						winner.classList.add('text-success');
					}
					else {
						winner.classList.add('text-danger');
					}
					winner.innerHTML = match.match_points[1].alias;
				}

				newMatch.appendChild(matchDate);
				newMatch.appendChild(player1);
				newMatch.appendChild(player2);
				newMatch.appendChild(winner);
				
				// tbody.insertBefore(newMatch, tbody.firstChild);
				tbody.appendChild(newMatch);
				// tbody.parentNode.insertBefore(newMatch, tbody.nextSibling);
			});

			/* TOURNAMENTS HISTORY */ 
			tbody = document.querySelector(".table.tournaments_history");
			this.tournaments_history.forEach(async tournament => {
				let tr = document.createElement('tr');
				let date = document.createElement('td');
				let name = document.createElement('td');
				let players = document.createElement('td');
				let link = document.createElement('td');
				
				date.innerHTML = this.formatDate(tournament.created_at);
				name.innerHTML = `${tournament.name}`;
				players.innerHTML = '['
				let i = 0 
				tournament.unique_aliases.forEach(async alias => {
					players.innerHTML +=  `${alias}`;
					players.innerHTML += (i != 3) ? '/' : ''
					i++
				});
				players.innerHTML += ']'

                let link_bt = document.createElement('button')
                link_bt.classList.add("btn", "btn-secondary")
				link_bt.setAttribute('type', 'button');
                link_bt.innerText = "see"
                link_bt.addEventListener('click',  async e => {
                    e.preventDefault();
                    this.user.router.navigateTo(`/tournament/${tournament["tournament_id"]}`, this.user)
                })
				link.appendChild(link_bt)

				tr.appendChild(date)
				tr.appendChild(name)
				tr.appendChild(players)
				tr.appendChild(link)
				if (tbody)
					tbody.appendChild(tr)
			});
		}catch (e){
			//console.log('fetch error')
		}
	}

	async fillStats()
	{
		try{
		let stats = this.matches_stat;
		let nbMatchs = document.querySelector(".nb-matchs");
		let wonMatch = document.querySelector(".won-match");
		let lostMatch = document.querySelector(".lost-match");
		nbMatchs.innerHTML = stats.total;
		wonMatch.innerHTML = stats.win;
		lostMatch.innerHTML = stats.lost;
		}catch(e){
			//console.log('fetch error', e)
		}
	}

	async fillProfile()
	{
		try{
		if(!this.UserDatas)
			return;
		var profile_thumb = await friends_utils.create_thumbnail(this.user.DOMProfileCard, this.user, null,  this.UserDatas.id)
		document.querySelector("#app .profile_thumbnail").innerHTML = ""
		document.querySelector("#app .profile_thumbnail").appendChild(profile_thumb)
		if (this.is_user_page())
		{
			profile_thumb.querySelector('.dropdown').innerHTML = '<div class="mt-2 image-upload"><input type="file" id="fileInput"  accept="image/*"  class=""><i class="fa fa-fw fa-camera"></i></div><p id="status"></p>';
			document.getElementById("fileInput").addEventListener('change', async () =>  {
				document.getElementById("fileInput")
				document.querySelector("#status").innerText = "reading URL";
				this.readURL(document.getElementById("fileInput"));
			});
		}
		document.querySelector(".tab-pane.profile #username").value = this.UserDatas.username;
		document.querySelector(".tab-pane.profile #first_name").value = this.UserDatas.first_name;
		document.querySelector(".tab-pane.profile #last_name").value = this.UserDatas.last_name;
		document.querySelector(".tab-pane.profile #email").value = this.UserDatas.email;
		document.querySelector(".tab-pane.profile #biography").value = this.UserDatas.biography;
		return 1;
	}catch(e){
		//console.log('fetch error', e)
	}
	}


	async addEvents () {

		// TABS
		if (this.params.tab)
		{
			document.querySelectorAll('.nav.nav-tabs li a').forEach(element => {
				element.classList.remove('active');
			});
			document.querySelectorAll('.tab-content .tab-pane').forEach(element => {
				element.classList.remove('active');
			});
			document.querySelector('.nav.nav-tabs li[data-target="' + this.params.tab + '"] a').classList.add('active')
			document.querySelector('.tab-content .tab-pane.' + this.params.tab).classList.add('active')
		}
		document.querySelectorAll('.nav.nav-tabs li').forEach(element => {
			element.addEventListener("click", e => {
				e.preventDefault();
				let link = element.getAttribute('data-target');
				document.querySelectorAll('.nav.nav-tabs li a').forEach(element => {
					element.classList.remove('active');
				});
				document.querySelector('.nav.nav-tabs li[data-target="' + link + '"] a').classList.add('active')

				document.querySelectorAll('.tab-content .tab-pane').forEach(element => {
					element.classList.remove('active');
				});
				document.querySelector('.tab-content .tab-pane.' + link).classList.add('active')
			});
		});



		// USER PROFILE FORM
		if (this.is_user_page())
		{

			document.querySelectorAll('.tab-pane.profile form input[type="text"]').forEach(input => {
				input.addEventListener("focusout", form.checkBlankField);
			});
			document.querySelector('.tab-pane.profile form #email').addEventListener("focusout", form.checkEmail);

			document.getElementById("submit_form").addEventListener('click', async (event) =>  {
				event.preventDefault();
				
				if (!this.checkAllFields())
					return false;
				let avatar_src = document.querySelector("#app .profile_thumbnail .profile_card .avatar").getAttribute('img-src');
				//console.log("avatar_src sended ",avatar_src )
				let RQ_Body = {
					avatar: avatar_src,
					username: document.querySelector("#username").value,
					first_name: document.querySelector("#first_name").value,
					last_name: document.querySelector("#last_name").value,
					email: document.querySelector("#email").value,
					biography: document.querySelector("#biography").value
				}
				this.user.request.put('/api/users/profile/'+this.user.datas.id+'/', RQ_Body)
				.then((response) =>
				{
					if (response.ok || response.status === 400)
                    	return Promise.all([response.json(), response.ok, response.status]);
                	else
                    	throw new Error('Network response was not ok.');
				})
				.then(async ([jsonData, ok, status]) => {
					if (!ok)
					{
						for (const key in jsonData) {
							if (Object.hasOwnProperty.call(jsonData, key))
							{
								if (document.querySelector(`.tab-pane.profile #${key}`))
								{
									document.querySelector(`.tab-pane.profile #${key}`).classList.add(`is-invalid`)
									document.querySelector(`.tab-pane.profile #${key}Feedback`).innerHTML = jsonData[key]
								}
							}
						}
						let errDiv = document.querySelector("#ProfileForm #errorFeedback");
						errDiv.classList.remove("d-none", "alert-success")
						errDiv.classList.add("alert-danger")
						errDiv.innerHTML = "An error occured ! Please check fields below ...";
					}
					else
					{
						document.querySelectorAll('.tab-pane.profile form input[type="text"]').forEach(input => {
							input.classList.remove(`is-invalid`)
							input.classList.remove(`is-valid`)
						});
						this.user.setLocalDatas(jsonData)
						let errDiv = document.querySelector("#ProfileForm #errorFeedback");
						errDiv.classList.remove("d-none", "alert-danger")
						errDiv.classList.add("alert-success")
						errDiv.innerHTML = "Well done ! ...";
					}
				})
				.catch((error) => {
					// Gérer les erreurs de requête ou de conversion JSON
					//console.log('There was a problem with the fetch operation:', error);
				});
			})
		}

	}

    checkAllFields = () =>
    {
        // Récupérer tous les champs du formulaire
        let fields = document.querySelectorAll(".tab-pane.profile form input[type='text']");

        // Vérifier chaque champ * de type text / ne dois pas etre vide.
        let isValid = true;
        fields.forEach(field => {
            if (!form.checkBlankField({ target: field })) {
                isValid = false;
            }
        });

        let check_email = form.checkEmail({ target: document.querySelector('.tab-pane.profile form input#email') });
       
        if (isValid  && check_email)
            return true;
        return false
    }


	// File Upload
	async readURL(input) {
		if (input.files && input.files[0]) {
			let reader = new FileReader();
			reader.onload = async function (e) {
				const file = input.files[0];
				const formData = new FormData();
				formData.append('avatar', file);
				fetch('/upload', {
					method: 'POST',
					enctype: 'multipart/form-data',
					body: formData
				})
			    .then(response => {
					return response.json()
				})
				.then(async (response) => {
					if (response.ok) {
						let src_img_url = response.message
						response = await fetch(`/avatars/${src_img_url}`);
						if (response.ok) {
							const blob = await response.blob();
							const objectURL = URL.createObjectURL(blob);
							document.querySelector("#app .profile_thumbnail .profile_card .avatar").setAttribute('img-src',`/avatars/${src_img_url}` );
							document.querySelector("#app .profile_thumbnail .profile_card .avatar").src = objectURL;
						}
						document.getElementById('status').innerText = 'Image uploadée avec succès !';
					} else {
						document.getElementById('status').innerText = 'Erreur lors de l\'upload de l\'image.';
					}
				})
				.catch(error => {
					//console.log('Erreur lors de l\'upload de l\'image :', error);
				});
			}
			reader.readAsDataURL(input.files[0]);
		}
	}
	
}
