import type { INodeProperties } from 'n8n-workflow';

const showOnlyForCommentGetAll = {
	operation: ['getAll'],
	resource: ['comment'],
};

export const commentGetAllDescription: INodeProperties[] = [
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForCommentGetAll,
		},
		default: true,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Output Fields',
		name: 'outputFields',
		type: 'notice',
		displayOptions: {
			show: showOnlyForCommentGetAll,
		},
		default: '',
		description:
			'Each comment includes: ID, request_id, body, source (dashboard, n8n, zapier, make, api, etc.), user_id, connection_id, created_at, updated_at',
	},
];
