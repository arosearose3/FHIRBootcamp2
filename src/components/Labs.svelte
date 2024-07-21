<script>
  import { onMount } from 'svelte';

  let labData = { total: 0, link: [], results: [] };

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/labs', {
        method: 'GET',
        credentials: 'include'
      });
      labData = await response.json();
    } catch (error) {
      console.error('Error fetching labs:', error);
    }
  });
</script>

<div class="lab-results">
  <h2>Lab Results</h2>
  {#if labData.results.length > 0}
    <p>Total results: {labData.total}</p>
    {#each labData.results as lab}
      <div class="lab-item">
        <h3>{lab.name}</h3>
        <ul>
          <li><strong>ID:</strong> {lab.id}</li>
          <li><strong>Value:</strong> {lab.value}</li>
          <li><strong>Status:</strong> {lab.status}</li>
          <li><strong>Effective Date/Time:</strong> {lab.effectiveDateTime}</li>
          <li><strong>Issued:</strong> {lab.issued}</li>
          <li><strong>Category:</strong> {lab.category}</li>
          <li><strong>Performer:</strong> {lab.performer}</li>
          <li><strong>Subject:</strong> {lab.subject}</li>
          <li><strong>Encounter:</strong> {lab.encounter}</li>
          <li><strong>Reference Range:</strong> {lab.referenceRange}</li>
          <li><strong>Specimen:</strong> {lab.specimen}</li>
        </ul>
        {#if lab.categoryDisplays && lab.categoryDisplays.length > 0}
          <h4>Category Displays:</h4>
          <ul>
            {#each lab.categoryDisplays as category}
              {#each Object.entries(category) as [key, value]}
                <li><strong>{key}:</strong> {value}</li>
              {/each}
            {/each}
          </ul>
        {/if}
        {#if lab.codeDisplays}
          <h4>Code Displays:</h4>
          <ul>
            {#each Object.entries(lab.codeDisplays) as [key, value]}
              <li><strong>{key}:</strong> {value}</li>
            {/each}
          </ul>
        {/if}
        {#if lab.basedOn && lab.basedOn.length > 0}
          <h4>Based On:</h4>
          <ul>
            {#each lab.basedOn as item}
              <li><strong>{item.reference}:</strong> {item.display}</li>
            {/each}
          </ul>
        {/if}
      </div>
    {/each}
  {:else}
    <p>No lab results found.</p>
  {/if}
</div>

<style>
  .lab-results {
    font-family: Arial, sans-serif;
    max-width: 800px;
    margin: 0 auto;
  }
  .lab-item {
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