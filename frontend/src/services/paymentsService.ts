import { post } from '../lib/api';

type CreatePreferenceApiResponse = {
  init_point?: string;
  sandbox_init_point?: string | null;
};

export const paymentsService = {
  createPreference: async (ticketId: string): Promise<{ init_point: string }> => {
    try {
      const response = await post<CreatePreferenceApiResponse>('/api/payments/create-preference', { ticketId });
      const url = response.sandbox_init_point || response.init_point;

      if (!url) {
        console.error('Missing payment URL in response:', response);
        throw new Error('No se recibió URL de pago.');
      }

      return { init_point: url };
    } catch (error: any) {
      throw new Error(error?.message || 'No se pudo crear la preferencia de pago.');
    }
  }
};

export const startCheckout = async (ticketId: string) => {
  const { init_point } = await paymentsService.createPreference(ticketId);
  window.location.href = init_point;
};
