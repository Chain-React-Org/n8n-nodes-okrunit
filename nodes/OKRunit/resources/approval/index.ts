import type { INodeProperties } from 'n8n-workflow';
import { approvalCreateDescription } from './create';
import { approvalCreateLogDescription } from './createLog';
import { approvalGetDescription } from './get';
import { approvalGetAllDescription } from './getAll';

const showOnlyForApproval = {
	resource: ['approval'],
};

export const approvalDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: showOnlyForApproval,
		},
		options: [
			{
				name: 'Create an Approval Request',
				value: 'create',
				action: 'Create an approval request',
				description: 'Create a new approval request for human review',
				routing: {
					request: {
						method: 'POST',
						url: '/api/v1/approvals',
					},
				},
			},
			{
				name: 'Create an Activity Log',
				value: 'createLog',
				action: 'Create an activity log',
				description: 'Log an activity for audit/tracking. Does not create an approval — the workflow continues immediately.',
				routing: {
					request: {
						method: 'POST',
						url: '/api/v1/approvals',
					},
				},
			},
			{
				name: 'Find an Approval Request',
				value: 'get',
				action: 'Find an approval request',
				description: 'Find a single approval request by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/api/v1/approvals/{{$parameter.approvalId}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'List approval requests',
				description: 'List approval requests with filters',
				routing: {
					request: {
						method: 'GET',
						url: '/api/v1/approvals',
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
	...approvalCreateDescription,
	...approvalCreateLogDescription,
	...approvalGetDescription,
	...approvalGetAllDescription,
];
