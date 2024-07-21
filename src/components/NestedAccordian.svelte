<script>
    export let items = [];
    export let level = 0;
  
    let activeIndices = new Map();
  
    function toggleItem(index) {
      activeIndices.set(index, !activeIndices.get(index));
      activeIndices = activeIndices;
    }
  
    function isActive(index) {
      return activeIndices.get(index) || false;
    }
  </script>
  
  <div class="accordion" style="padding-left: {level * 20}px">
    {#each items as item, index}
      <div class="accordion-item">
        <button 
          class="accordion-header" 
          on:click={() => toggleItem(index)}
        >
          {item.title}
        </button>
        {#if isActive(index)}
          <div class="accordion-content">
            {#if item.children}
              <svelte:self items={item.children} level={level + 1} />
            {:else}
              {item.content}
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
  
  <style>
    .accordion-item {
      border: 1px solid #ccc;
      margin-bottom: 5px;
    }
    .accordion-header {
      width: 100%;
      text-align: left;
      padding: 10px;
      background-color: #f1f1f1;
      cursor: pointer;
    }
    .accordion-content {
      padding: 10px;
    }
  </style>