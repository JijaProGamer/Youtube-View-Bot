<script lang="ts">
	import axios from 'axios';
	import { Line } from 'svelte-chartjs';
	import 'chart.js/auto';

	import { opts, dataChanged, newData, socket } from '../background.js';
	let data = opts;
	dataChanged((newData: any) => (data = newData));
	$: newData(data);

	let currentWorkers: any[] = [];

	let totalViews = 0;
	let totalWatch_time = 0;
	let totalBandwidth = 0;

	let savedTimes: number[] = [];
	let viewData: number[] = [];
	let watch_time_Data: number[] = [];
	let bandwidthData: number[] = [];
	let timeYAxis: string[] = [];

	for (let i = 0; i < 24; i++) {
		savedTimes[i] = new Date().getDay();
		viewData[i] = 0;
		watch_time_Data[i] = 0;
		bandwidthData[i] = 0;
		timeYAxis[i] = `${i}:00`;
	}

	axios
		.get('/api/view_workers_stats')
		.then((data) => {
			currentWorkers = data.data;
		})
		.catch(() => {});

	axios
		.get('/api/view_stats')
		.then((data) => {
			let currentDay = new Date().getDay();

			for (let view of data.data.views) totalViews += view.value;
			for (let watch_time of data.data.watch_time) totalWatch_time += watch_time.value;
			for (let bandwidth of data.data.bandwidth) totalBandwidth += bandwidth.value;

			let views = data.data.views
				.filter((v: any) => Date.now() - 8.64e7 < v.date)
				.filter((v: any) => currentDay == new Date(v.date).getDay());

			let watch_times = data.data.watch_time
				.filter((v: any) => Date.now() - 8.64e7 < v.date)
				.filter((v: any) => currentDay == new Date(v.date).getDay());

			let bandwiths = data.data.bandwidth
				.filter((v: any) => Date.now() - 8.64e7 < v.date)
				.filter((v: any) => currentDay == new Date(v.date).getDay());

			for (let bandwidth of bandwiths) {
				let viewDate = new Date(bandwidth.date);

				bandwidthData[viewDate.getHours()] = bandwidth.value;
			}

			for (let view of views) {
				let viewDate = new Date(view.date);

				viewData[viewDate.getHours()] = view.value;
			}

			for (let watch_time of watch_times) {
				let viewDate = new Date(watch_time.date);

				watch_time_Data[viewDate.getHours()] = watch_time.value / 60 / 60;
			}

			bandwidthData = bandwidthData
			watch_time_Data = watch_time_Data;
			viewData = viewData;
		})
		.catch((err) => {
			console.log(err);
		});

	socket.on('increase_views_amount', () => {
		let currentDay = new Date().getDay();
		let currentHour = new Date().getHours();

		totalViews += 1;

		if (savedTimes[currentHour] !== currentDay) {
			savedTimes[currentHour] = currentDay;

			viewData[currentHour] = 1;
			watch_time_Data[currentHour] = 0;
		} else {
			viewData[currentHour] += 1;
		}
	});

	let lastReceived = Date.now() - 30000;
	let lastReceived2 = Date.now() - 30000;
	let bandwidth_gathered = 0;
	let watchtime_gathered = 0;

	socket.on('increase_watch_time_amount', (newAmount) => {
		watchtime_gathered += newAmount;
		totalWatch_time += newAmount;

		if (Date.now() - lastReceived > 30000) {
			lastReceived = Date.now();

			let currentDay = new Date().getDay();
			let currentHour = new Date().getHours();

			if (savedTimes[currentHour] !== currentDay) {
				savedTimes[currentHour] = currentDay;

				watch_time_Data[currentHour] = watchtime_gathered / 60 / 60;
			} else {
				watch_time_Data[currentHour] += watchtime_gathered / 60 / 60;
			}

			watchtime_gathered = 0;
		}
	});

	socket.on('increase_bandwidth_amount', (newAmount) => {
		bandwidth_gathered += newAmount;
		totalBandwidth += newAmount;

		if (Date.now() - lastReceived2 > 30000) {
			lastReceived2 = Date.now();

			let currentDay = new Date().getDay();
			let currentHour = new Date().getHours();

			if (savedTimes[currentHour] !== currentDay) {
				savedTimes[currentHour] = currentDay;

				bandwidthData[currentHour] = bandwidth_gathered;
			} else {
				bandwidthData[currentHour] += bandwidth_gathered;
			}

			bandwidth_gathered = 0;
		}
	});

	$: bandwidth_Graph = {
		labels: timeYAxis,
		datasets: [
			{
				label: 'Bandwidth',
				fill: false,
				data: bandwidthData,
				borderColor: `rgb(72, 255, 0)`,
				backgroundColor: `rgb(208, 255, 0)`,
				borderWidth: 2
			}
		]
	};

	$: viewsGraph = {
		labels: timeYAxis,
		datasets: [
			{
				label: 'Views',
				fill: false,
				data: viewData,
				borderColor: `rgb(199, 25, 2)`,
				backgroundColor: `rgb(208, 255, 0)`,
				borderWidth: 2
			}
		]
	};

	$: watch_time_Graph = {
		labels: timeYAxis,
		datasets: [
			{
				label: 'Watch time (Hours)',
				fill: false,
				data: watch_time_Data,
				borderColor: `rgb(26, 22, 222)`,
				backgroundColor: `rgb(208, 255, 0)`,
				borderWidth: 2
			}
		]
	};

	$: defaultOpts = {
		maintainAspectRatio: false,
		animation: {
			duration: 0
		},
		scales: {
			y: {
				beginAtZero: true
			}
		}
	};

	socket.on('update_workers', (newWorkers) => {
		currentWorkers = newWorkers;
	});

	function getVideoInfo(id: string) {
		return new Promise((resolve, reject) => {
			axios
				.get(`/api/video_info?id=${encodeURIComponent(id)}`)
				.then((data) => resolve(data.data))
				.catch(reject);
		});
	}

	let videoInfo: any = {};
	let cachedResults: string[] = [];

	$: for (let worker of currentWorkers) {
		if (!cachedResults.includes(worker.video_info.id)) {
			cachedResults.push(worker.video_info.id);

			getVideoInfo(worker.video_info.url)
				.then((result) => {
					videoInfo[worker.video_info.id] = result;
				})
				.catch(() => {});
		}
	}
