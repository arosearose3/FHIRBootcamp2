<script>
  import Accordion from './Accordian3.svelte';
  import { onMount } from 'svelte';

  let vitalData = { total: 0, vitalSigns: [], page: 1, pageSize: 30, totalPages: 1, links: {} };
  let error = null;
  let loading = false;

  async function fetchVitals(url = 'http://localhost:3000/api/vitals') {
    loading = true;
    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch vital signs');
      }
      const newData = await response.json();
      console.log ("in Vitals, newData:", newData);
      
      // If it's the first page, replace the data; otherwise, append
      if (newData.page === 1) {
        vitalData = newData;
      } else {
        vitalData = {
          ...newData,
          vitalSigns: [...vitalData.vitalSigns, ...newData.vitalSigns]
        };
      }
    } catch (err) {
      console.error('Error fetching vitals:', err);
      error = 'Failed to fetch vital signs data.';
    } finally {
      loading = false;
    }
  }

  function loadMore() {
    if (vitalData.links.next) {
      fetchVitals(vitalData.links.next);
    }
  }

  onMount(() => {
    fetchVitals();
  });
</script>

<div class="vital-signs">
  <h2>Vital Signs</h2>
  {#if error}
    <p class="error">{error}</p>
  {:else if vitalData.vitalSigns.length > 0}
    <p>Showing {vitalData.vitalSigns.length} of {vitalData.total} results</p>
    <Accordion {vitalData} />
    {#if vitalData.links.next}
      <button on:click={loadMore} disabled={loading}>
        {loading ? 'Loading...' : 'Load More'}
      </button>
    {/if}
    <p>Page {vitalData.page} of {vitalData.totalPages}</p>
  {:else if loading}
    <p>Loading vital signs...</p>
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
  :global(.vital-signs ul) {
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