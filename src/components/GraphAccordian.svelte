<script>
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import ApexChart from './ApexChart.svelte';

    export let vitalData = { total: 0, link: [], vitalSigns: [] };
    export let level = 0;

    const activeIndices = writable(new Set());
    let processedVitalSigns = [];
    let chartOptions = {};
    let series = [];
    let chartReady = false;


    let vitalSignsStr = '';

    vitalSignsStr = JSON.stringify(vitalData.vitalSigns);
    // console.log ("vitalSignsStr", vitalSignsStr);


    onMount(() => {
        if (browser) {
            chartReady = true;
        }
       
    });

    $: {
        processVitalSigns();
    }

    function toggleItem(index) {
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
            // Top level: group by vital sign code and prepare chart data
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
                children: vitals,
                chartData: prepareChartData(code, vitals)
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

    function prepareChartData(code, vitals) {
        if (code === "Blood Pressure") {
            return prepareBloodPressureChart(vitals);
        } else {
            return prepareSingleValueChart(code, vitals);
        }
    }

    function prepareBloodPressureChart(vitals) {
        const systolicData = [];
        const diastolicData = [];

        vitals.forEach(vital => {
            if (vital.components && vital.components.length === 2) {
                const timestamp = new Date(vital.effectiveDateTime).getTime();
                
                const systolic = vital.components.find(c => c.name === 'Systolic blood pressure');
                const diastolic = vital.components.find(c => c.name === 'Diastolic blood pressure');

                if (systolic && systolic.value) {
                    systolicData.push([timestamp, parseFloat(systolic.value)]);
                }

                if (diastolic && diastolic.value) {
                    diastolicData.push([timestamp, parseFloat(diastolic.value)]);
                }
            }
        });

        return {
            series: [
                { name: 'Systolic BP', data: systolicData },
                { name: 'Diastolic BP', data: diastolicData }
            ],
            options: {
                chart: { type: 'line', height: 350 },
                title: { text: 'Blood Pressure Over Time' },
                xaxis: { type: 'datetime' },
                yaxis: { title: { text: 'Blood Pressure (mmHg)' } },
                tooltip: { x: { format: 'dd MMM yyyy' } }
            }
        };
    }

    function prepareSingleValueChart(code, vitals) {
    if (vitals.length === 0) {
        return {
            series: [],
            options: {
                chart: { type: 'line', height: 350 },
                title: { text: `${code} Over Time` },
                xaxis: { type: 'datetime' },
                yaxis: { title: { text: 'Value' } },
                tooltip: { x: { format: 'dd MMM yyyy' } }
            }
        };
    }

    const data = vitals.map(vital => [
        new Date(vital.effectiveDateTime).getTime(),
        parseFloat(vital.value || 0)
    ]);

    // Extract the unit from the first vital sign, or use a default if not available
    const unit = vitals[0].unit || 'Value';

    return {
        series: [{ name: code, data: data }],
        options: {
            chart: { type: 'line', height: 350 },
            title: { text: `${code} Over Time` },
            xaxis: { type: 'datetime' },
            yaxis: { title: { text: unit } },
            tooltip: { x: { format: 'dd MMM yyyy' } }
        }
    };
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
                    {#if level === 0 && item.chartData && browser && chartReady}
                        <div class="vital-graph">
                            <ApexChart options={item.chartData.options} series={item.chartData.series} />
                        </div>
                    {/if}
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
    .vital-graph {
        width: 100%;
        max-width: 800px;
        margin: 20px auto;
    }
</style>