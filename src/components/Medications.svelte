<script>
  import { onMount } from 'svelte';

  let medications = [];
  let error = null;

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/medications', {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch medications');
      }
      medications = await response.json();
    } catch (err) {
      console.error('Error fetching medications:', err);
      error = err.message;
    }
  });
</script>

<div class="medications-container">
  <h2>Medications</h2>
  {#if error}
    <p class="error">Error: {error}</p>
  {:else if medications.length > 0}
    {#each medications as medication}
      <div class="medication-card">
        <h3>{medication.medication}</h3>
        <p><strong>ID:</strong> {medication.id}</p>
        <p><strong>Status:</strong> {medication.status}</p>
        <p><strong>Intent:</strong> {medication.intent}</p>
        <p><strong>Category:</strong> {medication.category}</p>
        <p><strong>Authored On:</strong> {new Date(medication.authoredOn).toLocaleString()}</p>
        <p><strong>Requester:</strong> {medication.requester}</p>
        <h4>Dosage Instructions:</h4>
        {#if Array.isArray(medication.dosageInstructions)}
          <ul>
            {#each medication.dosageInstructions as instruction}
              <li>
                <p><strong>Timing:</strong> {instruction.timing}</p>
                <p><strong>Route:</strong> {instruction.route}</p>
                <p><strong>Dose:</strong> {instruction.doseQuantity}</p>
              </li>
            {/each}
          </ul>
        {:else}
          <p>{medication.dosageInstructions}</p>
        {/if}
      </div>
    {/each}
  {:else}
    <p>No medications found.</p>
  {/if}
</div>

<style>
  .medications-container {
    max-width: 800px;
    margin: 0 auto;
  }
  .medication-card {
    border: 1px solid #ccc;
    border-radius: 4px;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .error {
    color: red;
  }
</style>