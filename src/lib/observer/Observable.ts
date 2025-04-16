export class Observable<E> {
	#subscriptions: { id: string; func: (...args: any) => any }[] = [];
	#last: E | null = null;

	public next(data: E) {
		this.#last = data;
		for (const subscription of this.#subscriptions) {
			subscription.func(data);
		}
	}

	public subscribe(func: (...args: any) => any) {
		const subscription = { id: '', func };
		this.#subscriptions.push(subscription);
		subscription.func(this.#last);
		return subscription;
	}
}
