const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '7268842208-lgeq3s840e9n2tco691i0k8vlmbkd19g.apps.googleusercontent.com'

export const ensureGoogleScriptLoaded = () => {
  if (!document.getElementById('google-gsi-script')) {
    const script = document.createElement('script')
    script.id = 'google-gsi-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
  }
}

export const triggerGoogleLogin = ({ onSuccess, onError }) => {
  ensureGoogleScriptLoaded()

  if (!window.google?.accounts?.oauth2) {
    onError('Google Login service is still loading, please try again in a moment.')
    return
  }

  try {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile openid',
      callback: async (tokenResponse) => {
        if (tokenResponse.access_token) {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            const profile = await res.json()
            onSuccess({
              email: profile.email,
              displayName: profile.name || profile.email?.split('@')[0],
              photoUrl: profile.picture,
            })
          } catch (err) {
            console.error('Failed to fetch profile from Google:', err)
            onError('Failed to fetch user info from Google.')
          }
        } else if (tokenResponse.error) {
          onError('Google Login failed or was canceled.')
        }
      },
      error_callback: (err) => {
        console.error('GIS Error Callback:', err)
        onError('Google client authentication error.')
      },
    })

    client.requestAccessToken({ prompt: 'select_account' })
  } catch (err) {
    console.error('Google OAuth init error:', err)
    onError('Google Login failed or was canceled.')
  }
}

