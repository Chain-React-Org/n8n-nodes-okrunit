import type {
	IDataObject,
	IPollFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

interface ApprovalRecord {
	id: string;
	created_at: string;
	is_log: boolean;
	[key: string]: unknown;
}

export class OkrunitNewApprovalTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OKRunit New Approval Trigger',
		name: 'okrunitNewApprovalTrigger',
		icon: 'file:../../icons/okrunit.png',
		group: ['trigger'],
		version: 1,
		description: 'Fires when a new approval request is created in OKRunit',
		defaults: { name: 'New Approval Request' },
		usableAsTool: true,
		inputs: [],
		outputs: ['main'],
		polling: true,
		credentials: [
			{
				name: 'okrunitApi',
				required: true,
				displayOptions: {
					show: {
						authentication: ['apiKey'],
					},
				},
			},
			{
				name: 'okrunitOAuth2Api',
				required: true,
				displayOptions: {
					show: {
						authentication: ['oAuth2'],
					},
				},
			},
		],
		properties: [
			{
				displayName: 'Authentication',
				name: 'authentication',
				type: 'options',
				options: [
					{
						name: 'API Key',
						value: 'apiKey',
					},
					{
						name: 'OAuth2',
						value: 'oAuth2',
					},
				],
				default: 'apiKey',
			},
			{
				displayName: 'Status Filter',
				name: 'statusFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Approved', value: 'approved' },
					{ name: 'Cancelled', value: 'cancelled' },
					{ name: 'Expired', value: 'expired' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Rejected', value: 'rejected' },
				],
				default: '',
				description: 'Only trigger for approvals with this status',
			},
			{
				displayName: 'Priority Filter',
				name: 'priorityFilter',
				type: 'options',
				options: [
					{ name: 'Any', value: '' },
					{ name: 'Critical', value: 'critical' },
					{ name: 'High', value: 'high' },
					{ name: 'Low', value: 'low' },
					{ name: 'Medium', value: 'medium' },
				],
				default: '',
				description: 'Only trigger for approvals with this priority',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType = authType === 'oAuth2' ? 'okrunitOAuth2Api' : 'okrunitApi';

		const webhookData = this.getWorkflowStaticData('node');
		const seenIds = (webhookData.seenIds as string[] | undefined) ?? [];

		const statusFilter = this.getNodeParameter('statusFilter') as string;
		const priorityFilter = this.getNodeParameter('priorityFilter') as string;

		const qs: Record<string, string> = { page_size: '50' };
		if (statusFilter) qs.status = statusFilter;
		if (priorityFilter) qs.priority = priorityFilter;

		const response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			credentialType,
			{
				method: 'GET',
				url: 'https://okrunit.com/api/v1/approvals',
				json: true,
				qs,
			},
		)) as { data?: ApprovalRecord[] };

		const approvals: ApprovalRecord[] = response.data ?? [];
		const results: INodeExecutionData[] = [];
		const seenSet = new Set(seenIds);

		for (const approval of approvals) {
			if (!seenSet.has(approval.id) && !approval.is_log) {
				results.push({ json: approval as unknown as IDataObject });
				seenSet.add(approval.id);
			}
		}

		// Keep only the most recent 200 IDs to prevent unbounded growth
		const allIds = Array.from(seenSet);
		webhookData.seenIds = allIds.slice(-200);

		if (results.length === 0) return null;
		return [results];
	}
}
