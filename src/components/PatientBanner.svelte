<script>
  import { onMount } from 'svelte';

  let patientInfo = null;
  let error = null;

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/patient-info', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      patientInfo = await response.json();
    } catch (e) {
      console.error('Error fetching patient info:', e);
      error = 'Failed to load patient information.';
    }
  });
</script>

<div class="patient-info">
  {#if error}
    <p class="error">{error}</p>
  {:else if patientInfo}
    <h2>Patient Information</h2>
    <p><strong>Name:</strong> {patientInfo.name}</p>
    <p><strong>Gender:</strong> {patientInfo.gender}</p>
    <p><strong>Date of Birth:</strong> {patientInfo.birthDate}</p>
    <h3>Identifiers:</h3>
    {#if patientInfo.identifier.length > 0}
      <ul>
        {#each patientInfo.identifier as id}
          <li>{id.system}: {id.value}</li>
        {/each}
      </ul>
    {:else}
      <p>No identifiers available</p>
    {/if}
  {:else}
    <p>Loading patient information...</p>
  {/if}
</div>

<style>
  .patient-info {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
  }

  h2 {
    color: #333;
    border-bottom: 2px solid #333;
    padding-bottom: 10px;
  }

  h3 {
    color: #444;
    margin-top: 20px;
  }

  p {
    margin: 10px 0;
  }

  ul {
    list-style-type: none;
    padding-left: 0;
  }

  li {
    margin-bottom: 5px;
  }

  .error {
    color: red;
    font-weight: bold;
  }
</style>