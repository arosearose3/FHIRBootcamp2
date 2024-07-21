<script>
    import { onMount } from 'svelte';
  
    let medications = [];
  
    onMount(async () => {
      try {
      const response = await fetch('http://localhost:3000/api/medications', {
        method: 'GET',
        credentials: 'include'
      });
      medications = await response.json();
    }  catch (error) {
        console.error('Error fetching medications:', error);
      }
    });
  </script>
  
  <div>
    <h2>Medications</h2>
    {#if medications.length > 0}
      <ul>
        {#each medications as medication}
          <li>{medication.name} - {medication.dosage}</li>
        {/each}
      </ul>
    {:else}
      <p>No medications found.</p>
    {/if}
  </div>