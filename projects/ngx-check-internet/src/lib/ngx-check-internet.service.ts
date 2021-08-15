import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import axios from 'axios';

@Injectable({
	providedIn: 'root'
})
export class NgxCheckInternetService
{
	URL: string[];
	INTERVAL: number;

	private getOnlineStatus: Subject<boolean>;

	private isStarted: boolean;
	private intervalId: number;
	private lastOnlineStatus: boolean;

	private REQUEST_TIMEOUT = 1000;
	private MAX_NUMBER_OF_URLS = 5000;
	private MAX_REQUEST_INDEX = 24 * 60 * 60 * 1000; // 24 hours in millis
	private numberOfRequests = 0;

	constructor()
	{
		this.URL = ['https://raw.githubusercontent.com/microsoft/vscode/main/package.json']; // A website which has good uptime
		this.INTERVAL = 1 * 60 * 1000; // 1 minute

		this.initialize();
	}

	private initialize()
	{
		this.getOnlineStatus = new Subject<boolean>();

		this.isStarted = false;
		this.intervalId = null;
		this.lastOnlineStatus = null;
		this.numberOfRequests = 0;
	}

	public setConfig(configuration: { urls?: string[], interval?: number })
	{
		if (this.isStarted)
		{
			console.debug('Cannot change NgxCheckInternetService Configuration while started. Please stop() and then change config');
		}
		else
		{
			this.URL = configuration.urls?.slice(0, this.MAX_NUMBER_OF_URLS) ?? this.URL;
			this.INTERVAL = configuration.interval ?? this.INTERVAL;
		}
	}

	public start(): Subject<boolean>
	{
		if (!this.isStarted)
		{
			this.isStarted = true;
			if (this.getOnlineStatus.closed)
			{
				this.getOnlineStatus = new Subject<boolean>();
			}

			window.addEventListener('offline', this.navigatorOfflineListener.bind(this));
			window.addEventListener('online', this.navigatorOnlineListener.bind(this));

			// If user is online
			if (navigator.onLine)
			{
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

	private navigatorOfflineListener(e: Event)
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

	private navigatorOnlineListener(e: Event)
	{
		if (this.isStarted)
		{
			this.startNgxInterval();
		}
	}

	public getLastOnlineStatus()
	{
		return this.lastOnlineStatus;
	}

	private startNgxInterval()
	{
		// Check if really online via http request
		this.intervalId = setInterval(() => 
		{
			this.checkIfOnline()
				.then(status =>
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
		}, this.INTERVAL);
	}

	private clearNgxInterval()
	{
		if (this.intervalId != null)
		{
			clearInterval(this.intervalId);
			this.intervalId = null;
		}
	}

	public stop()
	{
		if (this.isStarted)
		{
			this.getOnlineStatus.complete();

			this.clearNgxInterval();
			this.intervalId = null;
			this.isStarted = false;
			this.lastOnlineStatus = null;
			this.numberOfRequests = 0;

			window.removeEventListener('offline', this.navigatorOfflineListener);
			window.removeEventListener('online', this.navigatorOnlineListener);
		}
	}

	// Utility
	public checkIfOnline(): Promise<boolean>
	{

		if (this.numberOfRequests > this.MAX_REQUEST_INDEX)
		{
			this.numberOfRequests = 0;
		}

		this.numberOfRequests++;
		let urlIndex = (this.numberOfRequests % this.URL.length);

		let urlToUse = `${this.URL[urlIndex]}?cache_bust=${Date.now()}`;

		let p = new Promise<boolean>(resolve =>
		{

			axios.get(urlToUse,
				{
					timeout: this.REQUEST_TIMEOUT,
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
}
