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
				action: 'Add a Comment to an Approval',
				description: 'Add a comment to an approval request',
				routing: {
					request: {
						method: 'POST',
						url: '=/api/v1/approvals/{{$parameter.approvalId}}/comments',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'List Comments from an Approval',
				description: 'List many comments on an approval request',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/v1/approvals/{{$parameter.approvalId}}/comments',
					},
					output: {
						postReceive: [
							{
								type: 'rootProperty',
								properties: {
									property: 'data',
								},
							},
						],
					},
				},
			},
		],
		default: 'create',
	},
	{
		displayName: 'Approval ID',
		name: 'approvalId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showOnlyForComment,
		},
		description: 'The ID of the approval request',
	},
	...commentCreateDescription,
	...commentGetAllDescription,
];
