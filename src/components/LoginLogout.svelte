<script>
    export let isLoggedIn = false;
    
    function handleClick() {
      // Toggle login state (replace with actual login/logout logic)
      isLoggedIn = !isLoggedIn;
    }
  </script>
  

  <button on:click={handleClick} class="login-logout-btn">
    {isLoggedIn ? 'Logout' : 'Login'}
  </button>
  
  <style>
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
  </style>