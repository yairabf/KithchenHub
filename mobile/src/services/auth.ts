import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Complete the auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
// You'll need to replace these with your actual Google OAuth credentials
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';

// Discovery document for Google OAuth
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export const useGoogleAuth = () => {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'kitchen-hub',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
    },
    discovery
  );

  return {
    request,
    response,
    promptAsync,
  };
};

export const fetchGoogleUserInfo = async (accessToken: string): Promise<GoogleUser | null> => {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
    };
  } catch (error) {
    console.error('Error fetching Google user info:', error);
    return null;
  }
};
