import type { INodeProperties } from 'n8n-workflow';
import { approvalCreateDescription } from './create';
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
				name: 'Create',
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
				name: 'Get',
				value: 'get',
				action: 'Get an approval request',
				description: 'Get a single approval request by ID',
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
				description: 'Get many approval requests',
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
	...approvalGetDescription,
	...approvalGetAllDescription,
];
