<script>
    import { onMount } from 'svelte';
  
    let vitals = [];
  
    onMount(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/vitals', {
        method: 'GET',
        credentials: 'include'
      });
        vitals = await response.json();
      } catch (error) {
        console.error('Error fetching vitals:', error);
      }
    });
  </script>
  
  <div>
    <h2>Vitals</h2>
    {#if vitals.length > 0}
      <ul>
        {#each vitals as vital}
          <li>{vital.name}: {vital.value} {vital.unit}</li>
        {/each}
      </ul>
    {:else}
      <p>No vitals found.</p>
    {/if}
  </div>