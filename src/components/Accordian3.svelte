<script>
    import { writable } from 'svelte/store';
  
    export let vitalData = { total: 0, link: [], vitalSigns: [] };
    export let level = 0;
  
    const activeIndices = writable(new Set());
    let processedVitalSigns = [];
  
    $: {
      processVitalSigns();
    }
  
    function toggleItem(index) {
      console.log("in accordion toggleItem", index, level);
      activeIndices.update(set => {
        const newSet = new Set(set);
        if (newSet.has(index)) {
          newSet.delete(index);
        } else {
          newSet.add(index);
        }
        return newSet;
      });
    }
  
    $: isActive = (index) => $activeIndices.has(index);
  
    function formatDate(dateString) {
      return dateString ? new Date(dateString).toLocaleString() : 'N/A';
    }
  
    function processVitalSigns() {
      if (level === 0) {
        // Top level: group by vital sign code
        const groupedByCode = {};
        vitalData.vitalSigns.forEach(vital => {
          if (vital && vital.code) {
            if (!groupedByCode[vital.code]) {
              groupedByCode[vital.code] = [];
            }
            groupedByCode[vital.code].push(vital);
          }
        });
  
        processedVitalSigns = Object.entries(groupedByCode).map(([code, vitals]) => ({
          title: `${code} (${vitals.length} records)`,
          children: vitals
        }));
      } else if (level === 1) {
        // Second level: group by date
        const groupedByDate = {};
        vitalData.vitalSigns.forEach(vital => {
          if (vital.effectiveDateTime) {
            const date = vital.effectiveDateTime.split('T')[0];
            if (!groupedByDate[date]) {
              groupedByDate[date] = [];
            }
            groupedByDate[date].push(vital);
          }
        });
  
        processedVitalSigns = Object.entries(groupedByDate).map(([date, vitals]) => ({
          title: `Date: ${date}`,
          children: vitals
        }));
      } else {
        // Final level: individual vital signs
        processedVitalSigns = vitalData.vitalSigns.map(vital => ({
          title: `Time: ${formatDate(vital.effectiveDateTime).split(', ')[1] || 'N/A'}`,
          content: renderVitalContent(vital)
        }));
      }
    }
  
    function renderVitalContent(vital) {
      if (!vital) return '<p>No data available</p>';
      return `
        <ul>
          <li><strong>ID:</strong> ${vital.id || 'N/A'}</li>
          <li><strong>Status:</strong> ${vital.status || 'N/A'}</li>
          <li><strong>Category:</strong> ${vital.category || 'N/A'}</li>
          <li><strong>Subject:</strong> ${vital.subject || 'N/A'}</li>
          <li><strong>Effective Date/Time:</strong> ${formatDate(vital.effectiveDateTime)}</li>
          <li><strong>Issued:</strong> ${formatDate(vital.issued)}</li>
          <li><strong>Performer:</strong> ${vital.performer || 'N/A'}</li>
          ${vital.value !== undefined ? `<li><strong>Value:</strong> ${vital.value} ${vital.unit || ''}</li>` : ''}
          ${vital.components ? `
            <li>
              <strong>Components:</strong>
              <ul>
                ${vital.components.map(component => `<li>${component.name || 'N/A'}: ${component.value || 'N/A'} ${component.unit || ''}</li>`).join('')}
              </ul>
            </li>
          ` : ''}
          ${vital.referenceRange ? `
            <li>
              <strong>Reference Range:</strong>
              ${vital.referenceRange.low !== undefined && vital.referenceRange.high !== undefined
                ? `${vital.referenceRange.low} - ${vital.referenceRange.high} ${vital.referenceRange.unit || ''}`
                : vital.referenceRange.text || 'N/A'}
            </li>
          ` : ''}
        </ul>
      `;
    }
  </script>
  
  <div class="accordion" style="padding-left: {level * 20}px">
    {#each processedVitalSigns as item, index}
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
              <svelte:self vitalData={{ vitalSigns: item.children }} level={level + 1} />
            {:else}
              {@html item.content}
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