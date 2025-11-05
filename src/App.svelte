<script lang="ts">
  import { runBenchmark, getSamples } from './lib/engine'
  import data from './data.json'

  let plcResolvers = $state(data.plcResolvers)
  let isRunning: boolean = $state(false)
  let samples: any = $state([])
  let referenceSamples: any = $state([])

  function submit(e: any) {
    (async () => {
      samples = await getSamples(10)
      //console.log(samples)
      isRunning = true
      runBenchmark({
        endpoints: plcResolvers,
        values: samples,
        onEndpointResult: (endpoint: any, result: any) => {
          endpoint._status = result
          if (endpoint.url === 'https://plc.directory') {
            // use as reference
            referenceSamples = result.responses
          }
        },
        onEnd: () => isRunning = false
      })
    })()
    return e.preventDefault()
  }

</script>

<main class="m-4">
  <h1 class="text-2xl">AT Protocol Resolver Benchmark</h1>

  <form onsubmit={submit}>
    <div class="mt-6">
      <div class="input-group grid-cols-[1fr_auto]">
        <input class="ig-input" type="text" placeholder="Enter DID (or handle) ..." />
        <button class="ig-btn preset-filled">Run Benchmark</button>
      </div>
    </div>

    <div class="mt-4">
      <table class="table overflow-scroll">
        <thead>
          <tr>
            <th>Instance</th>
            <th>Status</th>
            <th>Time</th>
              {#each samples as sample, i}
                <th class="text-xs"><a href="https://web.plc.directory/did/{sample}" target="_blank" title={sample}>#{i+1}</a></th>
              {/each}
          </tr>
        </thead>
        <tbody>
          {#each plcResolvers as instance}
            <tr>
              <td>{instance.url.replace('https://', '')}</td>
              <td>
                {#if instance._status}
                  {#if instance._status?.done}✅{:else if instance._status?.error}❌{:else if isRunning}⌛{/if}
                  {instance._status.processed}/{instance._status.count}
                {/if}
              </td>
              <td>
                {#if instance._status?.totalTime}
                  {instance._status.totalTime}ms
                {/if}
              </td>
              <!--td></td-->
              {#if instance._status?.responses}
                {#each instance._status.responses as resp, i}
                  <!--td class="text-xs">{resp.responseTime}ms</td-->
                  <td class="text-xs">
                    <a href="{instance.url}/{resp.did}" target="_blank" class="{referenceSamples[i] ? (referenceSamples[i].hash !== resp.hash ? 'text-error-600' : 'text-green-600') : 'opacity-25'}">{resp.hash?.slice(0, 7)}</a><br/>
                    {resp.responseTime}ms
                  </td>
                {/each}
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </form>

  <!--div class="mt-4">
    <div>
      {#each samples as sample}
        <div>{sample}</div>
      {/each}
    </div>
  </div-->


</main>