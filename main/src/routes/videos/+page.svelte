<script lang="ts">
	import Slider from '@bulatdashiev/svelte-slider';
	import MultiSelect from 'svelte-multiselect';

	import axios from 'axios';
	import { socket } from '../../background.js';

	let videos: any[] = [];
	let watch_time_options = ['search', 'direct', 'subscribers', 'suggestions'];

	$: publishVideos(videos);
	let justChanged = Date.now();

	axios
		.get('/api/videos')
		.then((data) => {
			justChanged = Date.now();
			videos = data.data;
		})
		.catch(() => {});

	function publishVideos(newVideos: any[]) {
		if (justChanged + 100 < Date.now()) socket.emit('videos', newVideos);
	}

	socket.on('videosChanged', (newVideos) => {
		justChanged = Date.now();
		videos = newVideos;
	});

	function getVideoInfo(id: string) {
		return new Promise((resolve, reject) => {
			axios
				.get(`/api/video_info?id=${encodeURIComponent(id)}`)
				.then((data) => resolve(data.data))
				.catch(reject);
		});
	}

	function changeVideoKeywords(video: any, newKeywords: string, element: any) {
		video.keywords = newKeywords.trim().split('\n');
		videos = videos;
	}

	function generateUploadDate(video: any) {
		if (!videoInfo[video.id]) return ['any'];

		let result_arr = ['any'];
		let difference =
			(new Date().getTime() - new Date(videoInfo[video.id].uploadDate).getTime()) / 86400000;
		if (difference < 7) result_arr.unshift('this week');
		if (difference < 30) result_arr.unshift('this month');
		if (difference < 365) result_arr.unshift('this year');

		return result_arr;
	}

	let availableSortBy = ['relevance', 'upload date', 'view count', 'rating'];

	function generateDuration(video: any) {
		if (!videoInfo[video.id]) return ['any'];
		if (videoInfo[video.id].videoType == 'livestream') return ['any'];

		let duration = videoInfo[video.id].duration;
		if (duration < 240) return ['under 4 minutes', 'any'];
		if (duration > 1200) return ['over 20 minutes', 'any'];
		return ['4-20 minutes', 'any'];
	}

	function generateFeatures(video: any) {
		if (!videoInfo[video.id]) return [];
		let result_arr = [];

		if (videoInfo[video.id].videoType == 'livestream') result_arr.unshift('live');

		if (videoInfo[video.id].validFilters.is4K) result_arr.unshift('4k');
		if (videoInfo[video.id].validFilters.isHD) result_arr.unshift('hd');
		if (videoInfo[video.id].validFilters.is3D) result_arr.unshift('3d');
		if (videoInfo[video.id].validFilters.isHDR) result_arr.unshift('hdr');

		return result_arr;
	}

	let videoInfo: any = {};

	let badIds: string[] = [];
	let cachedResults: string[] = [];

	$: for (let video of videos) {
		if (!badIds.includes(video.id) && !cachedResults.includes(video.id)) {
			cachedResults.push(video.id);

			getVideoInfo(video.id)
				.then((result) => {
					videoInfo[video.id] = result;
				})
				.catch((err) => {
					badIds.push(video.id);
				});
		}
	}
</script>

