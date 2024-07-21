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
      //console.log ( 'in try block of onMount App.svelte');
    
       let sessionResponse = await fetch('http://localhost:3000/auth/check-session', {
        method: 'GET',
        credentials: 'include'
      })
     // console.log ('in App.svelte, sessionResponse:', sessionResponse);

      const data = await sessionResponse.json();
    //  console.log ('in App.svelte, data:', data);
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
      
      const codeVerifier = generateCodeVerifier(); // Your function to generate a code verifier
      const codeChallenge = await generateCodeChallenge(codeVerifier); // Your function to generate a code challenge

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
        {#if isLoading}
          Connecting...
        {:else}
          Connect To Epic
        {/if}
      </button>
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
  /* ... (styles remain unchanged) ... */
</style>