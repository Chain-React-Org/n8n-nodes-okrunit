import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class OKRunitOAuth2Api implements ICredentialType {
	name = 'okrunitOAuth2Api';

	extends = ['oAuth2Api'];

	displayName = 'OKRunit OAuth2 API';

	icon = 'file:../icons/okrunit.png' as const;

	documentationUrl = 'https://okrunit.com/docs/integrations/n8n';

	properties: INodeProperties[] = [
		{
			displayName: 'Grant Type',
			name: 'grantType',
			type: 'hidden',
			default: 'authorizationCode',
		},
		{
			displayName: 'Authorization URL',
			name: 'authUrl',
			type: 'hidden',
			default: 'https://okrunit.com/oauth/authorize',
		},
		{
			displayName: 'Access Token URL',
			name: 'accessTokenUrl',
			type: 'hidden',
			default: 'https://okrunit.com/api/v1/oauth/token',
		},
		{
			displayName: 'Scope',
			name: 'scope',
			type: 'hidden',
			default: 'approvals:read approvals:write comments:write',
		},
		{
			displayName: 'Auth URI Query Parameters',
			name: 'authQueryParameters',
			type: 'hidden',
			default: '',
		},
		{
			displayName: 'Authentication',
			name: 'authentication',
			type: 'hidden',
			default: 'body',
		},
	];
}
