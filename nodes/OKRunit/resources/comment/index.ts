import type { INodeProperties } from 'n8n-workflow';
import { commentCreateDescription } from './create';
import { commentGetAllDescription } from './getAll';

const showOnlyForComment = {
	resource: ['comment'],
};

export const commentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForComment,
		},
		options: [
			{
				name: 'Add a Comment to an Approval',
				value: 'create',
				action: 'Add a comment to an approval',
				description: 'Add a comment to an approval request',
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'List comments from an approval',
				description: 'List many comments on an approval request',
			},
		],
		default: 'create',
	},
	{
		displayName: 'Request ID',
		name: 'approvalId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showOnlyForComment,
		},
		description: 'The ID of the approval request (use {{ $json.request_id }} from the trigger)',
	},
	...commentCreateDescription,
	...commentGetAllDescription,
];
