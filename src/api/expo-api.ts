import { AuthApiError } from './auth-api';
import { API_BASE } from './config';

export interface ExpoConfig {
  header: string;
  description: string;
  location: string;
  background: string | null;
  isActive: boolean;
  fallbackMessage: string;
  updatedAt: string;
}

export interface ExpoConfigInput {
  header: string;
  description: string;
  location: string;
  fallbackMessage: string;
  isActive: boolean;
  removeBackground?: boolean;
}

// Anyone can read the expo banner — the storefront shows it (or the fallback
// message when it's disabled) without needing to be signed in.
export async function getExpoConfig(): Promise<ExpoConfig> {
  const res = await fetch(`${API_BASE}/api/catalog/expo/`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not load the expo banner.');
  }
  return body as ExpoConfig;
}

export async function updateExpoConfig(
  token: string,
  input: ExpoConfigInput,
  background?: File | null
): Promise<ExpoConfig> {
  const formData = new FormData();
  formData.append('header', input.header);
  formData.append('description', input.description);
  formData.append('location', input.location);
  formData.append('fallbackMessage', input.fallbackMessage);
  formData.append('isActive', String(input.isActive));
  if (background) {
    formData.append('background', background);
  } else if (input.removeBackground) {
    formData.append('removeBackground', 'true');
  }

  const res = await fetch(`${API_BASE}/api/catalog/expo/`, {
    method: 'PATCH',
    headers: { Authorization: `Token ${token}` },
    body: formData,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(body.detail ?? 'Could not save the expo banner.');
  }
  return body as ExpoConfig;
}
