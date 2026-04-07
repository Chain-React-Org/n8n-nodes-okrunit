import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class OKRunitApi implements ICredentialType {
	name = 'okrunitApi';

	displayName = 'OKRunit API';

	icon = 'file:../icons/okrunit.svg' as const;

	documentationUrl = 'https://okrunit.com/docs/integrations/n8n';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			placeholder: 'ok_...',
			description: 'Your OKRunit API key (starts with ok_)',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://okrunit.com',
			url: '/api/v1/approvals',
			method: 'GET',
			qs: {
				page_size: '1',
			},
		},
	};
}
