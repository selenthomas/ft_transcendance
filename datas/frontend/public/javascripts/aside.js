import * as friends_utils from "./utils_friends.js"
	// Create a new li element

export async function print(user)
{
	let routes = null;
	if (!user.isConnected)
	{
		document.querySelector('aside').classList.add('d-none')
		return;
	}
	else
		document.querySelector('aside').classList.remove('d-none')


		let nodeCopy;
		let response;
		let test
		let friends

		response = await user.request.get('/api/users/list/followed/')
		try {
			if (response.status == 200)
			{
				friends = await response.json();
				friends.forEach(async friend => {
					if (friend.username === "root" || friend.username === user.datas.username)
						return;
					let followed_div_all = document.querySelectorAll(`aside .followed ul.userList`);
					followed_div_all.forEach( async detination_followed => {
						test = detination_followed.querySelector(`.profile_card[data-friend-id="${friend.id}"]`);
						if (test)
							return;
						nodeCopy = await friends_utils.create_thumbnail(user.DOMProfileCard, user, friend, friend.id)
						detination_followed.append(nodeCopy);
					});
				})
			}
        } catch (e) {
            //console.log("Failed to parse JSON:", e); // Log any JSON parsing errors
        }


		try {
			let detination_online = document.querySelector('aside .online ul.userList')
			if (!detination_online.hasChildNodes())
			{
				response = await user.request.get('/api/users/list/online/')
				if (response && response.status == 200)
				{
					const friends = await response.json();
					friends.forEach(async friend => {
						if (friend.username === "root" || friend.username === user.datas.username)
							return;
						test = detination_online.querySelector(`.profile_card[data-friend-id="${friend.id}"]`);
						if (test)
							return;
						nodeCopy = await friends_utils.create_thumbnail(user.DOMProfileCard, user, friend, friend.id)
						detination_online.append(nodeCopy);
					})
				}
			}
		} catch (e) {
			//console.log("Failed to parse JSON:", e); // Log any JSON parsing errors
			throw e; // Re-throw the error after logging it
		}
		/*
		let detination_all = document.querySelector('aside .all ul.userList')
		if (!detination_all.hasChildNodes())
		{
			response = await user.request.get('/api/users/list/all/')
			if (response.status == 200)
			{
				const friends = await response.json();
				friends.forEach(async friend => {
					if (friend.username === "root" || friend.username === user.datas.username)
						return;
					test = detination_all.querySelector(`.profile_card[data-friend-id="${friend.id}"]`);
					if (test)
						return;
					nodeCopy = await friends_utils.create_thumbnail(user.DOMProfileCard, user, friend, friend.id)
					detination_all.append(nodeCopy);
				})
			}
		}
		*/
}