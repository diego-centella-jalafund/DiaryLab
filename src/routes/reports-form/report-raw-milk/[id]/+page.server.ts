import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id, 10);
	if (isNaN(id) || id <= 0) {
		throw error(400, 'Invalid report ID');
	}
	return {
		id: params.id
	};
};