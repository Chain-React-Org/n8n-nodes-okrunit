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
];
