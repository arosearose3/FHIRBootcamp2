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
    codeChallenge = await generateCodeChallenge(codeVerifier);

    try {
      const sessionResponse = await fetch('http://localhost:3000/auth/check-session', {
        method: 'GET',
        credentials: 'include'
      });
      if (!sessionResponse.ok) {
        throw new Error(`HTTP error! status: ${sessionResponse.status}`);
      }
      const data = await sessionResponse.json();
      isLoggedIn = data.active;
    } catch (err) {
      console.error('Error checking session:', err);
      error = `Failed to check session: ${err.message}`;
    }
  });

  function generateCodeVerifier() {
    return uuidv4() + uuidv4() + uuidv4();
  }

  async function generateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  async function handleLogOutClick() {
    try {
      const response = await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      isLoggedIn = false;
      error = null;
    } catch (err) {
      console.error('Error logging out:', err);
      error = `Failed to log out: ${err.message}`;
    }
  }
  
  async function handleConnectClick() {
    isLoading = true;
    error = null;

    try {
      const state = uuidv4();
      
      const response = await fetch('http://localhost:3000/api/auth-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state, codeChallenge }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${errorData.error}: ${errorData.details}`);
      }

      const { authUrl } = await response.json();

      // Store the code verifier and state in sessionStorage for later use
      sessionStorage.setItem('codeVerifier', codeVerifier);
      sessionStorage.setItem('state', state);

      // Redirect the user to the authorization URL
      console.log('authUrl', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error initiating authorization process:', err);
      error = `Failed to initiate authorization process: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }

  function handleLoginSuccess() {
    isLoggedIn = true;
    error = null;
  }

  function handleApiError(err) {
    console.error('API Error:', err);
    if (err.message.includes('status 503')) {
      error = 'The server is temporarily unavailable. Please try again later.';
    } else {
      error = `An error occurred: ${err.message}`;
    }
    isLoggedIn = false;
  }
</script>

<main>
  <header>
    <div class="banner">
      <h1>Epic Integration App</h1>
    </div>  
  </header>
  
  <nav>
    {#if !isLoggedIn}
      <button class="login-logout-btn" on:click={handleConnectClick} disabled={isLoading}>
        Connect To Epic
      </button>
      {#if isLoading}
        <div class="spinner"></div>
      {/if}
    {:else}
      <button class="login-logout-btn" on:click={handleLogOutClick}>
        Log Out
      </button>
    {/if}
  </nav>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if isLoggedIn}
    <PatientBanner on:error={handleApiError} />
    <Medications on:error={handleApiError} />
    <Labs on:error={handleApiError} />
    <Vitals on:error={handleApiError} />
  {/if}
</main>

<style>
  header {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  nav {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

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

  .login-logout-btn {
    padding: 10px 50px;
    background-color: #d3d3d3; /* Light gray */
    color: black;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .login-logout-btn:hover {
    background-color: #a9a9a9; /* Dark gray */
    color: white;
  }

  .login-logout-btn:active {
    background-color: black;
    color: white;
  }
  .error {
    color: red;
    font-weight: bold;
    margin-top: 10px;
  }
</style>