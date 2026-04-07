import type { INodeProperties } from 'n8n-workflow';

const showOnlyForApprovalCreate = {
	operation: ['create'],
	resource: ['approval'],
};

export const approvalCreateDescription: INodeProperties[] = [
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: 'Approval request from n8n',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description: 'Title of the approval request. Defaults to "Approval request from n8n" if left blank.',
		routing: {
			send: {
				type: 'body',
				property: 'title',
			},
		},
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		required: true,
		options: [
			{ name: 'Low', value: 'low' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'High', value: 'high' },
			{ name: 'Critical', value: 'critical' },
		],
		default: 'medium',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description: 'Priority level of the approval request',
		routing: {
			send: {
				type: 'body',
				property: 'priority',
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
			show: showOnlyForApprovalCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'source',
			},
		},
	},
	{
		// Auto-generate an idempotency key
		displayName: 'Idempotency Key',
		name: 'idempotencyKey',
		type: 'hidden',
		default: '={{$guid}}',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		routing: {
			send: {
				type: 'body',
				property: 'idempotency_key',
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		options: [
			{
				displayName: 'Action Type Name or ID',
				name: 'actionType',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getActionTypes',
				},
				default: '',
				description: 'Category of action being approved. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>. New types are auto-registered in your organization. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
				routing: {
					send: {
						type: 'body',
						property: 'action_type',
					},
				},
			},
			{
				displayName: 'Callback URL',
				name: 'callbackUrl',
				type: 'string',
				default: '',
				placeholder: 'https://...',
				description: 'Webhook URL to receive the approval decision',
				routing: {
					send: {
						type: 'body',
						property: 'callback_url',
					},
				},
			},
			{
				displayName: 'Context HTML',
				name: 'contextHtml',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Rich HTML content displayed to approvers for additional context',
				routing: {
					send: {
						type: 'body',
						property: 'context_html',
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description: 'Detailed description providing context for the reviewer',
				routing: {
					send: {
						type: 'body',
						property: 'description',
					},
				},
			},
			{
				displayName: 'Expires At',
				name: 'expiresAt',
				type: 'dateTime',
				default: '',
				description: 'When the approval request should automatically expire',
				routing: {
					send: {
						type: 'body',
						property: 'expires_at',
					},
				},
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description: 'Arbitrary JSON data to attach to the approval request',
				routing: {
					send: {
						type: 'body',
						property: 'metadata',
						value: '={{JSON.parse($value)}}',
					},
				},
			},
			{
				displayName: 'Required Approvals',
				name: 'requiredApprovals',
				type: 'number',
				typeOptions: {
					minValue: 1,
					maxValue: 10,
				},
				default: 1,
				description: 'Number of approvals needed before the request is approved',
				routing: {
					send: {
						type: 'body',
						property: 'required_approvals',
					},
				},
			},
		],
	},
];