</script>

<div id="local_container">
	<div id="form_container">
		<div class="simple_show">
			<div class="show_container show_blue">
				<p class="show_container_title">Total views</p>
				<h2 class="show_container_value">{totalViews}</h2>
			</div>

			<div class="show_container show_green">
				<p class="show_container_title">Total watch time</p>
				<h2 class="show_container_value">{(totalWatch_time / 60 / 60).toFixed(3)}h</h2>
			</div>

			<div class="show_container show_yellow">
				<p class="show_container_title">Total views (24h)</p>
				<h2 class="show_container_value">{viewData.reduce((a, b) => a + b, 0)}</h2>
			</div>

			<div class="show_container show_orange">
				<p class="show_container_title">Total watch time (24h)</p>
				<h2 class="show_container_value">
					{watch_time_Data.reduce((a, b) => a + b, 0).toFixed(2)}h
				</h2>
			</div>
		</div>

		<div class="simple_show">
			<div class="show_container show_red">
				<p class="show_container_title">Total bandwidth</p>
				<h2 class="show_container_value">{(totalBandwidth).toFixed(1)}mb</h2>
			</div>

			<div class="show_container show_db">
				<p class="show_container_title">Total bandwidth (24h)</p>
				<h2 class="show_container_value">
					{bandwidthData.reduce((a, b) => a + b, 0).toFixed(1)}mb
				</h2>
			</div>
		</div>

		<div class="main_graph_container">
			<Line data={viewsGraph} options={defaultOpts} />
		</div>

		<div class="main_graph_container container_mult">
			<Line data={watch_time_Graph} options={defaultOpts} />
		</div>

		<div class="main_graph_container container_mult">
			<Line data={bandwidth_Graph} options={defaultOpts} />
		</div>

		{#if currentWorkers.length > 0}
			<div class="workers_container">
				{#each currentWorkers as worker, index}
					{#if videoInfo[worker.video_info.id]}
						<div class="worker_container container_gray">
							<div class="video_container">
								<img
									alt="video_thumbnail"
									class="video_thumbnail"
									src={videoInfo[worker.video_info.id].thumbnail}
								/>

								<p class="video_title">{videoInfo[worker.video_info.id].title}</p>
							</div>

							<p class="worker_index">#{index + 1}</p>
							<p class="worker_info">Current seconds: {worker.currentTime.toFixed(2)}</p>

							{#if videoInfo[worker.video_info.id].videoType !== 'livestream'}
								<p class="worker_info">
									Watched: {((worker.currentTime / worker.job.video_info.duration) * 100).toFixed(2)}%
								</p>
								<p class="worker_info">Max watchtime: {worker.job.watch_time}%</p>
								<p class="worker_info">
									Max watchtime: {(
										(worker.job.watch_time / 100) *
										worker.video_info.duration
									).toFixed(2)}s
								</p>
							{/if}
							<p class="worker_info">Proxy: {worker.job.proxy}</p>
							<p class="worker_info">Bandwidth: {worker.bandwidth.toFixed(2)}mb</p>
						</div>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.worker_info {
		color: rgb(245, 236, 236);
		margin-left: 10%;
	}

	.worker_index {
		color: rgb(255, 255, 255);
		margin-left: 5%;
	}

	.worker_container {
		max-width: 35%;
		min-width: 35%;
	}

	.video_title {
		text-align: center;
		font-size: 1.5em;
		color: rgb(221, 211, 198);
		margin-bottom: 8%;
	}

	.workers_container {
		margin-top: 3%;
		margin-bottom: 5%;

		display: flex;
		align-items: center;

		gap: 5%;
		padding-top: 3%;
		padding-left: 3%;
		padding-bottom: 3%;

		background-color: rgb(51, 55, 57);

		overflow-y: hidden;
		overflow-x: auto;
	}

	.video_container {
		margin-left: 3%;
		margin-right: 3%;
	}

	.container_gray {
		box-shadow: 0 0 8px 3px rgba(0, 0, 0, 0.952);
	}

	.show_blue {
		background-color: #2187da;
		box-shadow: 0 0 4px 4px rgba(10, 157, 202, 0.815);
	}

	.show_green {
		background-color: #00c421;
		box-shadow: 0 0 4px 4px rgba(79, 248, 0, 0.815);
	}

	.show_yellow {
		background-color: #d6ca18;
		box-shadow: 0 0 4px 4px rgba(255, 238, 0, 0.815);
	}

	.show_orange {
		background-color: #ffae00;
		box-shadow: 0 0 4px 4px rgba(255, 166, 0, 0.815);
	}

	.show_red {
		background-color: #eb0b0b;
		box-shadow: 0 0 4px 4px rgba(219, 10, 10, 0.815);
	}

	.show_db{
		background-color: #002fff;
		box-shadow: 0 0 4px 4px rgba(38, 6, 216, 0.815);
	}

	.show_container {
		padding: 2%;
		margin-bottom: 5%;
		border-radius: 15px;
		padding-right: 5%;

		.show_container_title {
			color: azure;
			font-size: 1em;
		}

		.show_container_value {
			color: azure;
			font-weight: bold;
			font-size: 2em;
			margin-left: 25%;
		}
	}

	@media only screen and (orientation: portrait) {
		.show_container {
			max-width: 98%;
			width: 98%;
			min-width: 98%;
		}
	}

	@media only screen and (orientation: landscape) {
		.simple_show {
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 5%;
		}
	}

	.container_mult {
		margin-top: 3.5%;
	}

	.main_graph_container {
		max-height: 30vh;
		min-height: 30vh;

		background-color: rgb(51, 55, 57);
	}

	#form_container {
		padding-left: 3%;
		padding-top: 3%;
		max-width: 97%;
	}
</style>
