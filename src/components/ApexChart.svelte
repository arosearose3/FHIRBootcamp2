<script>
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';

  export let options = {};
  export let series = [];

  let chart;
  let chartElement;
  let ApexCharts;

  onMount(async () => {
    if (browser) {
      try {
        ApexCharts = (await import('apexcharts')).default;
        if (chartElement) {
          chart = new ApexCharts(chartElement, { ...options, series });
          await chart.render();
        }
      } catch (error) {
        console.error('Error initializing ApexCharts:', error);
      }
    }
  });

  $: if (chart && ApexCharts) {
    try {
      chart.updateOptions(options);
      chart.updateSeries(series);
    } catch (error) {
      console.error('Error updating chart:', error);
    }
  }

  onDestroy(() => {
    if (chart) {
      chart.destroy();
    }
  });
</script>

<div bind:this={chartElement}></div>