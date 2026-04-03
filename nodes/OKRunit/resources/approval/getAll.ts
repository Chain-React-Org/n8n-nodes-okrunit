import type { INodeProperties } from 'n8n-workflow';

const showOnlyForApprovalGetAll = {
	operation: ['getAll'],
	resource: ['approval'],
};

export const approvalGetAllDescription: INodeProperties[] = [
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				...showOnlyForApprovalGetAll,
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		routing: {
			send: {
				type: 'query',
				property: 'page_size',
			},
			output: {
				maxResults: '={{$value}}',
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: showOnlyForApprovalGetAll,
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
		routing: {
			send: {
				paginate: '={{ $value }}',
				type: 'query',
				property: 'page_size',
				value: '100',
			},
			operations: {
				pagination: {
					type: 'generic',
					properties: {
						continue: '={{ $response.body.data.length > 0 && $response.body.data.length >= 100 }}',
						request: {
							qs: {
								page: '={{ ($request.qs?.page ? Number($request.qs.page) : 1) + 1 }}',
							},
						},
					},
				},
			},
		},
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		displayOptions: {
			show: showOnlyForApprovalGetAll,
		},
		default: {},
		options: [
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Pending', value: 'pending' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Rejected', value: 'rejected' },
					{ name: 'Expired', value: 'expired' },
				],
				default: 'pending',
				description: 'Filter approvals by status',
				routing: {
					send: {
						type: 'query',
						property: 'status',
					},
				},
			},
			{
				displayName: 'Priority',
				name: 'priority',
				type: 'options',
				options: [
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
					{ name: 'High', value: 'high' },
					{ name: 'Critical', value: 'critical' },
				],
				default: 'medium',
				description: 'Filter approvals by priority',
				routing: {
					send: {
						type: 'query',
						property: 'priority',
					},
				},
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				description: 'Search approvals by title or description',
				routing: {
					send: {
						type: 'query',
						property: 'search',
					},
				},
			},
		],
	},
];
