import type { INodeProperties } from 'n8n-workflow';

const showOnlyForApprovalGet = {
	operation: ['get'],
	resource: ['approval'],
};

export const approvalGetDescription: INodeProperties[] = [
	{
		displayName: 'Request ID',
		name: 'approvalId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: {
			show: showOnlyForApprovalGet,
		},
		description: 'The ID of the approval request to retrieve (use {{ $json.request_id }} from the trigger)',
	},
];
