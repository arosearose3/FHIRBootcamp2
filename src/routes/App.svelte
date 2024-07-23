<script>
  import { onMount } from 'svelte';
  import { v4 as uuidv4 } from 'uuid';

  import PatientBanner from '../components/PatientBanner.svelte';
  import Medications from '../components/Medications.svelte';
  import Labs from '../components/Labs.svelte';
  import Vitals from '../components/Vitals.svelte';

  let isLoggedIn = false;
  let isLoading = false;
  let error = null;

  // PKCE code verifier and challenge
  let codeVerifier = '';
  let codeChallenge = '';

  onMount(async () => {
    codeVerifier = generateCodeVerifier();
    generateCodeChallenge(codeVerifier).then(challenge => {
      codeChallenge = challenge;
    });

    try {
      let sessionResponse = await fetch('http://localhost:3000/auth/check-session', {
        method: 'GET',
        credentials: 'include'
      })
      const data = await sessionResponse.json();
      isLoggedIn = data.active;
    } catch (error) {
      console.error('Error checking session:', error);
    }
  });

  function generateCodeVerifier() {
    return uuidv4() + uuidv4() + uuidv4();
  }

  async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  async function handleLogOutClick() {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      isLoggedIn = false;
    } catch (error) {
      console.error('Error logging out:', error);
    }
  }
  
  async function handleConnectClick() {
    isLoading = true;
    error = null;

    try {
      const state = uuidv4();
      
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      const response = await fetch('http://localhost:3000/api/auth-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state, codeChallenge }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { authUrl } = await response.json();

      // Store the code verifier and state in sessionStorage for later use
      sessionStorage.setItem('codeVerifier', codeVerifier);
      sessionStorage.setItem('state', state);

      // Redirect the user to the authorization URL
      console.log ('authUrl', authUrl);
      window.location.href = authUrl;
    } catch (e) {
      console.error('Error initiating authorization process:', e);
      error = `Failed to initiate authorization process: ${e.message}`;
      isLoading = false;
    }
  }

  function handleLoginSuccess() {
    isLoggedIn = true;
  }
</script>

<main>
  <header>
    <h1>Epic Integration App</h1>
  </header>
  
  <nav>
    {#if !isLoggedIn}
      <button on:click={handleConnectClick} disabled={isLoading}>
        Connect To Epic
      </button>
      {#if isLoading}
        <div class="spinner"></div>
      {/if}
    {/if}
  </nav>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if isLoggedIn}
    <br>
    <button on:click={handleLogOutClick}>
      Log Out
    </button><br><br>
    <PatientBanner />
    <Medications />
    <Labs />
    <Vitals />
  {/if}
</main>

<style>
  /* ... (existing styles remain unchanged) ... */

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 20px auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  button {
    margin-right: 10px;
  }
</style>