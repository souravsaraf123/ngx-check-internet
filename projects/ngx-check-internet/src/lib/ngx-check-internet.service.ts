import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import axios, { CancelTokenSource } from 'axios';

@Injectable({
	providedIn: 'root'
})
export class NgxCheckInternetService
{
	URL: string[];
	INTERVAL: number;

	private getOnlineStatus: BehaviorSubject<boolean>;

	private isStarted: boolean;
	private intervalId: number;
	private lastOnlineStatus: boolean;

	private REQUEST_TIMEOUT = 1000;
	private MAX_NUMBER_OF_URLS = 5000;
	private MAX_REQUEST_INDEX = 24 * 60 * 60 * 1000; // 24 hours in millis
	private numberOfRequests = 0;
	private axiosSource: CancelTokenSource;

	constructor()
	{
		// URLs of Github assets of this library itself
		this.URL = [
			'https://raw.githubusercontent.com/souravs-2pirad/ngx-check-internet/master/projects/ngx-check-internet/assets/0.txt',
			'https://raw.githubusercontent.com/souravs-2pirad/ngx-check-internet/master/projects/ngx-check-internet/assets/1.txt',
			'https://raw.githubusercontent.com/souravs-2pirad/ngx-check-internet/master/projects/ngx-check-internet/assets/2.txt',
			'https://raw.githubusercontent.com/souravs-2pirad/ngx-check-internet/master/projects/ngx-check-internet/assets/3.txt',
			'https://raw.githubusercontent.com/souravs-2pirad/ngx-check-internet/master/projects/ngx-check-internet/assets/4.txt',
		];

		// When server response takes time , the timeout or cancel mechanism can interrupt and abort the http request
		// this.URL = ['https://reqres.in/api/users?delay=5'];
		this.INTERVAL = 1 * 60 * 1000; // 1 minute

		this.initialize();
	}

	private initialize()
	{
		this.getOnlineStatus = new BehaviorSubject<boolean>(null);

		this.isStarted = false;
		this.intervalId = null;
		this.lastOnlineStatus = null;
		this.numberOfRequests = 0;

		this.axiosSource = axios.CancelToken.source();
	}

	public setConfig(configuration: { urls?: string[], interval?: number, timeout?: number })
	{
		if (this.isStarted)
		{
			console.debug('Cannot change NgxCheckInternetService Configuration while started. Please stop() and then change config');
		}
		else
		{
			if (configuration.urls && Array.isArray(configuration.urls) && configuration.urls.length > 0)
			{
				this.URL = configuration.urls.slice(0, this.MAX_NUMBER_OF_URLS);
			}

			this.INTERVAL = configuration.interval ?? this.INTERVAL;
			this.REQUEST_TIMEOUT = configuration.timeout ?? this.REQUEST_TIMEOUT;
		}
	}

	public start(): BehaviorSubject<boolean>
	{
		if (!this.isStarted)
		{
			this.isStarted = true;
			if (this.getOnlineStatus.closed)
			{
				this.getOnlineStatus = new BehaviorSubject<boolean>(null);
			}

			window.addEventListener('offline', this.navigatorOfflineListener);
			window.addEventListener('online', this.navigatorOnlineListener);

			// If user is online
			if (navigator.onLine)
			{
				this.checkStatusAndEmit();
				this.startNgxInterval();
			}
			// If user is offline , then emit false
			else
			{
				this.lastOnlineStatus = false;
				this.getOnlineStatus.next(this.lastOnlineStatus);
			}
		}

		return this.getOnlineStatus;
	}

	private navigatorOfflineListener = (e: Event) =>
	{
		if (this.isStarted)
		{
			this.clearNgxInterval();

			// Emit false
			if (this.lastOnlineStatus == null || this.lastOnlineStatus == true)
			{
				this.lastOnlineStatus = false;
				this.getOnlineStatus.next(this.lastOnlineStatus);
			}
		}
	}

	private navigatorOnlineListener = (e: Event) =>
	{
		if (this.isStarted)
		{
			this.checkStatusAndEmit();
			this.startNgxInterval();
		}
	}

	public getIsStarted()
	{
		return this.isStarted;
	}

	public getLastOnlineStatus()
	{
		return this.lastOnlineStatus;
	}

	public getLiveStatus(): BehaviorSubject<boolean>
	{
		if (this.isStarted)
		{
			return this.getOnlineStatus;
		}
		else
		{
			console.error('You need to start() to get live online status');
			return null;
		}
	}

	public checkIfOnline(): Promise<boolean>
	{
		if (this.numberOfRequests > this.MAX_REQUEST_INDEX)
		{
			this.numberOfRequests = 0;
		}
		this.numberOfRequests++;

		let urlIndex = (this.numberOfRequests % this.URL.length);
		let urlToUse = this.URL[urlIndex];

		let p = new Promise<boolean>(resolve =>
		{
			axios.get(urlToUse,
				{
					timeout: this.REQUEST_TIMEOUT,
					cancelToken: this.axiosSource.token,
					params: {
						cache_bust: Date.now().toString(),
					},
				})
				.then(res =>
				{
					let result = (res.status == 200);
					resolve(result);
				})
				.catch((error) =>
				{
					resolve(false);
				});
		});

		return p;
	}

	private checkStatusAndEmit = () =>
	{
		this.checkIfOnline().then(status =>
		{
			if (this.lastOnlineStatus == null)
			{
				this.lastOnlineStatus = status;
				this.getOnlineStatus.next(this.lastOnlineStatus);
			}
			else
			{
				if (status != this.lastOnlineStatus)
				{
					this.lastOnlineStatus = status;
					this.getOnlineStatus.next(this.lastOnlineStatus);
				}
			}
		});
	}

	private startNgxInterval()
	{
		// Check if really online via http request
		this.intervalId = setInterval(this.checkStatusAndEmit, this.INTERVAL);
	}

	private clearNgxInterval()
	{
		if (this.intervalId != null)
		{
			this.axiosSource.cancel('Operation canceled by the user.');
			this.axiosSource = axios.CancelToken.source();
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	public stop()
	{
		if (this.isStarted)
		{
			this.getOnlineStatus.unsubscribe();

			this.clearNgxInterval();
			this.intervalId = null;
			this.isStarted = false;
			this.lastOnlineStatus = null;
			this.numberOfRequests = 0;

			window.removeEventListener('offline', this.navigatorOfflineListener);
			window.removeEventListener('online', this.navigatorOnlineListener);
		}
	}
}
