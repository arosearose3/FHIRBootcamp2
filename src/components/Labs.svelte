<script>
    import { onMount } from 'svelte';
  
    let labs = [];
  
    onMount(async () => {
      try {   
        const response = await fetch('http://localhost:3000/api/labs', {
        method: 'GET',
        credentials: 'include'
      });
      labs = await response.json();
      } catch (error) {
        console.error('Error fetching labs:', error);
      }
    });
  </script>
  
  <div>
    <h2>Lab Results</h2>
    {#if labs.length > 0}
      <ul>
        {#each labs as lab}
          <li>{lab.name}: {lab.value} {lab.unit}</li>
        {/each}
      </ul>
    {:else}
      <p>No lab results found.</p>
    {/if}
  </div>