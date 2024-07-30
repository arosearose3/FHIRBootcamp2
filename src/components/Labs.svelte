<script>
  import { onMount } from 'svelte';
 
  

  let labData = { total: 0, results: [], page: 1, pageSize: 100, totalPages: 1, links: {} };
  let loading = false;
  let error = null;

  async function fetchLabs(url = 'http://localhost:3000/api/labs') {
    loading = true;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch lab results');
      }
      const newData = await response.json();
      
      // If it's the first page, replace the data; otherwise, append
      if (newData.page === 1) {
        labData = newData;
      } else {
        labData = {
          ...newData,
          results: [...labData.results, ...newData.results]
        };
      }
    } catch (err) {
      console.error('Error fetching labs:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }

  function loadMore() {
    if (labData.links.next) {
      fetchLabs(labData.links.next);
    }
  }

  onMount(() => {
    fetchLabs();
  });
</script>

<div class="lab-results">
  <h2>Lab Results</h2>

  {#if error}
    <p class="error">{error}</p>
  {:else if labData.results.length > 0}
    <p>Showing {labData.results.length} of {labData.total+1} results</p>
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
    {#if labData.links.next}
      <button on:click={loadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    {/if}
    <p>Page {labData.page} of {labData.totalPages}</p>
  {:else if loading}
    <p>Loading lab results...</p>
  {:else}
    <p>No lab results found.</p>
  {/if}
</div>

<style>
  .lab-results {
    font-family: Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
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
  .error {
    color: red;
    font-weight: bold;
  }
  button {
    display: block;
    margin: 20px auto;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
</style>