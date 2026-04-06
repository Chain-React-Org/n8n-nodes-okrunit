import type { INodeProperties } from 'n8n-workflow';

const showOnlyForCommentCreate = {
	operation: ['create'],
	resource: ['comment'],
};

export const commentCreateDescription: INodeProperties[] = [
	{
		displayName: 'Comment Body',
		name: 'body',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		required: true,
		default: '',
		displayOptions: {
			show: showOnlyForCommentCreate,
		},
		description: 'The text content of the comment',
		routing: {
			send: {
				type: 'body',
				property: 'body',
			},
		},
	},
	{
		// Always send source: "n8n" in the body
		displayName: 'Source',
		name: 'source',
		type: 'hidden',
		default: 'n8n',
		displayOptions: {
			show: showOnlyForCommentCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'source',
			},
		},
	},
];
