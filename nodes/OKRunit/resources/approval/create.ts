import type { INodeProperties } from 'n8n-workflow';

const showOnlyForApprovalCreate = {
	operation: ['create'],
	resource: ['approval'],
};

export const approvalCreateDescription: INodeProperties[] = [
	{
		displayName: 'Template Name or ID',
		name: 'templateId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getTemplates',
		},
		default: '',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description:
			'Select a template to auto-fill fields below. Any field you fill in will override the template value. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		default: '',
		placeholder: 'Leave blank to use template default',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description:
			'Title of the approval request. If blank, the template title is used (when a template is selected).',
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		placeholder: 'Leave blank to use template default',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description:
			'Detailed description providing context for the reviewer. If blank, the template description is used.',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		options: [
			{ name: 'Use Template Default', value: '' },
			{ name: 'Low', value: 'low' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'High', value: 'high' },
			{ name: 'Critical', value: 'critical' },
		],
		default: '',
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description:
			'Priority level of the approval request.',
	},
	{
		displayName: 'Wait for Decision',
		name: 'waitForDecision',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: showOnlyForApprovalCreate,
		},
		description:
			'Whether to pause the workflow and wait for a human to approve or reject before continuing',
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
				description:
					'Category of action being approved (e.g. deploy, access_request). Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Callback URL',
				name: 'callbackUrl',
				type: 'string',
				default: '',
				placeholder: 'https://...',
				description:
					'Webhook URL to receive the approval decision. Ignored when "Wait for Decision" is enabled.',
			},
			{
				displayName: 'Context HTML',
				name: 'contextHtml',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				description:
					'Rich HTML content displayed to approvers for additional context',
			},
			{
				displayName: 'Expires At',
				name: 'expiresAt',
				type: 'dateTime',
				default: '',
				description:
					'When the approval request should automatically expire',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'json',
				default: '{}',
				description:
					'Arbitrary JSON data to attach to the approval request',
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
				description:
					'Number of approvals needed before the request is approved',
			},
		],
	},
];
