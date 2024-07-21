<script>
    import { createEventDispatcher } from 'svelte';
  
    let username = '';
    let password = '';
    const dispatch = createEventDispatcher();
  
    async function handleSubmit() {
      // Here you would typically make an API call to authenticate
      // For now, we'll just simulate a successful login
      console.log('Login attempted with:', { username, password });
      dispatch('loginSuccess');
    }
  </script>
  
  <form on:submit|preventDefault={handleSubmit}>
    <div>
      <label for="username">Username:</label>
      <input type="text" id="username" bind:value={username} required>
    </div>
    <div>
      <label for="password">Password:</label>
      <input type="password" id="password" bind:value={password} required>
    </div>
    <button type="submit">Login</button>
  </form>
  
  <style>
    form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
  
    div {
      display: flex;
      flex-direction: column;
    }
  
    label {
      margin-bottom: 5px;
    }
  
    input {
      padding: 5px;
    }
  
    button {
      align-self: flex-start;
      padding: 5px 10px;
    }
  </style>