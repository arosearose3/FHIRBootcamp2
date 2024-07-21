<script>
  import { onMount } from 'svelte';

  let vitalData = { total: 0, link: [], vitalSigns: [] };

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/vitals', {
        method: 'GET',
        credentials: 'include'
      });
      vitalData = await response.json();
    } catch (error) {
      console.error('Error fetching vitals:', error);
    }
  });

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
  }
</script>

<div class="vital-signs">
  <h2>Vital Signs</h2>
  {#if vitalData.vitalSigns.length > 0}
    <p>Total results: {vitalData.total}</p>
    {#each vitalData.vitalSigns as vital}
      <div class="vital-item">
        <h3>{vital.code}</h3>
        <ul>
          <li><strong>ID:</strong> {vital.id}</li>
          <li><strong>Status:</strong> {vital.status}</li>
          <li><strong>Category:</strong> {vital.category}</li>
          <li><strong>Subject:</strong> {vital.subject}</li>
          <li><strong>Effective Date/Time:</strong> {formatDate(vital.effectiveDateTime)}</li>
          <li><strong>Issued:</strong> {formatDate(vital.issued)}</li>
          <li><strong>Performer:</strong> {vital.performer}</li>
          {#if vital.value !== undefined}
            <li><strong>Value:</strong> {vital.value} {vital.unit}</li>
          {/if}
          {#if vital.components}
            <li>
              <strong>Components:</strong>
              <ul>
                {#each vital.components as component}
                  <li>{component.name}: {component.value} {component.unit}</li>
                {/each}
              </ul>
            </li>
          {/if}
          {#if vital.referenceRange}
            <li>
              <strong>Reference Range:</strong>
              {#if vital.referenceRange.low !== undefined && vital.referenceRange.high !== undefined}
                {vital.referenceRange.low} - {vital.referenceRange.high} {vital.referenceRange.unit}
              {:else}
                {vital.referenceRange.text}
              {/if}
            </li>
          {/if}
        </ul>
      </div>
    {/each}
  {:else}
    <p>No vital signs found.</p>
  {/if}
</div>

<style>
  .vital-signs {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
  }
  .vital-item {
    border: 1px solid #ccc;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 5px;
  }
  h3 {
    margin-top: 0;
  }
  ul {
    padding-left: 20px;
  }
</style>