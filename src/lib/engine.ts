
import samples from '../samples.json'

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function createObserver(scannedUrls = {}) {
    return new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource' && Object.keys(scannedUrls).includes(entry.name)) {
                const scannedUrl = scannedUrls[entry.name]
                const timeToFetch = entry.responseEnd - entry.fetchStart
                scannedUrl.timeToFetch = timeToFetch
            }
        });
    });
}

async function sha256(str: string) {
    return new Uint8Array(await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(str))).toHex()
}

export async function getSamples(n: number = 100) {
    /*const randBundle = getRandomNumber(0, 7000)
    const url = `http://localhost:8080/jsonl/${randBundle}`
    const resp = await fetch(url)
    const lines = (await resp.text()).split('\n')
    const out = []
    for (let i = 0; i < n; i++) {
        const rand = getRandomNumber(0, lines.length)
        console.log(`Picking ${randBundle}:${rand}`)
        const doc = JSON.parse(lines[rand])
        out.push(doc.did)
    }*/
    const out: [] = []
    for (let i = 0; i < n; i++) {
        out.push(samples[getRandomNumber(0, 9999)])
    }
    return out
}

export async function runBenchmark(opts: any) {
    const endpoints = opts.endpoints
    const scannedUrls = {}
    const res = {
        results: {}
    }
    const observer = createObserver(scannedUrls)
    observer.observe({ type: 'resource', buffered: true })

    await Promise.all(endpoints.map(async (endpoint: any) => {
        const endpointRes = {
            responses: [],
            totalTime: 0,
            count: opts.values.length,
            processed: 0,
            done: false,
        }

        for (let i = 0; i < opts.values.length; i++) {
            const did = opts.values[i]
            const url = `${endpoint.url}/${did}?${Number(new Date())}`
            scannedUrls[url] = {}
            let didDoc = null;
            try {
                const resp = await fetch(url)
                didDoc = await resp.text()
            } catch (e) {}

            const responseTime = Math.round(scannedUrls[url].timeToFetch)
            endpointRes.responses.push({
                ok: !!didDoc,
                did,
                hash: didDoc ? await sha256(didDoc.trim()) : null,
                responseTime,
            })
            endpointRes.totalTime += responseTime
            endpointRes.processed++
            endpointRes.done = endpointRes.processed === endpointRes.count

            if (opts.onEndpointResult) {
                opts.onEndpointResult(endpoint, endpointRes)
            }            
        }
    }))
    if (opts.onEnd) {
        opts.onEnd(res)
    }
    return res
}