<script>
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import ApexChart from './ApexChart.svelte';

  export let vitalsData = [];

  let chartOptions = {};
  let series = [];
  let chartReady = false;

  onMount(async () => {
    if (browser) {
      chartReady = true;
      processVitalData();
    }
  });

  function processVitalData() {
    const systolicData = [];
    const diastolicData = [];

    vitalsData.forEach(vital => {
      if (vital.code === "Blood Pressure" && vital.components && vital.components.length === 2) {
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

    series = [
      { name: 'Systolic BP', data: systolicData },
      { name: 'Diastolic BP', data: diastolicData }
    ];

    seriesStr = JSON.stringify(series);

    chartOptions = {
      chart: {
        type: 'line',
        height: 350
      },
      title: {
        text: 'Blood Pressure Over Time'
      },
      xaxis: {
        type: 'datetime'
      },
      yaxis: {
        title: {
          text: 'Blood Pressure (mmHg)'
        }
      },
      tooltip: {
        x: {
          format: 'dd MMM yyyy'
        }
      }
    };
  }

  $: {
    if (browser && vitalsData && vitalsData.length > 0) {
      processVitalData();
    }
  }
</script>

<div class="vitals-graph">
  {#if browser && chartReady && series.length > 0 && series[0].data.length > 0}
    <ApexChart options={chartOptions} {series} />
  {:else}
    <p>Loading chart...</p>
  {/if}
</div>

<style>
  .vitals-graph {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }
</style>

