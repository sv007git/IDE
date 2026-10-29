// Antigravity IDE - Google Sign-In & User Identity Manager
const USER_STORAGE_KEY = 'antigravity_user_profile';
const CLIENT_ID_KEY = 'antigravity_google_client_id';

class AuthManager {
  constructor() {
    this.user = null;
    this.clientId = localStorage.getItem(CLIENT_ID_KEY) || '';
    this.loadUser();
  }

  loadUser() {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        this.user = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse user profile', e);
      this.user = null;
    }
  }

  saveUser(profile) {
    this.user = profile;
    if (profile) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
    this.updateUI();
  }

  initGSI() {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      console.log('Google Identity Services script still loading or unavailable.');
      return;
    }

    if (this.clientId) {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: (response) => this.handleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true
      });

      const btnContainer = document.getElementById('google-signin-btn-container');
      if (btnContainer) {
        btnContainer.innerHTML = '';
        window.google.accounts.id.renderButton(btnContainer, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 250,
          text: 'signin_with'
        });
      }
    }
  }

  handleCredentialResponse(response) {
    if (!response || !response.credential) return;
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const data = JSON.parse(jsonPayload);
      
      const profile = {
        name: data.name || 'Google Developer',
        email: data.email || 'developer@google.com',
        picture: data.picture || 'https://lh3.googleusercontent.com/a/default-user',
        sub: data.sub,
        authenticatedWithGoogle: true,
        loginDate: new Date().toISOString()
      };

      this.saveUser(profile);
      alert(`Signed in successfully as ${profile.name}!`);
      
      const modal = document.getElementById('settings-modal');
      if (modal) modal.classList.remove('active');
    } catch (e) {
      console.error('Error decoding Google JWT', e);
      alert('Failed to parse Google sign-in response.');
    }
  }

  loginWithDemoGoogle(customName = 'Developer') {
    const profile = {
      name: customName || 'Google Developer',
      email: `${(customName || 'developer').toLowerCase().replace(/\s+/g, '')}@gmail.com`,
      picture: 'https://www.gstatic.com/images/branding/product/2x/avatar_square_blue_120dp.png',
      authenticatedWithGoogle: true,
      loginDate: new Date().toISOString()
    };
    this.saveUser(profile);
  }

  signOut() {
    this.saveUser(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }

  setClientId(newId) {
    this.clientId = (newId || '').trim();
    localStorage.setItem(CLIENT_ID_KEY, this.clientId);
    this.initGSI();
  }

  updateUI() {
    const avatarImg = document.getElementById('user-avatar-img');
    const profileImg = document.getElementById('profile-display-img');
    const profileName = document.getElementById('profile-display-name');
    const profileEmail = document.getElementById('profile-display-email');
    const signedInSection = document.getElementById('profile-signed-in');
    const signedOutSection = document.getElementById('profile-signed-out');

    if (this.user) {
      if (avatarImg) avatarImg.src = this.user.picture;
      if (profileImg) profileImg.src = this.user.picture;
      if (profileName) profileName.textContent = this.user.name;
      if (profileEmail) profileEmail.textContent = this.user.email;
      if (signedInSection) signedInSection.style.display = 'block';
      if (signedOutSection) signedOutSection.style.display = 'none';
    } else {
      if (avatarImg) avatarImg.src = 'favicon.svg';
      if (profileImg) profileImg.src = 'favicon.svg';
      if (signedInSection) signedInSection.style.display = 'none';
      if (signedOutSection) signedOutSection.style.display = 'block';
    }
  }
}

window.auth = new AuthManager();

// Automatically init GSI when Google script loads
window.onloadGSI = function() {
  if (window.auth) window.auth.initGSI();
};