<div id="form_container">
	<button
		class="new_button"
		on:click={() => {
			videos.unshift({
				id: ``,
				watch_time: [25, 75],
				livestream_watchtime: 300,
				watch_entire_livestream: true,
				guest_views: 10,
				available_watch_types: ['search', 'direct'],
				keywords: [],
				filters: {
					upload_date: 'any',
					duration: 'any',
					sort_by: 'relevance',
					features: []
				},

				accounts: [],
				comments: [],

				likePercent: 50,
				dislikePercent: 100,
				likeAt: [25, 75],
				dislikeAt: [25, 75],
				commentAt: [25, 75]
			});

			videos = videos;
		}}>Add Video</button
	>

	<div class="videos_parent">
		<div class="videos_container">
			{#each videos as video, index}
				<div class="video_container settings_container container_gray">
					<button
						class="video_id"
						on:click={() => {
							videos.splice(index, 1);
							videos = videos;
						}}>#{index + 1}</button
					>
					{#if index == 0}
						<p class="setting_info" style="margin-left: 1.5%; font-weight: bold;">
							Press the red button to delete the video
						</p>
					{/if}

					{#if videoInfo[video.id]}
						<div class="video_container container_gray">
							<img
								alt="video_thumbnail"
								class="video_thumbnail"
								src={videoInfo[video.id].thumbnail}
							/>

							<p class="video_title">{videoInfo[video.id].title}</p>
							<p class="video_type">video type: {videoInfo[video.id].videoType}</p>
						</div>
					{/if}

					<div class="setting_div">
						<div class="same_line">
							<h2 class="setting_name">Video ID/URL:</h2>

							<input
								class="setting_text"
								placeholder="video id"
								type="text"
								bind:value={video.id}
							/>
						</div>

						{#if index == 0}
							<p class="setting_info">The ID/URL of the video to bot</p>
						{/if}
					</div>

					{#if videoInfo[video.id]}
						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">Guest views:</h2>

								<input class="setting_text" type="number" bind:value={video.guest_views} />
							</div>

							{#if index == 0}
								<p class="setting_info">
									How many views to generate without using a google account?
								</p>
								<p class="setting_info">
									NOTE: If the video is a livestream it should be smaller or equal to the
									concurrency setting.
								</p>
							{/if}
						</div>

						{#if videoInfo[video.id].videoType == 'livestream'}
							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Watch entire livestream:</h2>

									<input
										class="setting_button setting_checkbox"
										type="checkbox"
										bind:checked={video.watch_entire_livestream}
									/>
								</div>

								{#if index == 0}
									<p class="setting_info">Should the bot watch the entire livestream?</p>
								{/if}
							</div>

							{#if !video.watch_entire_livestream}
								<div class="setting_div">
									<div class="same_line">
										<h2 class="setting_name">Watch time:</h2>

										<input
											class="setting_text"
											type="number"
											bind:value={video.livestream_watchtime}
										/>
									</div>

									{#if index == 0}
										<p class="setting_info">How much to watch the livestream (in seconds)</p>
									{/if}
								</div>
							{/if}
						{:else}
							<p class="watchtime_line">
								{video.watch_time[0]}% - {video.watch_time[1]}% watchtime
							</p>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Watch time:</h2>

									<Slider max="100" bind:value={video.watch_time} range order />
								</div>

								{#if index == 0}
									<p class="setting_info">How much watch time should be generated?</p>
								{/if}
							</div>
						{/if}

						<div class="setting_div">
							<div class="same_line">
								<h2 class="setting_name">Watch type:</h2>

								<MultiSelect
									bind:selected={video.available_watch_types}
									options={watch_time_options}
								/>
							</div>

							{#if index == 0}
								<p class="setting_info">In what ways could the bot find the video?</p>
							{/if}
						</div>

						{#if video.available_watch_types.includes('search')}
							<div class="setting_div">
								<div class="different_line">
									<h2 class="setting_name" style="text-align: center;">Search titles (Optional)</h2>

									<textarea
										class="setting_stringarea"
										placeholder="cool title"
										value={video.keywords.join('\n').trim()}
										on:input={(event) =>
											changeVideoKeywords(video, event.target?.value, event.target)}
									/>
								</div>

								{#if index == 0}
									<p class="setting_info">
										What titles should it use when using the search function?
									</p>
									<p class="setting_info">
										Using improper titles may damage your video in the algorithm.
									</p>
									<p class="setting_info">Make sure each title is separated by a new line.</p>
								{/if}
							</div>

							<h1 class="setting_discloser">Search filters (Optional)</h1>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Upload date:</h2>

									<select class="setting_text" bind:value={video.filters.upload_date}>
										{#each generateUploadDate(video) as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Sort by:</h2>

									<select class="setting_text" bind:value={video.filters.sort_by}>
										{#each availableSortBy as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Duration:</h2>

									<select class="setting_text" bind:value={video.filters.duration}>
										{#each generateDuration(video) as option}
											<option value={option}>{option}</option>
										{/each}
									</select>
								</div>
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Features:</h2>

									<MultiSelect bind:selected={video.features} options={generateFeatures(video)} />
								</div>
							</div>
						{/if}

						<h1 class="setting_discloser">Account list</h1>

						<div class="import_line">
							<button
								class="new_button_account"
								on:click={() => {
									video.accounts.unshift({
										email: '',
										password: '',
										cookies: ''
									});

									video = video;
								}}>Add account</button
							>

							<input
								id="hidden_account_input-{index}"
								type="file"
								accept=".txt,.xlsx,.csv"
								on:change={(e) => {
									let file = e.target.files[0];
									let reader = new FileReader();
									reader.onload = function (e) {
										let data = e.target.result;

										socket.emit('accounts_import', {
											data: data,
											fileType: file.type,
											video: video
										});
										setTimeout(() => {
											document.location.reload();
										}, 250);
									};

									reader.readAsArrayBuffer(file);
								}}
								hidden
							/>

							<button
								class="new_button_account"
								on:click={() => {
									let hidden_input = document.querySelector(`#hidden_account_input-${index}`);
									hidden_input?.click();
								}}>Import accounts</button
							>

							<button
								class="new_button_account"
								on:click={() => {
									const a = document.createElement('a');
									const url = `/api/video_details?type=accounts&video=${video.id}`;
									a.href = url;
									document.body.appendChild(a);
									a.click();
									document.body.removeChild(a);
								}}>Extract accounts</button
							>
						</div>

						<div class="accounts_container">
							{#each video.accounts as account, acc_index}
								<div class="account_container container_gray">
									<button
										class="video_id"
										on:click={() => {
											video.accounts.splice(acc_index, 1);
											video.accounts = video.accounts;
										}}>#{acc_index + 1}</button
									>
									{#if acc_index == 0}
										<p class="setting_info" style="margin-left: 1.5%; font-weight: bold;">
											Press the red button to delete the account
										</p>
									{/if}

									<div class="setting_div">
										<div class="same_line">
											<h2 class="setting_name">Email (Optional):</h2>

											<input
												class="setting_text"
												placeholder="Email"
												type="text"
												bind:value={account.email}
											/>
										</div>

										{#if acc_index == 0}
											<p class="setting_info">
												What email should the bot use? (Email, Password / Cookies / both)
											</p>
										{/if}
									</div>

									<div class="setting_div">
										<div class="same_line">
											<h2 class="setting_name">Password (Optional):</h2>

											<input
												class="setting_text"
												placeholder="Password"
												type="text"
												bind:value={account.password}
											/>
										</div>

										{#if acc_index == 0}
											<p class="setting_info">What password should the bot use?</p>
										{/if}
									</div>

									<div class="setting_div">
										<div class="same_line">
											<h2 class="setting_name">Cookies (Optional):</h2>

											<input
												class="setting_text"
												placeholder="Cookies"
												type="text"
												bind:value={account.cookies}
											/>
										</div>

										{#if acc_index == 0}
											<p class="setting_info">
												What cookies should the bot use? (Email, Password / Cookies / both)
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						{#if video.accounts.length > 0}
							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Like at:</h2>

									<Slider max="100" bind:value={video.likeAt} range order />
								</div>

								{#if index == 0}
									<p class="setting_info">When should each account like?</p>
								{/if}
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Dislike at:</h2>

									<Slider max="100" bind:value={video.dislikeAt} range order />
								</div>

								{#if index == 0}
									<p class="setting_info">When should each account dislike?</p>
								{/if}
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Comment at:</h2>

									<Slider max="100" bind:value={video.commentAt} range order />
								</div>

								{#if index == 0}
									<p class="setting_info">When should each account comment?</p>
								{/if}
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Like percent:</h2>

									<input
										class="setting_text"
										type="number"
										min="0"
										max="100"
										bind:value={video.likePercent}
									/>
								</div>

								{#if index == 0}
									<p class="setting_info">What is the chance of the bot liking the video?</p>
								{/if}
							</div>

							<div class="setting_div">
								<div class="same_line">
									<h2 class="setting_name">Dislike percent:</h2>
									<input
										class="setting_text"
										type="number"
										min="0"
										max="100"
										bind:value={video.dislikePercent}
									/>
								</div>

								{#if index == 0}
									<p class="setting_info">What is the chance of the bot disliking the video?</p>
								{/if}
							</div>

							<h1 class="setting_discloser">Comment list</h1>

							<div class="import_line">
								<button
									class="new_button_account"
									on:click={() => {
										video.comments.unshift('Hello world');

										video = video;
									}}>Add comment</button
								>

								<input
									id="hidden_comment_input-{index}"
									type="file"
									accept=".json"
									on:change={(e) => {
										let file = e.target.files[0];
										let reader = new FileReader();
										reader.onload = function (e) {
											let data = e.target.result;

											socket.emit('comments_import', {
												data: data,
												video: video
											});

											setTimeout(() => {
												document.location.reload();
											}, 250);
										};

										reader.readAsArrayBuffer(file);
									}}
									hidden
								/>

								<button
									class="new_button_account"
									on:click={() => {
										let hidden_input = document.querySelector(`#hidden_comment_input-${index}`);
										hidden_input?.click();
									}}>Import comments</button
								>

								<button
									class="new_button_account"
									on:click={() => {
										const a = document.createElement('a');
										const url = `/api/video_details?type=comments&video=${video.id}`;
										a.href = url;
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
									}}>Extract comments</button
								>

								<div class="accounts_container">
									{#each video.comments as comment, comment_index}
										<div class="account_container container_gray">
											<button
												class="video_id"
												on:click={() => {
													video.comments.splice(comment_index, 1);
													video.comment = video.comments;
												}}>#{comment_index + 1}</button
											>

											<textarea
												class="setting_text comment_text"
												cols="50"
												bind:value={comment}
											/>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.comment_text {
		height: 25vh;
		width: 95%;
		margin-top: 5%;

	}

	.accounts_container {
		display: flex;
		overflow-x: scroll;

		gap: 4%;
		margin-left: 3%;
	}

	.import_line {
		display: flex;
		gap: 5%;

		flex-wrap: wrap;
		justify-content: center;
		margin-top: 2.5%;
	}

	.video_type {
		text-align: center;
		font-size: 1.5em;
		color: rgb(236, 236, 236);
	}
	.video_title {
		text-align: center;
		font-size: 2em;
		color: bisque;
		margin-bottom: 8%;
	}
	.videos_parent {
		display: flex;
		align-items: center;
		justify-content: center;
		max-width: 100%;
		min-width: 100%;
	}

	.videos_container {
		min-width: 100%;
		margin-left: 5%;
	}

	.video_thumbnail {
		width: 100%;
		height: auto;
	}

	.video_container {
		max-width: 95%;
		min-width: 95%;

		padding-top: 3%;
		padding-right: 5%;
		padding-left: 5%;

		margin-top: 4%;
		margin-bottom: 6%;
	}

	@media only screen and (orientation: portrait) {
		.video_container {
			max-width: 97%;
			min-width: 97%;

			margin-left: 1.5%;
		}

		.videos_container {
			margin-left: 0;
		}
	}

	.account_container {
		margin-left: 1%;
		margin-bottom: 2%;
		margin-top: 3%;

		min-width: 50%;
	}

	.watchtime_line {
		color: beige;
		font-size: 1em;
		text-align: center;
	}

	.video_id {
		margin-top: 2%;
		background-color: red;
		color: beige;
		margin-left: 2%;
		border: 0px;

		padding: 0.25%;
		padding-left: 0.5%;
		padding-right: 0.5%;

		font-size: 1.25em;
		font-weight: bold;
	}

	.new_button {
		max-width: 70%;
		min-width: 70%;

		margin-top: 0;
		padding: 0;
		margin-bottom: 2%;

		margin-left: 15%;

		background-color: rgb(0, 128, 0);
		color: beige;
		font-size: 3em;
	}

	.new_button_account {
		padding-left: 1vw;
		padding-right: 1vw;

		background-color: rgb(0, 128, 0);
		color: beige;
		font-size: 2em;
	}

	.container_gray {
		box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.952);
	}

	.same_line {
		display: flex;
		justify-items: center;
		margin-top: 2%;
		height: 100%;
	}

	.setting_text {
		margin-left: 3%;
		background-color: rgb(199, 203, 207);
	}

	.setting_text::placeholder {
		color: rgb(65, 58, 58);
	}

	.setting_stringarea {
		margin-top: 4%;
		margin-bottom: 4%;
		margin-left: 10%;

		max-width: 80%;
		min-width: 80%;

		min-height: 25vh;
		max-height: 25vh;
	}

	.setting_stringarea::placeholder {
		color: rgb(65, 58, 58);
	}

	.setting_checkbox {
		accent-color: #267ec5;
		margin-left: 5%;
	}

	.setting_name {
		color: rgb(221, 216, 211);
		font-size: 0.9em;
	}
	.setting_div {
		margin: 3%;
		box-shadow: 0 0 2px 3px rgb(54, 54, 53);
	}

	.setting_discloser {
		text-align: center;
		color: rgb(238, 233, 229);
		font-size: 2em;
	}

	.settings_container {
		background-color: #272c30;
		padding-bottom: 2%;
		margin-bottom: 5%;
	}

	#form_container {
		padding-left: 3%;
		padding-top: 3%;
		max-width: 97%;
	}
</style>
