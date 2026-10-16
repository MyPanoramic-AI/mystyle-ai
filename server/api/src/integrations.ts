export const integrationBoundaries = {
  stylist: { status: 'not_connected' as const, note: 'The keyword stylist in the React app is unchanged. This API does not call a model.' },
  tryOn: { status: 'not_connected' as const, note: 'The FASHN lab remains a separate localhost process. Photographs are not forwarded.' },
  shopping: { status: 'not_connected' as const, note: 'The shopping lab remains a separate localhost process. No live retailer is connected.' },
  beauty: { status: 'not_connected' as const, note: 'No beauty model is called.' },
  billing: { status: 'not_connected' as const, note: 'No payment provider is configured. Entitlements are not granted from demonstration data.' },
  credits: { status: 'not_connected' as const, note: 'The ledger exists. Nothing in this API purchases or grants paid credits.' },
};
