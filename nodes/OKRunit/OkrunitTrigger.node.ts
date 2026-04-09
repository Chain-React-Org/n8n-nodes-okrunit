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
	decided_at: string | null;
	is_log: boolean;
	[key: string]: unknown;
}

export class OkrunitTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'OKrunit Trigger',
		name: 'okrunitTrigger',
		icon: 'file:../../icons/okrunit.png',
		group: ['trigger'],
		version: 1,
		description: 'Fires when approval events occur in OKRunit',
		defaults: { name: 'OKrunit Trigger' },
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
					{ name: 'API Key', value: 'apiKey' },
					{ name: 'OAuth2', value: 'oAuth2' },
				],
				default: 'apiKey',
			},
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				options: [
					{
						name: 'New Approval Request',
						value: 'newApproval',
						description: 'Fires when a new approval request is created',
					},
					{
						name: 'Approval Decided',
						value: 'approvalDecided',
						description:
							'Fires when an approval is approved or rejected',
					},
				],
				default: 'newApproval',
				description: 'The event to listen for',
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
				displayOptions: {
					show: {
						event: ['newApproval'],
					},
				},
				description: 'Only trigger for approvals with this status',
			},
			{
				displayName: 'Decision Filter',
				name: 'decisionFilter',
				type: 'options',
				options: [
					{ name: 'Approved Only', value: 'approved' },
					{ name: 'Approved or Rejected', value: 'any' },
					{ name: 'Rejected Only', value: 'rejected' },
				],
				default: 'any',
				displayOptions: {
					show: {
						event: ['approvalDecided'],
					},
				},
				description: 'Filter to only trigger on specific decision types',
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

	async poll(
		this: IPollFunctions,
	): Promise<INodeExecutionData[][] | null> {
		const authType = this.getNodeParameter('authentication', 0) as string;
		const credentialType =
			authType === 'oAuth2' ? 'okrunitOAuth2Api' : 'okrunitApi';
		const event = this.getNodeParameter('event') as string;

		const webhookData = this.getWorkflowStaticData('node');
		const seenIds = new Set<string>(
			(webhookData.seenIds as string[] | undefined) ?? [],
		);
		const isFirstPoll =
			seenIds.size === 0 && webhookData.initialized !== true;

		const priorityFilter = this.getNodeParameter('priorityFilter') as string;
		const workflowId = this.getWorkflow().id;

		const results: INodeExecutionData[] = [];

		if (event === 'newApproval') {
			const statusFilter = this.getNodeParameter('statusFilter') as string;

			const qs: Record<string, string> = {
				page_size: '50',
				exclude_source_id: `n8n-${workflowId}`,
			};
			if (statusFilter) qs.status = statusFilter;
			if (priorityFilter) qs.priority = priorityFilter;

			const response =
				(await this.helpers.httpRequestWithAuthentication.call(
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

			if (isFirstPoll) {
				const twoMinutesAgo = new Date(
					Date.now() - 2 * 60 * 1000,
				).toISOString();
				for (const approval of approvals) {
					seenIds.add(approval.id);
					if (
						!approval.is_log &&
						approval.created_at > twoMinutesAgo
					) {
						results.push({
							json: approval as unknown as IDataObject,
						});
					}
				}
			} else {
				for (const approval of approvals) {
					if (!seenIds.has(approval.id) && !approval.is_log) {
						results.push({
							json: approval as unknown as IDataObject,
						});
					}
					seenIds.add(approval.id);
				}
			}
		} else if (event === 'approvalDecided') {
			const decisionFilter = this.getNodeParameter(
				'decisionFilter',
			) as string;
			const statuses =
				decisionFilter === 'any'
					? ['approved', 'rejected']
					: [decisionFilter];

			for (const status of statuses) {
				const qs: Record<string, string> = {
					status,
					page_size: '50',
					exclude_source_id: `n8n-${workflowId}`,
				};
				if (priorityFilter) qs.priority = priorityFilter;

				const response =
					(await this.helpers.httpRequestWithAuthentication.call(
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

				if (isFirstPoll) {
					const twoMinutesAgo = new Date(
						Date.now() - 2 * 60 * 1000,
					).toISOString();
					for (const approval of approvals) {
						seenIds.add(approval.id);
						if (
							!approval.is_log &&
							approval.decided_at &&
							approval.decided_at > twoMinutesAgo
						) {
							results.push({
								json: approval as unknown as IDataObject,
							});
						}
					}
				} else {
					for (const approval of approvals) {
						if (
							!seenIds.has(approval.id) &&
							!approval.is_log &&
							approval.decided_at
						) {
							results.push({
								json: approval as unknown as IDataObject,
							});
						}
						seenIds.add(approval.id);
					}
				}
			}
		}

		// Persist seen IDs (cap at 500 to prevent unbounded growth)
		const allIds = Array.from(seenIds);
		webhookData.seenIds = allIds.slice(-500);
		webhookData.initialized = true;

		if (results.length === 0) return null;
		return [results];
	}
}
