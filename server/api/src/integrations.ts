export const integrationBoundaries = {
  stylist: { status: 'not_connected' as const, note: 'The keyword stylist in the React app is unchanged. This API does not call a model.' },
  tryOn: {
    status: 'mock_ready' as const,
    note: 'Customer try-on jobs use a local demonstration provider by default. Live FASHN adapters are wired but disabled until TRYON_ALLOW_LIVE, budget, key, and external-photo-AI consent are approved.',
  },
  shopping: { status: 'not_connected' as const, note: 'The shopping lab remains a separate localhost process. No live retailer is connected.' },
  beauty: { status: 'not_connected' as const, note: 'No beauty model is called.' },
  billing: { status: 'not_connected' as const, note: 'No payment provider is configured. Plan prices are provisional and no route starts a paid subscription.' },
  credits: { status: 'not_connected' as const, note: 'Test credits can be recorded by an authorised operator. Nothing in this API purchases credits or calls a payment provider.' },
};
